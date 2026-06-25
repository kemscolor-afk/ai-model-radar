import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Database,
  ExternalLink,
  Filter,
  Search,
} from "lucide-react";
import DeepDiveReport from "./components/DeepDiveReport";
import { initialActiveCatalog } from "./data/active_catalog";
import { expandedSeedCatalog } from "./data/expanded_catalog";
import {
  availableViaLabels,
  countMonitoredVendors,
  dataQualityLabels,
  DirectoryModel,
  DirectorySortKey,
  getLastUpdated,
  lifecycleLabels,
  modalityLabels,
  normalizeDirectoryModel,
  readableText,
} from "./modelDirectory";
import { ActiveCatalogModel, DataQuality, LifecycleStatus, Vendor } from "./types";

const defaultVisibleLifecycle: LifecycleStatus[] = [
  "source_verified",
  "published",
  "deprecated",
];

const lifecycleOptions: LifecycleStatus[] = [
  "source_verified",
  "published",
  "deprecated",
  "discovered",
  "retired",
  "unknown",
];

const dataQualityOptions: DataQuality[] = [
  "verified",
  "pricing_unverified",
  "needs_review",
  "source_missing",
  "data_dirty",
  "retired_confirmed",
];

const summaryCards = [
  { key: "total", label: "已收錄模型數", tone: "text-slate-950" },
  { key: "usable", label: "可用模型數", tone: "text-emerald-700" },
  { key: "needsReview", label: "待查核模型數", tone: "text-amber-700" },
  { key: "retired", label: "已下架 / retired", tone: "text-rose-700" },
  { key: "lastUpdated", label: "最後更新時間", tone: "text-slate-950" },
  { key: "vendors", label: "監控廠商數", tone: "text-slate-950" },
] as const;

