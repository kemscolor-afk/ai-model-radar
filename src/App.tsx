import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AIModelUpdate } from "./types";
import { preseededUpdates } from "./data/historical_data";
import DeepDiveReport from "./components/DeepDiveReport";
import NotificationAlerts from "./components/NotificationAlerts";
import ActiveModelsCatalog from "./components/ActiveModelsCatalog";

type Tab = "news" | "catalog";
type SortKey = "date" | "impact" | "vendor";

const categoryLabels: Record<string, string> = {
  reasoning: "推理模型",
  vision: "影像 / 視覺",
  audio: "語音 / 音訊",
  general: "通用模型",
  "open-source": "開源 / 邊緣",
  other: "其他",
};

function isCorruptedText(value?: string): boolean {
  if (!value) return true;
  const suspicious = (value.match(/[�]/g) || []).length;
  return suspicious > Math.max(3, value.length * 0.08);
}

function cleanText(value?: string, fallback = "這筆資料仍需人工校正，暫不顯示原始亂碼內容。"): string {
  if (!value || isCorruptedText(value)) return fallback;
  return value;
}

function getCategoryLabel(category: string): string {
  return categoryLabels[category] || category;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [updates, setUpdates] = useState<AIModelUpdate[]>(preseededUpdates);
  const [marketTrend, setMarketTrend] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<AIModelUpdate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReadOnlyData() {
      try {
        const [healthResponse, historicalResponse] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/historical"),
        ]);

        const health = await healthResponse.json();
        const historical = await historicalResponse.json();
        if (cancelled) return;

        setApiKeyConfigured(Boolean(health.apiKeyConfigured));
        if (Array.isArray(historical.updates)) {
          setUpdates(historical.updates);
        }
        if (historical.marketTrend && !isCorruptedText(historical.marketTrend)) {
          setMarketTrend(historical.marketTrend);
        }
      } catch {
        if (!cancelled) {
          setLoadError("目前無法連線到後端，已改用內建資料顯示。");
        }
      }
    }

    loadReadOnlyData();
    return () => {
      cancelled = true;
    };
  }, []);

  const uniqueVendors = useMemo(
    () => Array.from(new Set(updates.map((update) => update.vendor))).sort(),
    [updates]
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Set(updates.map((update) => update.category))).sort(),
    [updates]
  );

  const sortedUpdates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return updates
      .filter((update) => {
        const description = cleanText(update.chineseDescription, "");
        const matchesSearch =
          !normalizedSearch ||
          update.modelName.toLowerCase().includes(normalizedSearch) ||
          update.vendor.toLowerCase().includes(normalizedSearch) ||
          description.toLowerCase().includes(normalizedSearch);
        const matchesVendor =
          selectedVendor === "all" || update.vendor.toLowerCase() === selectedVendor;
        const matchesCategory =
          selectedCategory === "all" || update.category === selectedCategory;
        return matchesSearch && matchesVendor && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "impact") return b.impactScore - a.impactScore;
        if (sortBy === "vendor") return a.vendor.localeCompare(b.vendor);
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });
  }, [updates, searchTerm, selectedVendor, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Cpu className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-950">
                AI 發佈情報站
              </h1>
              <p className="text-sm text-slate-600">
                唯讀模式：提供 AI 模型發佈、狀態與來源資訊瀏覽，不在網站內修改資料。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
              資料筆數 {updates.length}
            </span>
            <span
              className={`rounded-md border px-3 py-1.5 font-medium ${
                apiKeyConfigured
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }`}
            >
              AI 金鑰 {apiKeyConfigured ? "已設定" : "未啟用"}
            </span>
          </div>
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
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-800">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-lg font-bold">接手後已改為唯讀情報介面</h2>
              </div>
              <p className="max-w-3xl text-base leading-7 text-indigo-950">
                本頁只保留搜尋、篩選、排序、查看詳情與開啟來源連結。原本會掃描、驗證、刪除或寫入資料的控制都已從介面移除。
              </p>
            </div>
            <a
              href="/AI_HANDOFF.md"
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 hover:bg-indigo-50"
            >
              <FileText className="h-4 w-4" />
              更新紀錄
            </a>
          </div>
        </section>

        <div className="flex max-w-xl rounded-lg border border-slate-200 bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("news")}
            className={`flex-1 rounded-md px-4 py-3 text-base font-bold transition ${
              activeTab === "news" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            發佈情報
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`flex-1 rounded-md px-4 py-3 text-base font-bold transition ${
              activeTab === "catalog" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            活躍模型目錄
          </button>
        </div>

        {activeTab === "news" ? (
          <>
            {marketTrend && (
              <section className="rounded-lg bg-slate-950 p-6 text-white">
                <div className="mb-2 flex items-center gap-2 text-indigo-200">
                  <TrendingUp className="h-5 w-5" />
                  <h2 className="text-lg font-bold">市場趨勢摘要</h2>
                </div>
                <p className="text-base leading-7 text-slate-200">{marketTrend}</p>
              </section>
            )}

            <NotificationAlerts recentUpdates={updates} onSelectUpdate={setSelectedUpdate} />

            <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">發佈情報列表</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    可搜尋與篩選，但不會修改資料來源。
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:min-w-[680px]">
                  <label className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="搜尋模型或廠商"
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

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortKey)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-base font-medium outline-none focus:border-indigo-500"
                  >
                    <option value="date">依日期排序</option>
                    <option value="impact">依影響分數排序</option>
                    <option value="vendor">依廠商排序</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${
                    selectedCategory === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  全部分類
                </button>
                {uniqueCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold ${
                      selectedCategory === category
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {getCategoryLabel(category)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {sortedUpdates.map((update) => (
                  <article
                    key={update.id}
                    className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span className="font-bold text-indigo-700">{update.vendor}</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {update.releaseDate}
                          </span>
                          <span>{getCategoryLabel(update.category)}</span>
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-slate-950">
                          {update.modelName}
                        </h3>
                      </div>
                      <div className="rounded-md bg-slate-950 px-3 py-2 text-center text-white">
                        <span className="block text-lg font-black">{update.impactScore}</span>
                        <span className="text-xs text-slate-300">/10</span>
                      </div>
                    </div>

                    <p className="text-base leading-7 text-slate-600">
                      {cleanText(update.chineseDescription)}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="text-sm font-semibold text-emerald-700">
                        {cleanText(update.pricingModel, "價格資料待校正")}
                      </span>
                      <div className="flex gap-2">
                        {update.sourceUrl && (
                          <a
                            href={update.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            來源
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedUpdate(update)}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                          詳情
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <ActiveModelsCatalog
            apiKeyConfigured={apiKeyConfigured}
            onSelectUpdate={setSelectedUpdate}
          />
        )}
      </main>

      <DeepDiveReport update={selectedUpdate} onClose={() => setSelectedUpdate(null)} />
    </div>
  );
}
