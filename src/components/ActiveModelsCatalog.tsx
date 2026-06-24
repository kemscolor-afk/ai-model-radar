import React, { useState, useEffect, useCallback } from "react";
import { ActiveCatalogModel, AIModelUpdate } from "../types";
import { 
  Database, Search, Filter, Ban, CheckCircle, HelpCircle, RefreshCw, 
  Sparkles, DollarSign, Sliders, Trash2, AlertTriangle, FileText,
  ExternalLink, ShieldAlert, ShieldCheck, AlertCircle, Clock, Info
} from "lucide-react";

interface ActiveModelsCatalogProps {
  apiKeyConfigured: boolean;
  onSelectUpdate: (update: AIModelUpdate) => void;
}

export default function ActiveModelsCatalog({ apiKeyConfigured, onSelectUpdate }: ActiveModelsCatalogProps) {
  const [catalog, setCatalog] = useState<ActiveCatalogModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Filtering & Toggling
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // The core user request: "已經下架的模型就從這清單中除去" (Exclude deprecated/discontinued models)
  const [hideDeprecated, setHideDeprecated] = useState<boolean>(true);

  // Verification State for Custom Model
  const [verifyModelName, setVerifyModelName] = useState<string>("");
  const [verifyVendor, setVerifyVendor] = useState<string>("OpenAI");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<ActiveCatalogModel | null>(null);
  const [verifyError, setVerifyError] = useState<string>("");

  const [scanningInventory, setScanningInventory] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/active-catalog");
      const data = await response.json();
      if (data.catalog) {
        setCatalog(data.catalog);
      }
    } catch (e) {
      console.error("Failed to load active catalog", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleInventoryScan = async (vendorId?: string) => {
    setScanningInventory(true);
    setLastScanResult(null);
    try {
      const response = await fetch("/api/scan/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorId ? { vendorId } : {}),
      });
      const data = await response.json();
      setLastScanResult(data);
      if (data.success) {
        await fetchCatalog();
      }
    } catch (e: any) {
      setLastScanResult({ success: false, error: e.message });
    } finally {
      setScanningInventory(false);
    }
  };

  // Save changes (update state; server is source of truth)
  const saveCatalogLocally = (updated: ActiveCatalogModel[]) => {
    setCatalog(updated);
  };

  // Launch Gemini Live Verification for ANY model status
  const handleVerifyModelStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModelName.trim()) return;

    setVerifying(true);
    setVerifyError("");
    setVerificationResult(null);

    try {
      const response = await fetch("/api/verify-deprecated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName: verifyModelName, vendor: verifyVendor }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "核對下架狀態失敗。");
      }

      if (data.verifiedModel) {
        setVerificationResult(data.verifiedModel);
        
        // Ask if user wants to add or update this in the local catalog directory
        // Auto add to the local directory so the catalog stays live!
        const verified = data.verifiedModel;
        const generatedId = `verified-${Date.now()}`;
        const newModel: ActiveCatalogModel = {
          id: generatedId,
          modelName: verified.modelName,
          vendor: verified.vendor,
          releaseDate: verified.officialRetireDate !== "無" ? verified.officialRetireDate : "即時查詢",
          category: verified.category || "general",
          contextWindow: verified.contextWindow,
          pricingInput: verified.pricingInput,
          pricingOutput: verified.pricingOutput,
          status: verified.status as any,
          chineseDescription: verified.chineseDescription,
          keyFeatures: verified.keyFeatures || [],
          deprecatedReplacements: verified.deprecatedReplacements
        };

        setCatalog(prev => {
          const filtered = prev.filter(m => m.modelName.toLowerCase() !== newModel.modelName.toLowerCase());
          return [newModel, ...filtered];
        });
      }

    } catch (err: any) {
      console.error(err);
      setVerifyError(err.message || "連線核對下架狀態時出錯。請確保已配置 API 金鑰。");
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveFromCatalog = (id: string) => {
    if (window.confirm("確定要把此模型從目前名單中移除嗎？")) {
      const updated = catalog.filter(item => item.id !== id);
      saveCatalogLocally(updated);
    }
  };

  const categoryNames: Record<string, string> = {
    reasoning: "🧠 深度推理 (Reasoning)",
    vision: "👁️ 視覺理解 (Vision)",
    audio: "🎙️ 語音多模 (Audio)",
    general: "🔮 通用旗艦 (General)",
    "open-source": "🌐 開源模型 (Open Source)",
    other: "🔧 輔助工具 (Other)"
  };

  const getCategoryLabel = (cat: string) => {
    return categoryNames[cat] || `⚙️ ${cat.charAt(0).toUpperCase() + cat.slice(1)} (自動進化)`;
  };

  // Filter Catalog
  const filteredCatalog = catalog.filter(model => {
    // Search filter
    const desc = model.chineseDescription || model.summaryZh || "";
    const matchesSearch = 
      model.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVendor = selectedVendor === "all" || model.vendor.toLowerCase() === selectedVendor.toLowerCase();
    const matchesCategory = selectedCategory === "all" || model.category === selectedCategory;
    
    const matchesDeprecated = !hideDeprecated || (model.status !== "deprecated" && model.status !== "possibly_deprecated");
    return matchesSearch && matchesVendor && matchesCategory && matchesDeprecated;
  });

  const uniqueVendors = Array.from(new Set(catalog.map(u => u.vendor)));
  const uniqueCategories = Array.from(new Set(catalog.map(u => u.category)));

  const handleOpenDeepDive = (model: ActiveCatalogModel) => {
    const mapped: AIModelUpdate = {
      id: model.id,
      modelName: model.modelName,
      vendor: model.vendor,
      releaseDate: model.releaseDate,
      category: model.category,
      chineseDescription: model.chineseDescription || model.summaryZh || "",
      pricingModel: `輸入: ${model.pricingInput} / 輸出: ${model.pricingOutput} (${model.contextWindow})`,
      keyFeatures: model.keyFeatures,
      useCases: model.status === "deprecated" 
        ? ["歷史存檔比對", "退役系統遷移策略規劃"]
        : ["企業複雜整合運算", "大規模 AI Agent 工作流"],
      impactScore: model.status === "deprecated" ? 2 : model.status === "legacy" ? 5 : 8,
      targetAudience: "架構師與研發團隊、AI 同好",
      impactAssessment: `${model.modelName} 目前狀態為【${
        model.status === "deprecated" ? "已正式淘汰下架" : model.status === "legacy" ? "舊版過渡期模型" : "現役主要模型"
      }】。該模型由 ${model.vendor} 製造，支援 ${model.contextWindow} 的上下文窗格長度。`,
      strategicAdvice: model.deprecatedReplacements 
        ? `🚨 官方推薦替代模型方案：${model.deprecatedReplacements}` 
        : "在役推薦正常調用，無須策略變更。"
    };
    onSelectUpdate(mapped);
  };

  // --- Credibility helper renderers ---
  const renderReviewStatus = (status?: string) => {
    if (!status) return null;
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
      auto_verified: { label: "自動核實", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <ShieldCheck className="w-3 h-3" /> },
      manually_verified: { label: "人工核實", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <ShieldCheck className="w-3 h-3" /> },
      needs_review: { label: "待查核", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <ShieldAlert className="w-3 h-3" /> },
      ignored: { label: "已忽略", cls: "bg-slate-100 text-slate-500 border-slate-200", icon: <Info className="w-3 h-3" /> },
    };
    const cfg = map[status] || map.needs_review;
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${cfg.cls}`}>
        {cfg.icon}{cfg.label}
      </span>
    );
  };

  const renderPricingStatus = (status?: string, sourceUrl?: string) => {
    if (!status) return null;
    const map: Record<string, { label: string; cls: string }> = {
      official_found: { label: "官方確認", cls: "text-emerald-600" },
      official_not_found: { label: "價格待確認", cls: "text-amber-600" },
      ambiguous: { label: "價格模糊", cls: "text-orange-600" },
      not_applicable: { label: "不適用", cls: "text-slate-400" },
    };
    const cfg = map[status] || map.official_not_found;
    return (
      <span className={`text-[9px] font-bold ${cfg.cls} flex items-center gap-0.5`}>
        {cfg.label}
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-0.5 hover:underline" title="定價來源">
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        )}
      </span>
    );
  };

  const renderConfidence = (confidence?: string) => {
    const map: Record<string, string> = { high: "text-emerald-500", medium: "text-amber-500", low: "text-rose-500" };
    const label: Record<string, string> = { high: "高", medium: "中", low: "低" };
    if (!confidence) return null;
    return <span className={`text-[9px] font-bold ${map[confidence] || "text-slate-400"}`}>可信度: {label[confidence] || confidence}</span>;
  };

  const renderStatusRibbon = (model: ActiveCatalogModel) => {
    const s = model.status;
    if (s === "deprecated") return <div className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-800">已正式下架</div>;
    if (s === "possibly_deprecated") return <div className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800">⚠ 可能退役</div>;
    if (s === "legacy") return <div className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">舊版 (Legacy)</div>;
    if (s === "preview" || s === "beta") return <div className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">預覽/測試版</div>;
    if (s === "unknown") return <div className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600">未分類</div>;
    return <div className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">現役 (Active)</div>;
  };

  return (
    <div className="space-y-8" id="active-catalog-section">
      
      {/* 1. Header and Quick Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                各大廠現役活躍模型庫 (Active Directory)
              </h2>
              <p className="text-xs text-slate-500">
                收錄目前市面上各大廠商正在服役、尚未被下架的模型。包含定價、上下文長度及資料可信度狀態。
              </p>
            </div>
          </div>

          {/* Inventory Scan Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleInventoryScan()}
              disabled={scanningInventory || !apiKeyConfigured}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                scanningInventory || !apiKeyConfigured
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-200"
              }`}
              title={!apiKeyConfigured ? "需要設定 GEMINI_API_KEY" : "掃描核心廠商官方來源"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanningInventory ? "animate-spin" : ""}`} />
              {scanningInventory ? "掃描中..." : "🔍 掃描型錄"}
            </button>
            <button
              onClick={fetchCatalog}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              刷新
            </button>
          </div>

          {/* Switch: 已經下架的模型就從這清單中除去 */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-slate-700">自動排除/除去已下架退役模型</span>
            </div>
            <button
              onClick={() => setHideDeprecated(!hideDeprecated)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                hideDeprecated ? "bg-indigo-600" : "bg-slate-300"
              }`}
              id="toggle-hide-deprecated"
              role="switch"
              aria-checked={hideDeprecated}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  hideDeprecated ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dynamic Evolution Hint Banner */}
        <div className="bg-indigo-50/50 border border-indigo-100/40 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              <strong>🔄 篩選器智能自適應中：</strong>系統已動態偵測到資料庫中共有 <strong>{uniqueVendors.length} 間廠商</strong>與 <strong>{uniqueCategories.length} 種核心技術分類</strong>，未來有新大廠或新型號加入時將<strong>全自動進化更新</strong>。
            </span>
          </div>
        </div>

        {/* 2. Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜尋現役模型名稱、中文功能簡介或廠商..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 w-full focus:outline-hidden"
            >
              <option value="all">所有研發廠商 ({uniqueVendors.length})</option>
              {uniqueVendors.map(vendor => (
                <option key={vendor} value={vendor.toLowerCase()}>{vendor}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Sliders className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 w-full focus:outline-hidden"
            >
              <option value="all">所有技術分類 ({uniqueCategories.length})</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scan result banner */}
        {lastScanResult && (
          <div className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
            lastScanResult.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            {lastScanResult.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>
              {lastScanResult.success ? (
                <span>
                  掃描完成：新增 <strong>{lastScanResult.newModelsFound}</strong> 個模型，更新 <strong>{lastScanResult.modelsUpdated}</strong> 個，
                  產生 <strong>{lastScanResult.snapshotsCreated}</strong> 個快照。
                  {lastScanResult.gapCheckResults?.length > 0 && (
                    <span className="ml-1 text-amber-700">⚠ 偵測到 {lastScanResult.gapCheckResults.length} 個資料缺口。</span>
                  )}
                </span>
              ) : (
                <span>掃描失敗：{lastScanResult.error || "未知錯誤"}</span>
              )}
            </div>
          </div>
        )}

        {/* 3. Render Database Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCatalog.map(model => {
            const isDeprecated = model.status === "deprecated";
            const isLegacy = model.status === "legacy";
            const isPossiblyDeprecated = model.status === "possibly_deprecated";
            const hasGapFlags = (model.gapFlags?.length ?? 0) > 0;
            const pricing = model.pricing;

            return (
              <div 
                key={model.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 relative overflow-hidden group ${
                  isDeprecated 
                    ? "border-rose-100 bg-rose-50/20 opacity-75" 
                    : isPossiblyDeprecated
                      ? "border-orange-100 bg-orange-50/20"
                      : isLegacy 
                        ? "border-amber-100 bg-amber-50/20" 
                        : "border-slate-100 bg-white hover:shadow-md hover:border-slate-200"
                }`}
              >
                {/* Status Ribbon */}
                {renderStatusRibbon(model)}

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                      {model.vendor}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-display mt-0.5 pr-16">
                      {model.modelName}
                    </h3>
                    {/* Credibility badges row */}
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {renderReviewStatus(model.reviewStatus)}
                      {renderConfidence(model.confidence)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed min-h-[48px]">
                    {model.chineseDescription || model.summaryZh}
                  </p>

                  <hr className="border-slate-100" />

                  {/* Pricing and Context metrics */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="block text-[10px] text-slate-400 font-sans">上下文長度</span>
                      <span className="font-bold text-slate-800 block mt-0.5">{model.contextWindow}</span>
                    </div>
                    <div className="bg-emerald-50/40 p-2 rounded-lg">
                      <span className="block text-[10px] text-emerald-600 font-sans flex items-center gap-1">
                        Input 費率
                        {renderPricingStatus(
                          pricing?.pricingStatus as string,
                          pricing?.pricingSourceUrl || model.pricingSourceUrl
                        )}
                      </span>
                      <span className="font-bold text-emerald-800 block mt-0.5">{model.pricingInput}</span>
                    </div>
                  </div>

                  {/* Gap flag warning */}
                  {hasGapFlags && (
                    <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-start gap-1.5 text-[10px] text-amber-800">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>
                        <strong>資料缺口：</strong>{model.gapFlags?.join("、")}
                      </span>
                    </div>
                  )}

                  {/* Replacements details */}
                  {model.deprecatedReplacements && (
                    <div className="bg-indigo-50/40 border border-indigo-100/30 p-2.5 rounded-lg text-[11px]">
                      <span className="block text-[10px] text-indigo-600 font-bold mb-0.5">
                        {isDeprecated ? "取代它的推薦模型：" : "已被此模型替代之舊系列："}
                      </span>
                      <span className="text-indigo-950 font-medium">{model.deprecatedReplacements}</span>
                    </div>
                  )}

                  {/* Features tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {model.keyFeatures?.slice(0, 3).map((feat, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm text-[10px]">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleOpenDeepDive(model)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    產出針對性評估報告
                  </button>
                  {/* Source links & timestamps */}
                  <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-400">
                    {model.lastVerifiedAt && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        核實: {model.lastVerifiedAt.split("T")[0]}
                      </span>
                    )}
                    {(model.officialSourceUrls?.[0] || model.firstSeenSourceUrl) && (
                      <a
                        href={model.officialSourceUrls?.[0] || model.firstSeenSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 hover:text-indigo-500 hover:underline"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        官方來源
                      </a>
                    )}
                    <button 
                      onClick={() => handleRemoveFromCatalog(model.id)}
                      className="ml-auto p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                      title="從我的資料庫除名"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCatalog.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">查無對應之活躍現役模型</p>
            <p className="text-xs text-slate-400 mt-1">您可以嘗試關閉「排除已下架模型」開關，或重新輸入篩選條件。</p>
          </div>
        )}

      </div>

      {/* 4. Live Model Verification Playground via Google Search Grounding */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
        
        <div className="flex items-start gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-white font-display">新模型/舊模型存活狀態「即時查證雷達」</h3>
            <p className="text-xs text-slate-400">
              懷疑某款模型已經下架或被替代了？輸入名稱，讓 Gemini 透過 Google Search 進行即時生存核對。
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyModelStatus} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-400">模型精確名稱</label>
            <input 
              type="text" 
              required
              disabled={verifying}
              value={verifyModelName}
              onChange={(e) => setVerifyModelName(e.target.value)}
              placeholder="例如: GPT-3.5 Turbo, Claude 2.1, Gemini 1.0 Ultra, Llama 3 70B..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:bg-black transition font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400">開發廠商</label>
            <select
              value={verifyVendor}
              disabled={verifying}
              onChange={(e) => setVerifyVendor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:border-indigo-500 font-bold"
            >
              <option value="OpenAI">OpenAI</option>
              <option value="Google">Google</option>
              <option value="Anthropic">Anthropic</option>
              <option value="Meta">Meta</option>
              <option value="DeepSeek">DeepSeek</option>
              <option value="xAI">xAI</option>
              <option value="Microsoft">Microsoft</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className={`w-full py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition ${
              verifying 
                ? "bg-indigo-900 text-indigo-300 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-950/50"
            }`}
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                正在聯網查證中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                即時查證下架狀態
              </>
            )}
          </button>
        </form>

        {verifyError && (
          <div className="p-3.5 bg-red-500/10 text-red-300 text-xs rounded-xl border border-red-500/20">
            {verifyError}
          </div>
        )}

        {/* Verification result visual display */}
        {verificationResult && (
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                  {verificationResult.vendor}
                </span>
                <h4 className="font-bold text-white text-base font-display">
                  {verificationResult.modelName}
                </h4>
              </div>
              
              {/* Status Badge */}
              {verificationResult.status === "deprecated" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  已確認下架停用 (Deprecated)
                </span>
              ) : verificationResult.status === "legacy" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  舊版仍可用 (Legacy)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  正常現役在線 (Active)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 space-y-3">
                <div>
                  <span className="text-slate-500 font-bold block mb-0.5">中文定位與現狀解析</span>
                  <p className="text-slate-300 leading-relaxed font-light text-sm">
                    {verificationResult.chineseDescription}
                  </p>
                </div>

                {verificationResult.deprecatedReplacements && (
                  <div className="bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10">
                    <span className="text-indigo-400 font-bold block mb-0.5">推薦官方替代方案：</span>
                    <p className="text-indigo-100 font-semibold">{verificationResult.deprecatedReplacements}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">退役/下架日期</span>
                  <span className="text-white font-bold">{verificationResult.releaseDate || "無"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">上下文視窗大小</span>
                  <span className="text-white font-bold">{verificationResult.contextWindow}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">API 每百萬 input</span>
                  <span className="text-emerald-400 font-bold">{verificationResult.pricingInput}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">API 每百萬 output</span>
                  <span className="text-emerald-400 font-bold">{verificationResult.pricingOutput}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>核對來源: Google Grounding 聯網搜尋 • 資料已自動彙總並儲存至本機活躍清單</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> 已自動更新資料庫
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
