import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { AIModelUpdate } from "../types";
import { X, ShieldAlert, Cpu, Sparkles, TrendingUp, DollarSign, ListChecks, FileText, Loader2, ArrowUpRight } from "lucide-react";

interface DeepDiveReportProps {
  update: AIModelUpdate | null;
  onClose: () => void;
}

export default function DeepDiveReport({ update, onClose }: DeepDiveReportProps) {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!update) return;

    const fetchDeepReport = async () => {
      setLoading(true);
      setError("");
      setReport("");

      // If the report is already pre-generated and stored in the database, read it directly
      if (update.deepDiveReport) {
        setReport(update.deepDiveReport);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/assess-deep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelUpdate: update }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "無法生成深度報告。");
        }

        setReport(data.report || "");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "載入深度評估報告時發生錯誤，請稍後再試。");
      } finally {
        setLoading(false);
      }
    };

    fetchDeepReport();
  }, [update]);

  if (!update) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-300">
      <div 
        className="relative h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out"
        id="deep-dive-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                AI 戰略衝擊分析
              </span>
              <span className="text-xs text-slate-500 font-mono">
                發表於 {update.releaseDate}
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 mt-1 flex items-center gap-2">
              {update.modelName} <span className="text-sm font-normal text-slate-500">by {update.vendor}</span>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close panel"
            id="btn-close-panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
              <span className="block text-xs text-slate-500 mb-1">影響力評分</span>
              <span className="text-2xl font-black font-mono text-indigo-600">{update.impactScore}</span>
              <span className="text-xs text-slate-400"> / 10 級</span>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
              <span className="block text-xs text-slate-500 mb-1">技術分類</span>
              <span className="text-sm font-semibold text-slate-800 uppercase block mt-1">
                {update.category === "reasoning" && "🧠 深度推理"}
                {update.category === "vision" && "👁️ 視覺理解"}
                {update.category === "audio" && "🎙️ 語音多模"}
                {update.category === "general" && "🔮 通用旗艦"}
                {update.category === "open-source" && "🌐 開源模型"}
                {update.category === "other" && "🔧 輔助工具"}
              </span>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-2xs flex flex-col justify-center items-center">
              <span className="block text-xs text-slate-500 mb-0.5">來源連結</span>
              {update.sourceUrl ? (
                <a 
                  href={update.sourceUrl} 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium mt-1"
                >
                  前往官網 <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">無連結</span>
              )}
            </div>
          </div>

          {/* Quick specs list */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-slate-500" /> 中文簡介
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                {update.chineseDescription}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-500" /> 收費方式與定價
              </h3>
              <div className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-lg flex items-start gap-2.5">
                <div className="mt-0.5 bg-emerald-100 text-emerald-800 p-1 rounded-sm text-xs font-bold font-mono">
                  PRICE
                </div>
                <div className="text-emerald-900 text-sm leading-relaxed font-mono font-medium">
                  {update.pricingModel}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-slate-500" /> 核心技術特點
                </h3>
                <ul className="space-y-1.5">
                  {update.keyFeatures?.map((f, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-slate-500" /> 推薦應用場景
                </h3>
                <ul className="space-y-1.5">
                  {update.useCases?.map((u, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Deep assessment dynamic report */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Gemini 3.5 智能針對性深度評估報告
              </h3>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs text-slate-500 animate-pulse font-medium">
                    正在即時聯網並深度評估其商業、代碼、安全與戰略影響...
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                  {error}
                </div>
              ) : report ? (
                <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed text-sm space-y-4">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-6">
                  <button 
                    onClick={() => {}}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                  >
                    重新生成報告
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>由 Gemini AI 研判與分級 • 100% 獨立科技雷達</span>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition shadow-sm"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
}
