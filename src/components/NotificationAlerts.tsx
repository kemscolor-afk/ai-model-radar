import React, { useState, useEffect } from "react";
import { AIModelUpdate } from "../types";
import { Bell, Mail, Sparkles, CheckCircle, Smartphone, Volume2, ShieldAlert, X } from "lucide-react";

interface NotificationAlertsProps {
  recentUpdates: AIModelUpdate[];
  onSelectUpdate: (update: AIModelUpdate) => void;
}

export default function NotificationAlerts({ recentUpdates, onSelectUpdate }: NotificationAlertsProps) {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(false);
  const [alertsList, setAlertsList] = useState<{ id: string; message: string; update: AIModelUpdate; read: boolean }[]>([]);

  useEffect(() => {
    // Look at localStorage to check if user is already subscribed
    const savedEmail = localStorage.getItem("ai_radar_subscriber");
    if (savedEmail) {
      setEmail(savedEmail);
      setIsSubscribed(true);
    }

    const savedAudio = localStorage.getItem("ai_radar_audio_alert");
    if (savedAudio === "true") setAudioEnabled(true);

    const savedSystem = localStorage.getItem("ai_radar_system_alert");
    if (savedSystem === "true") setSystemAlerts(true);
  }, []);

  // Construct alerts dynamically from the newest high-impact updates (impact score >= 8)
  useEffect(() => {
    if (recentUpdates.length > 0) {
      const generatedAlerts = recentUpdates
        .filter(u => u.impactScore >= 8)
        .map(u => ({
          id: `alert-${u.id}`,
          message: `【重大發表】${u.vendor} 發表全新模型 ${u.modelName}！影響力估算為極高等級 (${u.impactScore}級)，點選查看中文報告與計費標準。`,
          update: u,
          read: false
        }));
      setAlertsList(generatedAlerts);
    }
  }, [recentUpdates]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    localStorage.setItem("ai_radar_subscriber", email);
    setIsSubscribed(true);

    // Play a gentle notify chime if enabled
    if (audioEnabled) {
      playChime();
    }
  };

  const playChime = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, context.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, context.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, context.currentTime + 0.2); // G5
      
      gain.gain.setValueAtTime(0.3, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
      
      osc.start();
      osc.stop(context.currentTime + 0.4);
    } catch (err) {
      console.warn("Audio notification not supported or blocked by policy", err);
    }
  };

  const handleToggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    localStorage.setItem("ai_radar_audio_alert", String(newState));
    if (newState) {
      playChime();
    }
  };

  const handleToggleSystemAlerts = () => {
    const newState = !systemAlerts;
    setSystemAlerts(newState);
    localStorage.setItem("ai_radar_system_alert", String(newState));
    
    if (newState && "Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("AI 發佈情報站已開啟", {
            body: "有任何各大 AI 廠商最新模型、技術發表時，您將會在此收到通知！",
            icon: "/favicon.ico"
          });
        }
      });
    }
  };

  const handleMarkAsRead = (id: string) => {
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Column 1 & 2: Alert Notification Feed */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-red-50 text-red-600 p-2 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display">即時模型情報推播 Feed</h3>
              <p className="text-xs text-slate-500">
                追蹤最新重大發表（影響力高於 8 分之模型）
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            {alertsList.filter(a => !a.read).length} 則未讀
          </span>
        </div>

        {alertsList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            目前暫無未讀的高影響力通知，執行「全網情報掃描」來探測最新發布！
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            {alertsList.map(alert => (
              <div 
                key={alert.id}
                onClick={() => {
                  handleMarkAsRead(alert.id);
                  onSelectUpdate(alert.update);
                }}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all duration-200 cursor-pointer flex gap-3 group relative overflow-hidden ${
                  alert.read 
                    ? "bg-slate-50/50 border-slate-100 text-slate-500" 
                    : "bg-indigo-50/30 border-indigo-100/50 text-slate-800 hover:bg-indigo-50/50"
                }`}
              >
                {!alert.read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                )}
                <div className="shrink-0 mt-0.5">
                  <Sparkles className={`w-4 h-4 ${alert.read ? 'text-slate-400' : 'text-indigo-600'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[13px]">{alert.message}</p>
                  <div className="flex gap-4 mt-1.5 text-[10px] text-slate-400 font-mono">
                    <span>廠商: {alert.update.vendor}</span>
                    <span>計費: {alert.update.pricingModel.substring(0, 30)}...</span>
                  </div>
                </div>
                {!alert.read && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(alert.id);
                    }}
                    className="p-1 rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 self-center"
                    title="標記為已讀"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Column 3: Subscription & Notice Setting Channel */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <h3 className="font-bold text-base font-display flex items-center gap-2 text-indigo-200">
            <Mail className="w-4 h-4 text-indigo-300" />
            自動通知訂閱與推播設定
          </h3>
          <p className="text-xs text-indigo-100/80 leading-relaxed">
            當雷達檢測到各大廠商有全新模型發佈時，會自動進行 LLM 中文化與價格分析。
          </p>
        </div>

        {/* Subscription Form */}
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-3">
          {isSubscribed ? (
            <div className="space-y-1.5 text-xs text-indigo-100">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" /> 訂閱成功！
              </div>
              <p className="text-white/80">已訂閱至: <span className="font-mono text-indigo-300">{email}</span></p>
              <button 
                onClick={() => {
                  localStorage.removeItem("ai_radar_subscriber");
                  setIsSubscribed(false);
                }}
                className="text-[10px] text-indigo-300 hover:underline hover:text-indigo-200"
              >
                取消訂閱或更換郵件
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <label className="block text-[11px] text-indigo-300 font-medium">訂閱 AI 模型發表日報（中文）</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/20 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-indigo-400 flex-1 font-mono"
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition"
                >
                  訂閱
                </button>
              </div>
            </form>
          )}
        </div>

        {/* System Settings Toggles */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium border-t border-white/10 pt-3">
          <button 
            onClick={handleToggleAudio}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg transition border ${
              audioEnabled 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            聲音提示: {audioEnabled ? "ON" : "OFF"}
          </button>
          <button 
            onClick={handleToggleSystemAlerts}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg transition border ${
              systemAlerts 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            瀏覽器通知: {systemAlerts ? "ON" : "OFF"}
          </button>
        </div>

      </div>

    </div>
  );
}