function lifecycleStyle(status: LifecycleStatus): string {
  if (status === "published" || status === "source_verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "deprecated") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "retired") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function dataQualityStyle(status: DataQuality): string {
  if (status === "verified") return "text-emerald-700";
  if (status === "pricing_unverified") return "text-amber-700";
  if (status === "retired_confirmed") return "text-rose-700";
  return "text-slate-600";
}

function formatDate(value?: string): string {
  if (!value) return "未確認";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split("T")[0];
}

function sortModels(models: DirectoryModel[], sortBy: DirectorySortKey): DirectoryModel[] {
  const copy = [...models];
  return copy.sort((a, b) => {
    if (sortBy === "vendor") return a.vendor.localeCompare(b.vendor);
    if (sortBy === "modelName") return a.modelName.localeCompare(b.modelName);
    if (sortBy === "primaryModality") return a.primaryModality.localeCompare(b.primaryModality);
    if (sortBy === "lifecycleStatus") return a.lifecycleStatus.localeCompare(b.lifecycleStatus);
    if (sortBy === "pricingStatus") return a.pricingStatus.localeCompare(b.pricingStatus);

    const aDate = a[sortBy] ? new Date(a[sortBy] as string).getTime() : 0;
    const bDate = b[sortBy] ? new Date(b[sortBy] as string).getTime() : 0;
    return bDate - aDate;
  });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <div className="mt-1 min-w-0 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

export default function App() {
  const [catalog, setCatalog] = useState<DirectoryModel[]>(
    [...initialActiveCatalog, ...expandedSeedCatalog].map(normalizeDirectoryModel)
  );
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedModel, setSelectedModel] = useState<DirectoryModel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [modalityFilter, setModalityFilter] = useState("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleStatus[]>(defaultVisibleLifecycle);
  const [dataQualityFilter, setDataQualityFilter] = useState<DataQuality[]>([
    "verified",
    "pricing_unverified",
    "needs_review",
    "source_missing",
    "retired_confirmed",
  ]);
  const [sortBy, setSortBy] = useState<DirectorySortKey>("lastVerifiedAt");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDirectory() {
      try {
        const [catalogResponse, vendorsResponse] = await Promise.all([
          fetch("/api/active-catalog"),
          fetch("/api/vendors"),
        ]);
        const catalogData = await catalogResponse.json();
        const vendorData = await vendorsResponse.json();
        if (cancelled) return;

        if (Array.isArray(catalogData.catalog)) {
          setCatalog(catalogData.catalog.map((model: ActiveCatalogModel) => normalizeDirectoryModel(model)));
        }
        if (Array.isArray(vendorData.vendors)) {
          setVendors(vendorData.vendors);
        }
      } catch {
        if (!cancelled) {
          setLoadError("模型目錄載入失敗，目前顯示本機預置資料。");
        }
      }
    }

    loadDirectory();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const visibleCleanModels = catalog.filter((model) => model.dataQuality !== "data_dirty");
    return {
      total: catalog.length,
      usable: visibleCleanModels.filter((model) =>
        ["source_verified", "published"].includes(model.lifecycleStatus)
      ).length,
      needsReview: catalog.filter((model) =>
        ["discovered", "unknown"].includes(model.lifecycleStatus) ||
        ["needs_review", "source_missing", "data_dirty"].includes(model.dataQuality)
      ).length,
      retired: catalog.filter((model) => model.lifecycleStatus === "retired").length,
      lastUpdated: getLastUpdated(catalog),
      vendors: countMonitoredVendors(vendors, catalog),
    };
  }, [catalog, vendors]);

  const uniqueVendors = useMemo(
    () => Array.from(new Set(catalog.map((model) => model.vendor))).sort(),
    [catalog]
  );

  const uniqueModalities = useMemo(
    () => Array.from(new Set(catalog.map((model) => model.primaryModality))).sort(),
    [catalog]
  );

  const filteredModels = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = catalog.filter((model) => {
      const searchable = [
        model.vendor,
        model.modelName,
        model.modelId,
        model.summary,
        model.capabilities.join(" "),
        model.inputTypes.join(" "),
        model.outputTypes.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesVendor = vendorFilter === "all" || model.vendor === vendorFilter;
      const matchesModality = modalityFilter === "all" || model.primaryModality === modalityFilter;
      const matchesLifecycle = lifecycleFilter.includes(model.lifecycleStatus);
      const matchesQuality = dataQualityFilter.includes(model.dataQuality);
      return matchesSearch && matchesVendor && matchesModality && matchesLifecycle && matchesQuality;
    });

    return sortModels(filtered, sortBy);
  }, [
    catalog,
    dataQualityFilter,
    lifecycleFilter,
    modalityFilter,
    searchTerm,
    sortBy,
    vendorFilter,
  ]);

  const toggleLifecycle = (status: LifecycleStatus) => {
    setLifecycleFilter((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    );
  };

  const toggleDataQuality = (status: DataQuality) => {
    setDataQualityFilter((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Database className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-950">AI模型-發佈情報站</h1>
            <p className="mt-1 text-sm text-slate-600">
              監控範圍內、官方來源可確認的 AI 模型可用性目錄。
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        {loadError && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{loadError}</p>
          </div>
        )}

        <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-5">
          <h2 className="text-xl font-bold text-indigo-950">模型可用性目錄</h2>
          <p className="mt-2 max-w-5xl text-base leading-7 text-indigo-950">
            本站收錄「指定監控廠商與平台中，官方文件、API 文件、模型頁、定價頁、模型卡或公開平台頁面可確認的可用模型」。若模型僅由新聞、社群或 AI 搜尋發現，會先列為待查核，不視為正式可用模型。
          </p>
          <p className="mt-2 max-w-5xl text-base leading-7 text-indigo-950">
            本站整理市場上可用的 AI 模型，協助使用者依照文字、影像、語音、影片、embedding（向量嵌入）、reranking（檢索排序重排）、coding（程式碼能力）、agent（代理工作流）等需求，快速查找官方來源、計費方式與生命週期狀態。
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <div key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-sm font-bold text-slate-500">{card.label}</span>
              <p className={`mt-2 truncate text-2xl font-black ${card.tone}`}>
                {summary[card.key]}
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                  <Filter className="h-5 w-5 text-indigo-600" />
                  篩選與排序
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  目前顯示 {filteredModels.length} / {catalog.length} 筆
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1.4fr)_1fr_1fr_1fr]">
              <label className="block">
                <span className="text-sm font-bold text-slate-600">搜尋</span>
                <span className="relative mt-2 block">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="模型、廠商、ID、能力"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-base outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-600">廠商</span>
                <select
                  value={vendorFilter}
                  onChange={(event) => setVendorFilter(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-base font-medium outline-none focus:border-indigo-500"
                >
                  <option value="all">全部廠商</option>
                  {uniqueVendors.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-600">模態</span>
                <select
                  value={modalityFilter}
                  onChange={(event) => setModalityFilter(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-base font-medium outline-none focus:border-indigo-500"
                >
                  <option value="all">全部模態</option>
                  {uniqueModalities.map((modality) => (
                    <option key={modality} value={modality}>
                      {modalityLabels[modality] || modality}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-600">排序</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as DirectorySortKey)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-base font-medium outline-none focus:border-indigo-500"
                >
                  <option value="lastVerifiedAt">最近確認</option>
                  <option value="officialLaunchDate">最近上架</option>
                  <option value="lastSeenAt">最近異動</option>
                  <option value="vendor">廠商</option>
                  <option value="modelName">模型名稱</option>
                  <option value="primaryModality">模態</option>
                  <option value="lifecycleStatus">生命週期狀態</option>
                  <option value="pricingStatus">價格是否已確認</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-600">生命週期</p>
                <div className="flex flex-wrap gap-2">
                  {lifecycleOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleLifecycle(status)}
                      className={`rounded-md border px-2.5 py-2 text-xs font-bold ${
                        lifecycleFilter.includes(status)
                          ? lifecycleStyle(status)
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {lifecycleLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-600">資料品質</p>
                <div className="flex flex-wrap gap-2">
                  {dataQualityOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleDataQuality(status)}
                      className={`rounded-md border px-2.5 py-2 text-xs font-bold ${
                        dataQualityFilter.includes(status)
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {dataQualityLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="hidden rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-black uppercase text-slate-500 lg:grid lg:grid-cols-[1.8fr_1.15fr_1fr_1.1fr_1fr_6.5rem] lg:gap-4">
              <span>模型</span>
              <span>模態 / 方式</span>
              <span>生命週期</span>
              <span>價格</span>
              <span>最後確認</span>
              <span className="text-right">操作</span>
            </div>

            {filteredModels.map((model) => (
              <article
                key={model.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="grid gap-4 lg:grid-cols-[1.8fr_1.15fr_1fr_1.1fr_1fr_6.5rem] lg:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-wide text-slate-500">{model.vendor}</p>
                    <h3 className="mt-1 truncate text-lg font-black text-slate-950">{model.modelName}</h3>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-500">{model.modelId}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {readableText(model.summary)}
                    </p>
                  </div>

                  <Field
                    label="模態 / 可用方式"
                    value={
                      <div className="space-y-2">
                        <span>{modalityLabels[model.primaryModality] || model.primaryModality}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {model.availableVia.map((via) => (
                            <span key={via} className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                              {availableViaLabels[via]}
                            </span>
                          ))}
                        </div>
                      </div>
                    }
                  />

                  <Field
                    label="生命週期"
                    value={
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${lifecycleStyle(model.lifecycleStatus)}`}>
                        {lifecycleLabels[model.lifecycleStatus]}
                      </span>
                    }
                  />

                  <Field
                    label="計費"
                    value={
                      <div className="space-y-1">
                        <p className="line-clamp-2 text-sm">{model.pricingSummary}</p>
                        <p className={`text-xs font-black ${dataQualityStyle(model.dataQuality)}`}>
                          {dataQualityLabels[model.dataQuality]} / {model.pricingStatus}
                        </p>
                      </div>
                    }
                  />

                  <Field
                    label="日期"
                    value={
                      <div className="space-y-1">
                        <p>最後確認：{formatDate(model.lastVerifiedAt)}</p>
                        <p className="text-xs text-slate-500">
                          上架 / 首次可用：{formatDate(model.officialLaunchDate || model.firstAvailableDate)}
                        </p>
                      </div>
                    }
                  />

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
                    {model.officialSourceUrls[0] && (
                      <a
                        href={model.officialSourceUrls[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                        aria-label="官方來源"
                        title="官方來源"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedModel(model)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                      aria-label="查看詳情"
                      title="查看詳情"
                    >
                      <CalendarClock className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {filteredModels.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-base text-slate-500">
                沒有符合目前篩選條件的模型。
              </div>
            )}
          </div>
        </section>
      </main>

      <DeepDiveReport model={selectedModel} onClose={() => setSelectedModel(null)} />
    </div>
  );
}
