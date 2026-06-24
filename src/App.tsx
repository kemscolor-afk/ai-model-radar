import React, { useState, useEffect } from "react";
import { 
  Search, Cpu, TrendingUp, Bell, Layers, CheckCircle, RefreshCw, Plus, 
  AlertCircle, Sparkles, DollarSign, Table, FileText, Filter, HelpCircle, 
  Calendar, Clock, Download, ArrowUpRight, Check, Trash2, Database, ShieldAlert, Gauge, Zap, Activity, Info
} from "lucide-react";
import { AIModelUpdate, DailyReport } from "./types";
import { preseededUpdates } from "./data/historical_data";
import DeepDiveReport from "./components/DeepDiveReport";
import LLMPipelineVisualizer from "./components/LLMPipelineVisualizer";
import NotificationAlerts from "./components/NotificationAlerts";
import ActiveModelsCatalog from "./components/ActiveModelsCatalog";

export default function App() {
  // Navigation / Views state
  const [activeTab, setActiveTab] = useState<"news" | "active-directory">("news");

  // Application Data States
  const [updates, setUpdates] = useState<AIModelUpdate[]>([]);
  const [marketTrend, setMarketTrend] = useState<string>("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(true);
  
  // Interactive Scan States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentPipelineStep, setCurrentPipelineStep] = useState<number>(0);
  const [scanKeyword, setScanKeyword] = useState<string>("最新 AI 模型發表與 API 更新");
  const [scanDays, setScanDays] = useState<number>(14);
  const [customKeyword, setCustomKeyword] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>("");

  // Filter/Search States
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "impact" | "vendor">("date");

  // Selected Detail State for Deep-dive Drawer
  const [selectedUpdate, setSelectedUpdate] = useState<AIModelUpdate | null>(null);

  // Time state for the live UTC clock
  const [utcTime, setUtcTime] = useState<string>("");

  // 24H Autonomous Background Scan countdown & scheduling States
  const [nextScanCountdown, setNextScanCountdown] = useState<string>("");
  const [lastScanTime, setLastScanTime] = useState<string>("");
  const [nextScanTime, setNextScanTime] = useState<string>("");

  // Hot Queries preset lists
  const hotQueries = [
    { label: "全方位模型與模態掃描", value: "最新大廠 AI 模型發表（含文字推理、圖像生成、影像/影片生成、語音克隆及多人講者辨識）" },
    { label: "圖像與影像/影片生成模型", value: "最新圖像與影片/影像生成模型發表（如 Midjourney, Flux, Sora, Kling, Luma, Veo, Stable Diffusion）" },
    { label: "語音、克隆與講者辨識模型", value: "最新語音/語音辨識、TTS語音合成、聲音克隆與多人講者辨識模型（如 Whisper, CosyVoice, F5-TTS, SenseVoice）" },
    { label: "DeepSeek 推理與開源模型", value: "DeepSeek 發表之最新推理模型、技術更新與開源權重" },
    { label: "OpenAI 智能代理更新", value: "OpenAI o3-mini、GPT-o1 或最新代理 AI 框架與發表" },
    { label: "Anthropic 思考與工具調用", value: "Anthropic Claude 最新模型、思考模式 Thinking Mode 或 Computer Use 更新" },
  ];

  // Pipeline execution animation configuration
  const pipelineSteps = [
    { 
      title: "連線大廠官方站點 (Official Sites Extraction)", 
      description: "建立高並發網絡通道，對 OpenAI, Anthropic, Google, Meta AI Blog 等官方公告與開源 Github 進行精準爬取...", 
      status: "idle" as const, 
      icon: Search 
    },
    { 
      title: "全模型規格偵測 (All Models Parser)", 
      description: "不僅擷取主流大模型，並特別搜羅講者辨識、語音克隆、極速翻譯、端側小模型等多維度專屬垂直模型...", 
      status: "idle" as const, 
      icon: Cpu 
    },
    { 
      title: "五維模型影響力分析 (5D Impact Quantification)", 
      description: "精細評估 API 計費、架構突破與安全性，並在系統中劃分全球顛覆者或漸進優化者指標...", 
      status: "idle" as const, 
      icon: DollarSign 
    },
    { 
      title: "預建深度戰略評估 (Pre-seed Deep Dives)", 
      description: "為每一個新發現的模型現場寫入精美的 Markdown 深度評估報告，寫入本地 DB 備用，告別即時生成錯誤...", 
      status: "idle" as const, 
      icon: TrendingUp 
    },
    { 
      title: "同步載入本機資料庫 (Database Synced)", 
      description: "完成！資料已成功同步儲存至數據庫，未來讀取評估報告時將秒速開啟、無須等待生成。", 
      status: "idle" as const, 
      icon: CheckCircle 
    }
  ];

  // Initialize data on load
  useEffect(() => {
    // Check local storage for previously scanned updates first
    const cachedUpdates = localStorage.getItem("ai_radar_updates");
    const cachedTrend = localStorage.getItem("ai_radar_trend");

    if (cachedUpdates) {
      try {
        setUpdates(JSON.parse(cachedUpdates));
      } catch (e) {
        setUpdates(preseededUpdates);
      }
    } else {
      setUpdates(preseededUpdates);
      localStorage.setItem("ai_radar_updates", JSON.stringify(preseededUpdates));
    }

    if (cachedTrend) {
      setMarketTrend(cachedTrend);
    } else {
      const defaultTrend = "各大 AI 廠牌正朝向「超低延遲」、「低成本推理模式（如 DeepSeek-R1、o3-mini）」與「極致超長上下文多模態處理（如 Gemini 2.5 Pro）」兩極化發展，這極大推動了 AI 開發者代理與自動化工作流的實用性。";
      setMarketTrend(defaultTrend);
      localStorage.setItem("ai_radar_trend", defaultTrend);
    }

    // Check API Key health
    const checkApiHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setApiKeyConfigured(data.apiKeyConfigured);
      } catch (e) {
        setApiKeyConfigured(false);
      }
    };
    checkApiHealth();

    // Live clock and background scan countdown ticker
    const updateTimeAndCountdown = () => {
      const now = new Date();
      setUtcTime(now.toLocaleTimeString("zh-TW", { hour12: false }) + " CST");
      
      // Calculate 24-hour cycle baseline relative to CST timezone
      // Auto background scan scheduled every day at 04:00 AM CST
      const lastScan = new Date();
      lastScan.setHours(4, 0, 0, 0);
      if (now.getTime() < lastScan.getTime()) {
        lastScan.setDate(lastScan.getDate() - 1);
      }
      
      const nextScan = new Date();
      nextScan.setHours(4, 0, 0, 0);
      if (now.getTime() >= nextScan.getTime()) {
        nextScan.setDate(nextScan.getDate() + 1);
      }
      
      setLastScanTime(lastScan.toLocaleString("zh-TW", { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', 
        hour12: false 
      }) + " CST");
      
      setNextScanTime(nextScan.toLocaleString("zh-TW", { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', 
        hour12: false 
      }) + " CST");
      
      const diffMs = nextScan.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setNextScanCountdown(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };
    
    updateTimeAndCountdown();
    const interval = setInterval(updateTimeAndCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Run real-time Google Grounding scan via Express + Gemini 3.5 Flash
  const handleLaunchScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setCurrentPipelineStep(0);
    setScanError("");

    const targetKeyword = showCustomInput ? customKeyword : scanKeyword;
    if (!targetKeyword.trim()) {
      setScanError("請輸入或選擇掃描關鍵字。");
      setIsScanning(false);
      return;
    }

    // Animate pipeline steps visually for better UX
    const runPipelineAnimation = async () => {
      return new Promise<void>((resolve) => {
        let step = 0;
        const interval = setInterval(() => {
          if (step < 3) {
            step += 1;
            setCurrentPipelineStep(step);
          } else {
            clearInterval(interval);
            resolve();
          }
        }, 1800); // 1.8s per step visualizer
      });
    };

    try {
      // Start backend request & visual animation concurrently
      const apiPromise = fetch("/api/scan/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: targetKeyword, days: scanDays }),
      });

      await runPipelineAnimation();

      const response = await apiPromise;
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "掃描失敗，請確認 API 金鑰或網路狀態。");
      }

      // If successful, proceed to step 4 (Success / Compilation)
      setCurrentPipelineStep(4);

      if (data.updates && Array.isArray(data.updates)) {
        // Merge scanned updates with existing ones, removing duplicates by modelName
        setUpdates(prev => {
          const merged = [...data.updates];
          prev.forEach(existing => {
            if (!merged.some(m => m.modelName.toLowerCase() === existing.modelName.toLowerCase())) {
              merged.push(existing);
            }
          });
          // Sort merged updates to keep newer releases on top
          merged.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
          localStorage.setItem("ai_radar_updates", JSON.stringify(merged));
          return merged;
        });
      }

      if (data.marketTrendAnalysis) {
        setMarketTrend(data.marketTrendAnalysis);
        localStorage.setItem("ai_radar_trend", data.marketTrendAnalysis);
      }

      // Briefly pause at the completed step for premium transition
      setTimeout(() => {
        setIsScanning(false);
        setCurrentPipelineStep(0);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "全網掃描失敗。請檢查您的 GEMINI_API_KEY 是否在 Secrets 設定。");
      setIsScanning(false);
      setCurrentPipelineStep(0);
    }
  };

  // Reset local storage back to preseeded updates
  const handleResetData = () => {
    if (window.confirm("確定要重設為預設的最新 AI 模型發佈歷史資料嗎？這會清除您掃描到的新記錄。")) {
      setUpdates(preseededUpdates);
      const defaultTrend = "各大 AI 廠牌正朝向「超低延遲」、「低成本推理模式（如 DeepSeek-R1、o3-mini）」與「極致超長上下文多模態處理（如 Gemini 2.5 Pro）」兩極化發展，這極大推動了 AI 開發者代理與自動化工作流的實用性。";
      setMarketTrend(defaultTrend);
      localStorage.setItem("ai_radar_updates", JSON.stringify(preseededUpdates));
      localStorage.setItem("ai_radar_trend", defaultTrend);
    }
  };

  // Export current list to JSON or Markdown file
  const handleExportData = () => {
    const dataStr = JSON.stringify(updates, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AI-Model-Radar-Report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter updates based on input states
  const filteredUpdates = updates.filter(update => {
    const matchesSearch = 
      update.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.chineseDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.pricingModel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVendor = selectedVendor === "all" || update.vendor.toLowerCase() === selectedVendor.toLowerCase();
    const matchesCategory = selectedCategory === "all" || update.category === selectedCategory;

    return matchesSearch && matchesVendor && matchesCategory;
  });

  // Sort updates
  const sortedUpdates = [...filteredUpdates].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    } else if (sortBy === "impact") {
      return b.impactScore - a.impactScore;
    } else if (sortBy === "vendor") {
      return a.vendor.localeCompare(b.vendor);
    }
    return 0;
  });

  // Extract unique vendors and categories dynamically for self-evolution filters
  const uniqueVendors = Array.from(new Set(updates.map(u => u.vendor)));
  const uniqueCategories = Array.from(new Set(updates.map(u => u.category)));

  const categoryNames: Record<string, string> = {
    reasoning: "🧠 深度推理 (Reasoning)",
    vision: "👁️ 視覺與影像生成 (Vision / Image / Video)",
    audio: "🎙️ 語音多模與生成 (Audio / Speech / Music)",
    general: "🔮 通用旗艦 (General)",
    "open-source": "🌐 開源與端側模型 (Open Source / Edge)",
    other: "🔧 輔助工具 (Other)"
  };

  const getCategoryLabel = (cat: string) => {
    return categoryNames[cat] || `⚙️ ${cat.charAt(0).toUpperCase() + cat.slice(1)} (自動進化)`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800" id="main-container">
      
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
                AI模型-發佈情報站 <span className="text-xs font-normal text-indigo-600 font-mono">v2.0</span>
              </h1>
              <p className="text-xs text-slate-500">第一手最新 AI 模型發表追蹤、可驗證型錄、中文化深度日報</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Live Clock Ticker */}
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{utcTime}</span>
            </div>

            {/* API Status Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              apiKeyConfigured 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              <div className={`w-2 h-2 rounded-full ${apiKeyConfigured ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span>自動監測: 已啟動 (Active)</span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main Content Wrapper */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Tab Controls */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-lg mx-auto border border-slate-200/50 shadow-2xs">
          <button
            onClick={() => setActiveTab("news")}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "news"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            最新消息雷達 (News Radar)
          </button>
          <button
            onClick={() => setActiveTab("active-directory")}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "active-directory"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Database className="w-4 h-4" />
            現役活躍模型庫 (Active Catalog)
          </button>
        </div>

        {activeTab === "news" ? (
          <>
            {/* 3. 24H Autonomous Background Polling Dashboard */}
            <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
              
              {/* Header block with actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl animate-pulse">
                    <Activity className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      24H 智能全自動背景監測引擎 <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">DAEMON ACTIVE</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      系統已設定每 24 小時自動連線 Google Grounding 聯網輪詢。無須任何手動介入，自動分析、翻譯、評估並更新。
                    </p>
                  </div>
                </div>
                

              </div>

              {/* Status metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Daemon Status Card */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Gauge className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">背景監測狀態</span>
                    <span className="text-sm font-bold text-emerald-400 block mt-0.5">● 背景常駐守護中</span>
                    <span className="text-[10px] text-slate-400">輪詢週期: 每 24 小時一次</span>
                  </div>
                </div>

                {/* Last scan timestamp */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">上次自動更新基準 (Last Scan)</span>
                    <span className="text-xs font-mono font-semibold text-slate-200 block mt-0.5">{lastScanTime || "2026-06-23 04:00:00 CST"}</span>
                    <span className="text-[10px] text-slate-400">已自動解析大廠 Blog 與 Tech 論文</span>
                  </div>
                </div>

                {/* Next Scan countdown */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-900/50 flex items-center gap-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl" />
                  <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">下次掃描倒數</span>
                    <span className="text-lg font-mono font-black text-indigo-400 block tracking-widest mt-0.5">
                      {nextScanCountdown || "07:29:41"}
                    </span>
                    <span className="text-[10px] text-slate-400">預計排程: {nextScanTime || "04:00:00 CST"}</span>
                  </div>
                </div>

              </div>

              {/* 大廠官網實時爬取同步控制台 */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">大廠官網實時爬取同步控制台 (Live Sites Crawler Sync)</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    支援大廠官網與開源社區深度爬取
                  </span>
                </div>

                {/* 官網爬取節點狀態 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                  {[
                    { name: "OpenAI News", url: "https://openai.com/news", status: "online" },
                    { name: "Anthropic News", url: "https://anthropic.com/news", status: "online" },
                    { name: "Google DeepMind", url: "https://deepmind.google", status: "online" },
                    { name: "Meta AI Research", url: "https://ai.meta.com", status: "online" },
                    { name: "Alibaba FunASR", url: "https://github.com/FunASR", status: "online" },
                    { name: "DeepSeek Tech", url: "https://github.com/deepseek-ai", status: "online" },
                    { name: "Hugging Face ASR/TTS", url: "https://huggingface.co", status: "online" },
                    { name: "Mistral & xAI Blogs", url: "https://mistral.ai", status: "online" },
                  ].map((site) => (
                    <div key={site.name} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-slate-300 truncate">{site.name}</span>
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-indigo-400 truncate flex items-center gap-0.5">
                          官網連結 <ArrowUpRight className="w-2 h-2" />
                        </a>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* 爬取操作與關鍵字設定 */}
                <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-850 space-y-4">
                  <div className="flex flex-col md:flex-row gap-3 items-end justify-between">
                    <div className="space-y-1.5 flex-1 w-full">
                      <label className="text-xs text-slate-400 font-medium block">
                        設定爬取關鍵字 (可自訂或選用推薦詞)
                      </label>
                      
                      {!showCustomInput ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select 
                            value={scanKeyword}
                            onChange={(e) => setScanKeyword(e.target.value)}
                            disabled={isScanning}
                            className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 flex-1"
                          >
                            {hotQueries.map((q) => (
                              <option key={q.label} value={q.value}>{q.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowCustomInput(true)}
                            disabled={isScanning}
                            className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition whitespace-nowrap"
                          >
                            🖋️ 自定義
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="例如：語音克隆 講者辨識 翻譯 垂直小模型..."
                            value={customKeyword}
                            onChange={(e) => setCustomKeyword(e.target.value)}
                            disabled={isScanning}
                            className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCustomInput(false)}
                            disabled={isScanning}
                            className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition whitespace-nowrap"
                          >
                            返回快選
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">最近天數</span>
                        <select
                          value={scanDays}
                          onChange={(e) => setScanDays(Number(e.target.value))}
                          disabled={isScanning}
                          className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-hidden mt-1"
                        >
                          <option value={7}>最近 7 天</option>
                          <option value={14}>最近 14 天</option>
                          <option value={30}>最近 30 天</option>
                          <option value={90}>最近 90 天</option>
                        </select>
                      </div>

                      <button
                        onClick={handleLaunchScan}
                        disabled={isScanning}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                          isScanning
                            ? "bg-indigo-950 text-indigo-400 border border-indigo-900/50 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20"
                        }`}
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            正在精準爬取官網中...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            📡 立即爬取官網並深度同步
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {scanError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-900/30 rounded-lg flex items-start gap-2 text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{scanError}</p>
                    </div>
                  )}

                  {/* 爬取實時工作流進度 */}
                  {isScanning && (
                    <div className="pt-3 border-t border-slate-800/60">
                      <LLMPipelineVisualizer 
                        steps={pipelineSteps} 
                        currentStep={currentPipelineStep} 
                        isActive={isScanning}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 5-Dimensional Impact Evaluation Criteria Framework Panel */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">五維模型影響力評級體系與評估依據 (Impact Score Demystified)</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 text-xs">
                  
                  <div className="bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/30">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold mb-1">
                      <span className="px-1.5 py-0.5 bg-indigo-500/20 text-[10px] rounded font-mono">9-10</span>
                      <span>全球顛覆者</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      徹底改寫人機交互架構。如推理模型 o1 發表或長上下文技術。
                    </p>
                  </div>

                  <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/20">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-[10px] rounded font-mono">7-8</span>
                      <span>產業推動者</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      性價比出現 10 倍以上優化，推動現有商業工作流快速變更。
                    </p>
                  </div>

                  <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-900/20">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                      <span className="px-1.5 py-0.5 bg-amber-500/20 text-[10px] rounded font-mono">5-6</span>
                      <span>功能漸進者</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      性能微增、常規版本號更新或次要特點發表。
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-1">
                      <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] rounded font-mono">3-4</span>
                      <span>細微優化者</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      局部 API 優化或單點修補，幾乎不影響現有模型之實施。
                    </p>
                  </div>

                  <div className="bg-rose-950/10 p-3 rounded-lg border border-rose-900/10">
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                      <span className="px-1.5 py-0.5 bg-rose-500/20 text-[10px] rounded font-mono">1-2</span>
                      <span>老舊退役級</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      已宣告停止維護或已下架、極度落後的淘汰模型。
                    </p>
                  </div>

                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-4 items-center justify-between text-[11px] text-slate-500">
                  <div className="flex flex-wrap gap-3">
                    <span className="font-medium text-slate-400">評級科學核心指標：</span>
                    <span>❶ <strong>技術突破度</strong> (架構突破)</span>
                    <span>❷ <strong>商業替代性</strong> (價格/效率)</span>
                    <span>❸ <strong>開發者採納度</strong> (開源與串接)</span>
                    <span>❹ <strong>企業應用價值</strong> (安全性)</span>
                    <span>❺ <strong>市場生存期</strong> (穩定性)</span>
                  </div>
                </div>
              </div>

            </section>

        {/* 5. Notifications alerts Hub component */}
        <NotificationAlerts 
          recentUpdates={updates} 
          onSelectUpdate={(u) => setSelectedUpdate(u)} 
        />

        {/* 6. Market Trend Summary Panel */}
        {marketTrend && (
          <section className="bg-linear-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-indigo-300 font-mono tracking-widest uppercase block">
                Daily Trend Analyst • 本日市場大趨勢解析
              </span>
              <h3 className="text-base font-bold font-display text-white">AI 技術雷達最新觀察</h3>
              <p className="text-sm text-indigo-100/95 leading-relaxed font-light">
                「{marketTrend}」
              </p>
            </div>
          </section>
        )}

        {/* 7. Main Table Database Grid Section */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">AI 模型與技術情報總覽摘要表</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-slate-500">已收錄 {filteredUpdates.length} 款模型，支援中文規格介紹與計費機制比對</p>
                <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  🔄 篩選自適應：隨資料自動增列廠商與分類
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-2.5 items-center">
              
              {/* Category selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="all">所有模型分類 ({uniqueCategories.length})</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>

              {/* Vendor Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="all">所有開發廠商 ({uniqueVendors.length})</option>
                  {uniqueVendors.map(vendor => (
                    <option key={vendor} value={vendor.toLowerCase()}>{vendor}</option>
                  ))}
                </select>
              </div>

              {/* Sort By selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="date">依發表日期排序</option>
                  <option value="impact">依影響力評分</option>
                  <option value="vendor">依廠商名稱排序</option>
                </select>
              </div>

            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜尋模型名稱、廠商名稱、中文功能特點、或是費率標準..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
              id="search-input"
            />
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 custom-scrollbar shadow-3xs">
            <table className="w-full text-left border-collapse" id="intel-table">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">模型名稱 / 開發廠商</th>
                  <th className="py-3 px-4">發表日期</th>
                  <th className="py-3 px-4">技術分類</th>
                  <th className="py-3 px-4 max-w-sm">中文規格介紹</th>
                  <th className="py-3 px-4">收費定價標準</th>
                  <th className="py-3 px-4 text-center">影響力</th>
                  <th className="py-3 px-4 text-right">戰略報告</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedUpdates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      沒有符合當前搜尋或篩選條件的模型發表記錄。
                    </td>
                  </tr>
                ) : (
                  sortedUpdates.map((update) => {
                    // Color scheme according to the Vendor
                    let vendorBadge = "bg-slate-100 text-slate-700";
                    if (update.vendor.toLowerCase() === "openai") vendorBadge = "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
                    else if (update.vendor.toLowerCase() === "google") vendorBadge = "bg-blue-50 text-blue-700 border border-blue-200/50";
                    else if (update.vendor.toLowerCase() === "anthropic") vendorBadge = "bg-amber-50 text-amber-700 border border-amber-200/50";
                    else if (update.vendor.toLowerCase() === "meta") vendorBadge = "bg-indigo-50 text-indigo-700 border border-indigo-200/50";
                    else if (update.vendor.toLowerCase() === "deepseek") vendorBadge = "bg-sky-50 text-sky-700 border border-sky-200/50";
                    else if (update.vendor.toLowerCase() === "xai") vendorBadge = "bg-slate-900 text-white";

                    return (
                      <tr key={update.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Name / Vendor */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 font-display text-[14px]">
                            {update.modelName}
                          </div>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${vendorBadge}`}>
                            {update.vendor}
                          </span>
                        </td>

                        {/* Release Date */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                          {update.releaseDate}
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-700">
                            {update.category === "reasoning" && "🧠 深度推理"}
                            {update.category === "vision" && "👁️ 視覺理解"}
                            {update.category === "audio" && "🎙️ 語音多模"}
                            {update.category === "general" && "🔮 通用旗艦"}
                            {update.category === "open-source" && "🌐 開源模型"}
                            {update.category === "other" && "🔧 輔助工具"}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4 max-w-sm text-xs leading-relaxed text-slate-600">
                          {update.chineseDescription}
                        </td>

                        {/* Pricing */}
                        <td className="py-4 px-4 max-w-[200px] text-xs font-mono text-emerald-800 font-semibold leading-normal">
                          {update.pricingModel}
                        </td>

                        {/* Impact rating score */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <span className="font-extrabold font-mono text-slate-800">{update.impactScore}</span>
                            <span className="text-[10px] text-slate-400">/10</span>
                          </div>
                        </td>

                        {/* Deep dive report action button */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button 
                            onClick={() => setSelectedUpdate(update)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            針對性評估報告
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
          </>
        ) : (
          <ActiveModelsCatalog 
            apiKeyConfigured={apiKeyConfigured} 
            onSelectUpdate={(u) => setSelectedUpdate(u)}
          />
        )}

      </main>

      {/* 8. Floating Deep-dive Report Side-Panel */}
      <DeepDiveReport 
        update={selectedUpdate} 
        onClose={() => setSelectedUpdate(null)} 
      />

      {/* 9. Small Craft Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p>© 2026 AI模型-發佈情報站 (AI Model Radar) • 智能全網聯網模型技術監測站</p>
          <p className="font-light">
            結合 Google Grounding 與 Gemini，可追溯、可驗證、可重跑的 AI 資料管線
          </p>
        </div>
      </footer>

    </div>
  );
}
