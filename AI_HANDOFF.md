# AI 發佈情報站：AI 接手更新紀錄

## 2026-06-24 接手整理

### 背景

這個專案原本由 vibe coding 生成，存在幾個高風險問題：

- 大量中文文案與資料欄位出現亂碼，README、前端 UI、後端錯誤訊息與資料檔都有受影響。
- 前端同時使用 localStorage、後端 `data_store.json`、以及 `src/data/*.ts` 預置資料，導致資料來源混亂。
- 網站介面包含掃描、驗證、刪除、訂閱等控制，但使用者需求是「情報站只能瀏覽，不能影響設定及資料」。
- 後端 POST API 可觸發 Gemini 掃描與資料寫入，缺少權限與速率限制。
- `npm run lint` 原本因 `PORT` 型別不正確而失敗。
- 網頁字體偏小，不適合長時間閱讀。

### 已完成

- 將主畫面改為唯讀情報介面。
- 移除前端 localStorage 資料寫入，不再由瀏覽器覆蓋資料。
- 移除前端掃描、驗證、刪除、訂閱、系統通知等可能改變資料或設定的控制。
- Active Catalog 僅保留搜尋、篩選、狀態切換顯示、來源連結與詳情檢視。
- Deep Dive 詳情頁不再呼叫 AI 產生報告，避免消耗額度與產生新資料。
- 後端 `/api/scan/releases`、`/api/scan`、`/api/scan/inventory`、`/api/verify-deprecated`、`/api/assess-deep` 改為唯讀拒絕。
- 修正 `PORT` 型別，`npm run lint` 可通過。
- 將全站基礎字級提高到 17px，並放大主要輸入、卡片與按鈕文字。
- 新增本文件，並由 `/AI_HANDOFF.md` 提供瀏覽。
- 修正 `clean` script，避免 Windows PowerShell 下 `rm -rf` 失效。

### 現況

- 前端仍會讀取 `/api/historical` 與 `/api/active-catalog`。
- 若後端不可用，前端會退回 `src/data/historical_data.ts` 與 `src/data/active_catalog.ts` 的內建資料。
- 既有資料檔內仍有大量亂碼；目前 UI 會偵測疑似亂碼欄位並顯示「資料待校正」類文字，避免把壞資料直接呈現給使用者。
- `data_store.json` 仍存在且被 git 追蹤，之後若要正式部署，建議把 runtime data 移到資料庫或至少改成環境外掛載檔。

### 後續建議

- 逐步人工校正 `src/data/historical_data.ts`、`src/data/active_catalog.ts` 與 `data_store.json` 的中文內容。
- 若未來需要重新開放掃描，請建立管理後台、權限、速率限制、操作記錄與人工審核流程，不要放在公開瀏覽頁。
- 將資料來源統一成單一讀取層，避免前端 localStorage、TS 預置資料、JSON 檔三方分裂。
- 補上基本端到端測試，至少覆蓋首頁、目錄篩選、詳情抽屜與唯讀 POST 拒絕。
