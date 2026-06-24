import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Filter,
  Search,
  SlidersHorizontal,
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
  if (!value) return "未提供";
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
          setLoadError("目前無法讀取後端資料，已改用內建模型目錄。");
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
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-950">
                AI模型-發佈情報站
              </h1>
              <p className="text-sm text-slate-600">
                監控範圍內、官方來源可確認的 AI 模型可用性目錄。
              </p>
            </div>
          </div>

          <a
            href="/AI_HANDOFF.md"
            className="inline-flex items-center gap-2 self-start rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200 md:self-auto"
          >
            更新紀錄
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-5 py-7">
        {loadError && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{loadError}</p>
          </div>
        )}

        <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-2">
              <h2 className="text-xl font-bold text-indigo-950">模型可用性目錄</h2>
              <p className="text-base leading-7 text-indigo-950">
                本站收錄「指定監控廠商與平台中，官方文件、API 文件、模型頁、定價頁、模型卡或公開平台頁面可確認的可用模型」。若模型僅由新聞、社群或 AI 搜尋發現，會先列為待查核，不視為正式可用模型。
              </p>
              <p className="text-base leading-7 text-indigo-950">
                本站整理市場上可用的 AI 模型，協助使用者依照文字、影像、語音、影片、embedding、reranking、coding、agent 等需求，快速查找可用模型、官方來源、計費方式與生命週期狀態。
              </p>
              <p className="text-base leading-7 text-indigo-950">
                監控範圍包含全球主流商用模型大廠、開源/開放權重模型，以及語音辨識、TTS、speaker diarization、影像生成、影片生成、embedding、reranking、程式碼與 agent 工作流等模型類型。
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-bold text-slate-500">已收錄模型數</span>
            <p className="mt-2 text-3xl font-black text-slate-950">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-bold text-slate-500">可用模型數</span>
            <p className="mt-2 text-3xl font-black text-emerald-700">{summary.usable}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-bold text-slate-500">待查核模型數</span>
            <p className="mt-2 text-3xl font-black text-amber-700">{summary.needsReview}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-bold text-slate-500">Retired 模型數</span>
            <p className="mt-2 text-3xl font-black text-rose-700">{summary.retired}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-bold text-slate-500">最後更新時間</span>
            <p className="mt-2 text-xl font-black text-slate-950">{summary.lastUpdated}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-bold text-slate-500">監控廠商數</span>
            <p className="mt-2 text-3xl font-black text-slate-950">{summary.vendors}</p>
          </div>
        </section>

        <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">模型目錄</h2>
              <p className="mt-1 text-sm text-slate-600">
                預設顯示官方來源確認、正式展示與 deprecated 模型；待確認、retired、unknown 可用篩選器開啟。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:min-w-[760px] xl:grid-cols-4">
              <label className="relative md:col-span-2 xl:col-span-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="搜尋模型、模型 ID、能力"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-base outline-none focus:border-indigo-500 focus:bg-white"
                />
              </label>

              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
                <Filter className="h-5 w-5 text-slate-400" />
                <select
                  value={vendorFilter}
                  onChange={(event) => setVendorFilter(event.target.value)}
                  className="w-full bg-transparent py-3 text-base font-medium outline-none"
                >
                  <option value="all">全部廠商</option>
                  {uniqueVendors.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
                <SlidersHorizontal className="h-5 w-5 text-slate-400" />
                <select
                  value={modalityFilter}
                  onChange={(event) => setModalityFilter(event.target.value)}
                  className="w-full bg-transparent py-3 text-base font-medium outline-none"
                >
                  <option value="all">全部模態</option>
                  {uniqueModalities.map((modality) => (
                    <option key={modality} value={modality}>
                      {modalityLabels[modality] || modality}
                    </option>
                  ))}
                </select>
              </label>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as DirectorySortKey)}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-base font-medium outline-none focus:border-indigo-500"
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
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-600">生命週期</span>
              {lifecycleOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleLifecycle(status)}
                  className={`rounded-md border px-3 py-2 text-sm font-bold ${
                    lifecycleFilter.includes(status)
                      ? lifecycleStyle(status)
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {lifecycleLabels[status]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-600">資料品質</span>
              {dataQualityOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleDataQuality(status)}
                  className={`rounded-md border px-3 py-2 text-sm font-bold ${
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

          <div className="text-base font-semibold text-slate-700">
            顯示 {filteredModels.length} / {catalog.length} 筆
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredModels.map((model) => (
              <article
                key={model.id}
                className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        {model.vendor}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-slate-950">
                        {model.modelName}
                      </h3>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-500">
                        {model.modelId}
                      </p>
                    </div>
                    <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${lifecycleStyle(model.lifecycleStatus)}`}>
                      {lifecycleLabels[model.lifecycleStatus]}
                    </span>
                  </div>

                  <p className="text-base leading-7 text-slate-600">
                    {readableText(model.summary)}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-slate-50 p-3">
                      <span className="font-bold text-slate-500">主要模態</span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {modalityLabels[model.primaryModality] || model.primaryModality}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <span className="font-bold text-slate-500">Context</span>
                      <p className="mt-1 font-semibold text-slate-900">{model.contextWindow}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <span className="font-bold text-slate-500">Input</span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {model.inputTypes.length ? model.inputTypes.join(", ") : "未提供"}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <span className="font-bold text-slate-500">Output</span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {model.outputTypes.length ? model.outputTypes.join(", ") : "未提供"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {model.availableVia.map((via) => (
                      <span key={via} className="rounded-md bg-blue-50 px-2 py-1 text-sm font-bold text-blue-700">
                        {availableViaLabels[via]}
                      </span>
                    ))}
                  </div>

                  <div className="rounded-md bg-emerald-50 p-3">
                    <span className="text-sm font-bold text-emerald-700">Pricing</span>
                    <p className="mt-1 text-sm font-semibold text-emerald-950">
                      {model.pricingSummary}
                    </p>
                    <p className={`mt-1 text-sm font-bold ${dataQualityStyle(model.dataQuality)}`}>
                      {dataQualityLabels[model.dataQuality]} · {model.pricingStatus}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-slate-50 p-3">
                      <span className="font-bold text-slate-500">上架 / 可用</span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(model.officialLaunchDate || model.firstAvailableDate)}
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <span className="font-bold text-slate-500">最後確認</span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(model.lastVerifiedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  {model.officialSourceUrls[0] ? (
                    <a
                      href={model.officialSourceUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      官方來源
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">無官方來源</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedModel(model)}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    詳情
                    <CalendarClock className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base text-slate-500">
              沒有符合目前篩選條件的模型。
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-950">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold">資料更新工作流</h2>
          </div>
          <p className="mt-2 text-base leading-7 text-slate-600">
            前台維持唯讀。系統背後可由每日排程讀取 vendors sourceUrls、fetch 官方來源、產生 contentHash、只在內容變化時重跑抽取、執行 gap check、更新生命週期狀態、保存 scan history，並更新前台可讀資料。
          </p>
        </section>
      </main>

      <DeepDiveReport model={selectedModel} onClose={() => setSelectedModel(null)} />
    </div>
  );
}
