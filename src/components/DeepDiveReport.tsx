import React from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Cpu,
  DollarSign,
  FileText,
  Layers,
  ListChecks,
  Network,
  X,
} from "lucide-react";
import {
  availableViaLabels,
  dataQualityLabels,
  DirectoryModel,
  lifecycleLabels,
  modalityLabels,
  readableText,
} from "../modelDirectory";

interface DeepDiveReportProps {
  model: DirectoryModel | null;
  onClose: () => void;
}

function formatDate(value?: string): string {
  if (!value) return "未提供";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split("T")[0];
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <span className="block text-sm font-bold text-slate-500">{label}</span>
      <div className="mt-1 break-words text-base font-semibold text-slate-900">
        {value || "未提供"}
      </div>
    </div>
  );
}

export default function DeepDiveReport({ model, onClose }: DeepDiveReportProps) {
  if (!model) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <aside className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <header className="border-b border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-indigo-700">{model.vendor}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                {model.modelName}
              </h2>
              <p className="mt-1 break-all text-sm font-semibold text-slate-500">
                {model.modelId}
              </p>
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
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <Cpu className="h-5 w-5 text-indigo-600" />
              模型用途說明
            </h3>
            <p className="text-base leading-7 text-slate-700">{readableText(model.summary)}</p>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <DetailRow label="生命週期狀態" value={lifecycleLabels[model.lifecycleStatus]} />
            <DetailRow label="主要模態" value={modalityLabels[model.primaryModality] || model.primaryModality} />
            <DetailRow label="資料品質" value={dataQualityLabels[model.dataQuality]} />
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <ListChecks className="h-5 w-5 text-indigo-600" />
              能力與輸入輸出
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow
                label="capabilities"
                value={
                  model.capabilities.length ? (
                    <div className="flex flex-wrap gap-2">
                      {model.capabilities.map((capability) => (
                        <span key={capability} className="rounded-md bg-indigo-50 px-2 py-1 text-sm font-bold text-indigo-700">
                          {capability}
                        </span>
                      ))}
                    </div>
                  ) : undefined
                }
              />
              <DetailRow label="contextWindow" value={model.contextWindow} />
              <DetailRow label="inputTypes" value={model.inputTypes.length ? model.inputTypes.join(", ") : undefined} />
              <DetailRow label="outputTypes" value={model.outputTypes.length ? model.outputTypes.join(", ") : undefined} />
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <Network className="h-5 w-5 text-indigo-600" />
              可用方式
            </h3>
            <div className="flex flex-wrap gap-2">
              {model.availableVia.map((via) => (
                <span key={via} className="rounded-md bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                  {availableViaLabels[via]}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50 p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
              <DollarSign className="h-5 w-5 text-emerald-700" />
              計費 pricing
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow label="計費摘要 pricing" value={model.pricingSummary} />
              <DetailRow label="pricingStatus" value={model.pricingStatus} />
              <DetailRow label="計費詳情 pricing details" value={model.pricingDetails} />
              <DetailRow
                label="pricingSourceUrl"
                value={
                  model.pricingSourceUrl ? (
                    <a href={model.pricingSourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-700 hover:underline">
                      開啟價格來源
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : undefined
                }
              />
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              日期與生命週期
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <DetailRow label="首次確認 firstSeenAt" value={formatDate(model.firstSeenAt)} />
              <DetailRow label="官方上架 officialLaunchDate" value={formatDate(model.officialLaunchDate)} />
              <DetailRow label="首次可用 firstAvailableDate" value={formatDate(model.firstAvailableDate)} />
              <DetailRow label="deprecatedAt" value={formatDate(model.deprecatedAt)} />
              <DetailRow label="retiredAt" value={formatDate(model.retiredAt)} />
              <DetailRow label="最後確認 lastVerifiedAt" value={formatDate(model.lastVerifiedAt)} />
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <Layers className="h-5 w-5 text-indigo-600" />
              官方來源
            </h3>
            {model.officialSourceUrls.length ? (
              <div className="space-y-2">
                {model.officialSourceUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    <span className="break-all">{url}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-base text-slate-500">尚未提供官方來源。</p>
            )}
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <FileText className="h-5 w-5 text-indigo-600" />
              查核資訊
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <DetailRow label="reviewStatus" value={model.reviewStatus} />
              <DetailRow label="dataQuality" value={dataQualityLabels[model.dataQuality]} />
              <DetailRow label="lifecycleStatus" value={lifecycleLabels[model.lifecycleStatus]} />
            </div>
            {model.notes && (
              <p className="text-base leading-7 text-slate-700">{model.notes}</p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
