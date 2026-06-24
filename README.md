# AI模型-發佈情報站 / AI Model Radar

> **可追溯、可驗證、可重跑的 AI 模型情報管線**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0--flash-orange)](https://ai.google.dev/)

---

## 產品目的

**AI模型-發佈情報站**是一個 AI Model Intelligence 資訊網站，用來：

- 📡 **追蹤各大 AI 廠商的最新模型發佈**（OpenAI, Anthropic, Google, Meta, DeepSeek, xAI, Mistral 等）
- 📊 **技術更新、API 能力、收費方式**的中文化整理
- 🗂️ **現役模型可查詢型錄**：含官方來源快照、contentHash 驗證、資料缺口偵測
- ✅ **資料可信度展示**：每張模型卡顯示 reviewStatus、confidence、pricingStatus、gap flags

---

## 主要功能

### 🔥 Release Scan Pipeline（最新情報）
- 使用 Google Search Grounding 搜尋最近 7/14/30/90 天的 AI 新聞
- 只產生短摘要 + 重要性分數，不預先產生深度報告（節省 token）
- 深度評估報告改為按需生成（點擊後觸發 `/api/assess-deep`）

### 🗂️ Inventory Scan Pipeline（型錄盤點）
- **程式層實際 HTTP Fetch** 每個 vendor 的官方 sourceUrls
- 計算 **SHA-256 contentHash**；若 hash 未改變，跳過 LLM 抽取
- LLM 只讀取程式已 fetch 的 cleanedText，不使用 Google Search
- **程式層 Gap Check**（非 prompt）：偵測 pricing_page/api_reference/docs vs models_page 的不一致
- 去重使用 `vendorId + normalizedModelId`

### 💾 安全持久化
- Atomic write：先寫 `.tmp`，再 rename（最佳努力）
- 自動備份到 `.bak`
- Write queue 避免競態條件
- Server 重啟後，catalog、snapshots、scan sessions 全部保留

### 📊 資料可信度顯示
每個模型卡片顯示：
- `reviewStatus`：自動核實 / 待查核 / 人工核實
- `confidence`：高 / 中 / 低
- `pricingStatus`：官方確認 / 價格待確認 / 不適用
- `gapFlags`：資料缺口警告（含缺口來源類型）
- `lastVerifiedAt` + 官方來源連結

---

## 技術架構

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite + Tailwind CSS)                  │
│  ├── App.tsx           (主頁：News Radar / Active Catalog)  │
│  ├── ActiveModelsCatalog.tsx  (型錄頁 + 可信度 badges)      │
│  ├── DeepDiveReport.tsx       (側抽屜深度報告)              │
│  ├── NotificationAlerts.tsx   (通知系統)                    │
│  └── LLMPipelineVisualizer.tsx (掃描進度視覺化)             │
├─────────────────────────────────────────────────────────────┤
│  Backend (Express + tsx/esbuild)                            │
│  ├── server.ts                (全部 API routes)             │
│  ├── /api/health              GET  健康檢查                  │
│  ├── /api/vendors             GET  廠商清單 + sourceUrls    │
│  ├── /api/active-catalog      GET  現役模型型錄              │
│  ├── /api/historical          GET  歷史掃描更新              │
│  ├── /api/scan/releases       POST 最新情報掃描              │
│  ├── /api/scan/inventory      POST 型錄盤點（fetch+hash）   │
│  ├── /api/scan/snapshots      GET  source snapshots 列表    │
│  ├── /api/scan/snapshots/:id  GET  特定廠商 snapshots       │
│  ├── /api/scan/sessions       GET  掃描 sessions 歷史       │
│  ├── /api/assess-deep         POST 按需生成深度報告          │
│  └── /api/verify-deprecated   POST 模型存活狀態查證         │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (file-based)                                    │
│  ├── data_store.json          主持久化文件（原子寫入）       │
│  ├── src/data/vendors.ts      廠商 + sourceUrls 清單        │
│  ├── src/data/active_catalog.ts  預置型錄種子資料           │
│  └── src/data/historical_data.ts 預置歷史情報               │
└─────────────────────────────────────────────────────────────┘
```

---

## 環境變數

複製 `.env.example` 為 `.env` 並填入：

```env
# 必填：Gemini API 金鑰（從 https://aistudio.google.com/apikey 取得）
GEMINI_API_KEY="your-gemini-api-key-here"

# 選填：部署 URL
APP_URL="http://localhost:3000"
```

---

## 本地啟動

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（Express + Vite HMR）
npm run dev

# 開啟瀏覽器
open http://localhost:3000
```

### 生產建置

```bash
npm run build
npm start
```

---

## API Routes 速查

| Method | Route | 說明 |
|--------|-------|------|
| GET | `/api/health` | 健康狀態、API 金鑰確認 |
| GET | `/api/vendors` | 所有廠商 + sourceUrls |
| GET | `/api/active-catalog` | 現役模型型錄 |
| GET | `/api/historical` | 歷史掃描情報 |
| POST | `/api/scan/releases` | 最新發佈掃描（Google Search Grounding）|
| POST | `/api/scan/inventory` | 型錄盤點（HTTP fetch + hash + LLM 抽取）|
| GET | `/api/scan/snapshots` | Source snapshots 列表 |
| GET | `/api/scan/snapshots/:vendorId` | 特定廠商 snapshots |
| GET | `/api/scan/sessions` | 掃描 session 歷史 |
| POST | `/api/assess-deep` | 按需生成深度評估報告 |
| POST | `/api/verify-deprecated` | 查證模型存活狀態 |

---

## Roadmap

- [ ] **SQLite / Postgres 遷移**：取代 data_store.json，支援更大規模資料
- [ ] **定時自動掃描**：Cron job 每日 04:00 CST 自動執行 inventory + release scan
- [ ] **Diff 比較視圖**：對比兩次掃描的型錄變化（新增/移除/更新）
- [ ] **模型詳情頁**：獨立 URL 可連結分享的模型詳情
- [ ] **Webhook 通知**：型錄變更時通知 Slack / Discord / Email
- [ ] **多語言支援**：英文版界面
- [ ] **公開 API**：讓第三方服務查詢型錄資料
- [ ] **手動覆蓋**：允許人工核實並鎖定特定欄位，防止掃描覆蓋

---

## 資料來源聲明

本工具追蹤的資料來源均為各廠商公開的官方頁面（models page、pricing page、API reference、GitHub 等）。所有資料以官方來源為準，LLM 僅用於從已抓取文字中進行結構化抽取，不自行推測或補充未在官方頁面出現的資訊。

---

> Built with ❤️ by [kemscolor-afk](https://github.com/kemscolor-afk) • Powered by Google Gemini + React + Express
