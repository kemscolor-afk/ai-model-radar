import React from "react";
import { Search, Brain, Tags, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";

interface PipelineStep {
  title: string;
  description: string;
  status: "idle" | "loading" | "success" | "error";
  icon: any;
}

interface LLMPipelineVisualizerProps {
  currentStep: number;
  steps: PipelineStep[];
  isActive: boolean;
}

export default function LLMPipelineVisualizer({ currentStep, steps, isActive }: LLMPipelineVisualizerProps) {
  if (!isActive) return null;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
          <h3 className="font-bold font-display text-base">Gemini 智能雷達掃描工作流 Pipeline</h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Status: {currentStep < steps.length ? "Processing" : "Completed"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isDone = index < currentStep;
          const isIdle = index > currentStep;

          let cardBorder = "border-slate-800 bg-slate-950/40";
          let iconColor = "text-slate-500";
          let badgeText = "等待中";
          let badgeStyle = "bg-slate-800 text-slate-400";

          if (isCurrent) {
            cardBorder = "border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/20";
            iconColor = "text-indigo-400";
            badgeText = "執行中";
            badgeStyle = "bg-indigo-500/20 text-indigo-300 animate-pulse";
          } else if (isDone) {
            cardBorder = "border-emerald-800 bg-emerald-950/10";
            iconColor = "text-emerald-400";
            badgeText = "已完成";
            badgeStyle = "bg-emerald-500/20 text-emerald-300";
          }

          const IconComponent = step.icon;

          return (
            <div 
              key={index} 
              className={`relative border rounded-xl p-4 transition-all duration-300 flex flex-col justify-between ${cardBorder}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${isCurrent ? 'border-indigo-500/30 bg-indigo-950/40' : ''}`}>
                    {isCurrent ? (
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    ) : isDone ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <IconComponent className={`w-5 h-5 ${iconColor}`} />
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                    {badgeText}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span className="text-xs font-mono text-slate-500">0{index + 1}.</span> {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Progress Connector Line for Desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-2.5 w-5 h-0.5 bg-slate-800 z-10">
                  {isDone && <div className="h-full bg-emerald-500 w-full transition-all duration-500" />}
                  {isCurrent && <div className="h-full bg-indigo-500 w-1/2 animate-pulse" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
