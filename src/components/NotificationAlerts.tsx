import React from "react";
import { AlertTriangle, Bell, FileText } from "lucide-react";
import { AIModelUpdate } from "../types";

interface NotificationAlertsProps {
  recentUpdates: AIModelUpdate[];
  onSelectUpdate: (update: AIModelUpdate) => void;
}

export default function NotificationAlerts({
  recentUpdates,
  onSelectUpdate,
}: NotificationAlertsProps) {
  const highImpactUpdates = recentUpdates
    .filter((update) => update.impactScore >= 8)
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 4);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-rose-50 p-2 text-rose-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">高影響更新</h2>
            <p className="text-sm text-slate-600">
              只依目前資料顯示提醒，不訂閱、不儲存信箱，也不發送系統通知。
            </p>
          </div>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
          {highImpactUpdates.length} 筆
        </span>
      </div>

      {highImpactUpdates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-base text-slate-500">
          目前沒有影響分數 8 分以上的更新。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {highImpactUpdates.map((update) => (
            <button
              key={update.id}
              type="button"
              onClick={() => onSelectUpdate(update)}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-700">
                <AlertTriangle className="h-4 w-4" />
                影響分數 {update.impactScore}/10
              </div>
              <h3 className="text-lg font-bold text-slate-950">{update.modelName}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {update.vendor} · {update.releaseDate}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                查看詳情
                <FileText className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
