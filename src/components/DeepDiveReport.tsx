import React from "react";
import {
  ArrowUpRight,
  Cpu,
  DollarSign,
  FileText,
  ListChecks,
  Sparkles,
  X,
} from "lucide-react";
import { AIModelUpdate } from "../types";

interface DeepDiveReportProps {
  update: AIModelUpdate | null;
  onClose: () => void;
}

function isCorruptedText(value?: string): boolean {
  if (!value) return true;
  const suspicious = (value.match(/[�]/g) || []).length;
  return suspicious > Math.max(3, value.length * 0.08);
}

function cleanText(value?: string, fallback = "這段資料仍需人工校正。"): string {
  if (!value || isCorruptedText(value)) return fallback;
  return value;
}

export default function DeepDiveReport({ update, onClose }: DeepDiveReportProps) {
  if (!update) return null;

  const features = update.keyFeatures?.filter((item) => !isCorruptedText(item)).slice(0, 6) ?? [];
  const useCases = update.useCases?.filter((item) => !isCorruptedText(item)).slice(0, 6) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <aside className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <header className="border-b border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-indigo-700">
                {update.vendor} · {update.releaseDate}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                {update.modelName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              aria-label="關閉詳情"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="text-sm font-bold text-slate-500">影響分數</span>
              <p className="mt-1 text-3xl font-black text-indigo-600">
                {update.impactScore}
                <span className="text-base text-slate-400"> / 10</span>
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="text-sm font-bold text-slate-500">分類</span>
              <p className="mt-2 text-lg font-bold text-slate-900">{update.category}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="text-sm font-bold text-slate-500">來源</span>
              {update.sourceUrl ? (
                <a
                  href={update.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-base font-bold text-indigo-700 hover:underline"
                >
                  開啟來源
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : (
                <p className="mt-2 text-base text-slate-500">未提供來源</p>
              )}
            </div>
          </div>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <Cpu className="h-5 w-5 text-slate-500" />
              摘要
            </h3>
            <p className="text-base leading-7 text-slate-700">
              {cleanText(update.chineseDescription)}
            </p>
          </section>

          <section className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50 p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
              <DollarSign className="h-5 w-5 text-emerald-700" />
              價格資訊
            </h3>
            <p className="text-base leading-7 font-semibold text-emerald-900">
              {cleanText(update.pricingModel, "價格資料待校正。")}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                特色
              </h3>
              {features.length > 0 ? (
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="text-base leading-7 text-slate-700">
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-slate-500">特色資料待校正。</p>
              )}
            </section>

            <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <ListChecks className="h-5 w-5 text-indigo-600" />
                適用情境
              </h3>
              {useCases.length > 0 ? (
                <ul className="space-y-2">
                  {useCases.map((useCase, index) => (
                    <li key={index} className="text-base leading-7 text-slate-700">
                      {useCase}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-slate-500">適用情境資料待校正。</p>
              )}
            </section>
          </div>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <FileText className="h-5 w-5 text-indigo-600" />
              接手備註
            </h3>
            <p className="text-base leading-7 text-slate-700">
              舊版深度報告由 AI 動態產生，且既有資料含大量亂碼。為避免使用者誤信壞資料，目前詳情頁只呈現可讀欄位與來源連結。
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}
