import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Search,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { ActiveCatalogModel, AIModelUpdate } from "../types";
import { initialActiveCatalog } from "../data/active_catalog";

interface ActiveModelsCatalogProps {
  apiKeyConfigured: boolean;
  onSelectUpdate: (update: AIModelUpdate) => void;
}

const categoryLabels: Record<string, string> = {
  reasoning: "推理模型",
  vision: "影像 / 視覺",
  audio: "語音 / 音訊",
  general: "通用模型",
  "open-source": "開源 / 邊緣",
  other: "其他",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  preview: "Preview",
  beta: "Beta",
  legacy: "Legacy",
  deprecated: "Deprecated",
  possibly_deprecated: "Needs review",
  research_only: "Research",
  unknown: "Unknown",
};

function isCorruptedText(value?: string): boolean {
  if (!value) return true;
  const suspicious = (value.match(/[�]/g) || []).length;
  return suspicious > Math.max(3, value.length * 0.08);
}

function cleanText(value?: string, fallback = "資料待校正。"): string {
  if (!value || isCorruptedText(value)) return fallback;
  return value;
}

function getStatusStyle(status?: string): string {
  if (status === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "preview" || status === "beta") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "legacy") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "deprecated" || status === "possibly_deprecated") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function mapCatalogToUpdate(model: ActiveCatalogModel): AIModelUpdate {
  return {
    id: model.id,
    modelName: model.modelName,
    vendor: model.vendor,
    releaseDate: model.releaseDate,
    category: model.category,
    chineseDescription: cleanText(model.chineseDescription || model.summaryZh),
    pricingModel: `Input: ${model.pricingInput || model.pricing?.input1m || "N/A"} / Output: ${
      model.pricingOutput || model.pricing?.output1m || "N/A"
    }`,
    keyFeatures: model.keyFeatures || model.capabilities || [],
    useCases: [],
    impactScore:
      model.status === "deprecated" ? 2 : model.status === "legacy" ? 5 : 8,
    targetAudience: "需要比較 AI 模型狀態與成本的產品、工程與研究使用者。",
    impactAssessment: cleanText(model.notes || model.summaryZh),
    strategicAdvice: "此目錄目前為唯讀資料，正式採用前仍應查看官方來源確認。",
    sourceUrl: model.officialSourceUrls?.[0] || model.firstSeenSourceUrl,
  };
}

