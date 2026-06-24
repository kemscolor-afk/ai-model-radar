# 🎯 AI Radar & Model Catalog 專案目標與架構說明

本專案旨在打造一個極速、透明且具備高持久性的 **AI 模型情報雷達與動態型錄系統**，幫助開發者與企業即時掌握各大廠商（OpenAI, Anthropic, Google Gemini 等）的模型釋出動態、規格參數、計費結構與歷史戰略評估。

---

## 🚀 核心專案目標 (Project Goals)

### 1. 統一的 AI 模型型錄 (Unified Active Model Catalog)
* **消除資訊不對稱**：將分散在各大官網與 Hugging Face 的開源/閉源模型資料進行標準化收錄，包含模型識別碼 (`modelId`)、首選模態 (`primaryModality`)、計費模式 (`pricingStatus`) 與官方來源連結。
* **支援繁體中文本地化摘要**：針對非中文或高技術門檻的模型，自動提供精簡流暢的中文摘要（如 `summaryZh` 欄位），確保企業決策者能直觀理解其商業價值。

### 2. 即時盤點掃描 (Real-time Inventory Scanning)
* **主動探索與捕獲**：提供 API 掃描端點 (`/api/scan/inventory`)，模擬從外部官方來源、技術文檔或動態訂閱源中，即時探索新上線的模型規格。
* **完整落實審查流程**：記錄盤點過程中的狀態，列出所有捕獲模型的 `status`（如 active, deprecated）、`reviewStatus`（如 verified, needs_review）與 `confidence` 信心指數，拒絕忽略任何未知 (`unknown`) 或待審查之模型。

### 3. 無損輕量化本地持久化 (Zero-Loss File-based Persistence)
* **避免記憶體重置遺失**：在無需安裝龐大 Relational DB (如 PostgreSQL) 的輕量架構下，透過高效、具備同步備份與非同步寫入的 `/data_store.json` 文件儲存引擎，確保重新部署、伺服器重啟或開發環境刷新時，所有的掃描記錄與型錄異動皆能 100% 完整保留。

### 4. 戰略評估與深度分析 (Strategic Advice & Reports)
* **多維度商業洞察**：不僅提供參數規格，更整合專家級的歷史戰略分析（如 `historical_data.ts` 內的 SenseVoice 講者分離小模型、F5-TTS 評估），包含 **影響力評估 (Impact Assessment)** 與 **短期/中期落地建議 (Strategic Advice)**。

---

## 🛠️ 技術架構與資料流 (Technical Architecture)

```
┌────────────────────────────────────────────────────────┐
│                      瀏覽器前端                        │
│   (ActiveModelsCatalog, HistoricalUpdates, Search)     │
└───────────┬────────────────────────────▲───────────────┘
            │ 1. POST /api/scan/inventory│ 2. 獲取更新資料
            ▼                            │
┌────────────────────────────────────────┴───────────────┐
│                     Express 後端                       │
│    - 盤點掃描處理 (Scan Pipeline & Metadata Match)      │
│    - 暫存狀態記憶體管理 (In-Memory Database States)     │
└───────────┬────────────────────────────▲───────────────┘
            │ 3. 同步/非同步寫入 (Write)  │ 4. 啟動加載 (Load)
            ▼                            │
┌────────────────────────────────────────┴───────────────┐
│              持久化檔案儲存 (Data Store)                 │
│                 📄 /data_store.json                    │
└────────────────────────────────────────────────────────┘
```

### 關鍵模組說明：
1. **資料持久化機制 (`data_store.json`)**：
   * 位於專案根目錄，採用強固的 JSON 序列化機制。
   * 伺服器啟動時優先讀取該檔案；當有任何掃描捕獲（如 OpenAI / Anthropic 盤點）或市場趨勢更新時，即時寫入，完美解決無資料庫狀態下的資料遺失痛點。
2. **多重搜尋過濾器 (`src/components/ActiveModelsCatalog.tsx`)**：
   * 支援**全文模糊搜尋**，搜索詞同時比對模型名稱、廠商標籤、英文描述及繁體中文摘要 (`chineseDescription` 或 `summaryZh`)。
   * 提供多重快選抽屜（廠商、模型類別、生命週期狀態），實現毫秒級的高性能前端檢索。

---

## 📝 後續擴充規劃 (Roadmap)

- [ ] **第三方 API 主動對接**：在環境變數配置完成時，直接對接 Google Gemini API 做更深度的型錄自動分類。
- [ ] **即時動態警報 (Alerts)**：當捕獲到信心度過低 (`confidence < 0.5`) 或狀態標記為 `needs_review` 的模型時，於前端雷達控制面板醒目提示。
- [ ] **導出報表**：支援一鍵將已確認的型錄資料（Active Catalog）匯出成 CSV 或 JSON 格式，便於企業進行內部採購決策。