export default function ActiveModelsCatalog({
  apiKeyConfigured,
  onSelectUpdate,
}: ActiveModelsCatalogProps) {
  const [catalog, setCatalog] = useState<ActiveCatalogModel[]>(initialActiveCatalog);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hideDeprecated, setHideDeprecated] = useState(true);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/active-catalog");
      const data = await response.json();
      if (Array.isArray(data.catalog)) {
        setCatalog(data.catalog);
      }
    } catch {
      setLoadError("目前無法讀取後端目錄，已改用內建目錄。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const uniqueVendors = useMemo(
    () => Array.from(new Set(catalog.map((model) => model.vendor))).sort(),
    [catalog]
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Set(catalog.map((model) => model.category))).sort(),
    [catalog]
  );

  const filteredCatalog = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return catalog.filter((model) => {
      const description = cleanText(model.chineseDescription || model.summaryZh, "");
      const matchesSearch =
        !normalizedSearch ||
        model.modelName.toLowerCase().includes(normalizedSearch) ||
        model.vendor.toLowerCase().includes(normalizedSearch) ||
        description.toLowerCase().includes(normalizedSearch);
      const matchesVendor =
        selectedVendor === "all" || model.vendor.toLowerCase() === selectedVendor;
      const matchesCategory =
        selectedCategory === "all" || model.category === selectedCategory;
      const matchesDeprecated =
        !hideDeprecated ||
        (model.status !== "deprecated" && model.status !== "possibly_deprecated");
      return matchesSearch && matchesVendor && matchesCategory && matchesDeprecated;
    });
  }, [catalog, searchTerm, selectedVendor, selectedCategory, hideDeprecated]);

  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-indigo-50 p-2 text-indigo-600">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">活躍模型目錄</h2>
            <p className="mt-1 max-w-3xl text-base leading-7 text-slate-600">
              這裡只提供瀏覽、搜尋、篩選與來源檢視。掃描、驗證、刪除、訂閱與資料寫入功能都已移除。
            </p>
            <p className="mt-1 text-sm text-slate-500">
              AI 金鑰狀態：{apiKeyConfigured ? "已設定，但前端不提供寫入控制" : "未啟用"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchCatalog}
          className="rounded-md bg-slate-100 px-4 py-3 text-base font-bold text-slate-700 hover:bg-slate-200"
        >
          {loading ? "讀取中..." : "重新讀取"}
        </button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-base text-amber-800">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <label className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜尋模型、廠商或摘要"
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-base outline-none focus:border-indigo-500 focus:bg-white"
          />
        </label>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={selectedVendor}
            onChange={(event) => setSelectedVendor(event.target.value)}
            className="w-full bg-transparent py-3 text-base font-medium outline-none"
          >
            <option value="all">全部廠商</option>
            {uniqueVendors.map((vendor) => (
              <option key={vendor} value={vendor.toLowerCase()}>
                {vendor}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
          <Sliders className="h-5 w-5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full bg-transparent py-3 text-base font-medium outline-none"
          >
            <option value="all">全部分類</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category] || category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="text-base font-semibold text-slate-700">
          顯示 {filteredCatalog.length} / {catalog.length} 筆
        </div>
        <button
          type="button"
          onClick={() => setHideDeprecated((value) => !value)}
          className={`rounded-md px-4 py-2 text-sm font-bold ${
            hideDeprecated ? "bg-indigo-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
          }`}
        >
          {hideDeprecated ? "隱藏停用 / 待複核模型" : "顯示所有狀態"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filteredCatalog.map((model) => {
          const sourceUrl = model.officialSourceUrls?.[0] || model.firstSeenSourceUrl;
          const hasGapFlags = (model.gapFlags?.length ?? 0) > 0;

          return (
            <article
              key={model.id}
              className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      {model.vendor}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">
                      {model.modelName}
                    </h3>
                  </div>
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-bold ${getStatusStyle(
                      model.status
                    )}`}
                  >
                    {statusLabels[model.status || "unknown"] || model.status}
                  </span>
                </div>

                <p className="text-base leading-7 text-slate-600">
                  {cleanText(model.chineseDescription || model.summaryZh)}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-slate-50 p-3">
                    <span className="font-bold text-slate-500">分類</span>
                    <p className="mt-1 font-semibold text-slate-900">
                      {categoryLabels[model.category] || model.category}
                    </p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <span className="font-bold text-slate-500">Context</span>
                    <p className="mt-1 font-semibold text-slate-900">
                      {model.contextWindow || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-md bg-emerald-50 p-3">
                    <span className="font-bold text-emerald-700">Input</span>
                    <p className="mt-1 font-semibold text-emerald-950">
                      {model.pricingInput || model.pricing?.input1m || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-md bg-emerald-50 p-3">
                    <span className="font-bold text-emerald-700">Output</span>
                    <p className="mt-1 font-semibold text-emerald-950">
                      {model.pricingOutput || model.pricing?.output1m || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {model.reviewStatus && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-sm font-bold text-blue-700">
                      <ShieldCheck className="h-4 w-4" />
                      {model.reviewStatus}
                    </span>
                  )}
                  {model.lastVerifiedAt && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-sm font-bold text-slate-600">
                      <Clock className="h-4 w-4" />
                      {model.lastVerifiedAt.split("T")[0]}
                    </span>
                  )}
                  {hasGapFlags && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-sm font-bold text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      待複核
                    </span>
                  )}
                  {model.status === "active" && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-700">
                      <CheckCircle className="h-4 w-4" />
                      可用
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    來源
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-sm text-slate-400">無來源連結</span>
                )}
                <button
                  type="button"
                  onClick={() => onSelectUpdate(mapCatalogToUpdate(model))}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  詳情
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filteredCatalog.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base text-slate-500">
          沒有符合條件的模型。
        </div>
      )}
    </section>
  );
}
