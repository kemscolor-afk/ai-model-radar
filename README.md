# AI模型-發佈情報站

監控範圍內、官方來源可確認的 AI 模型可用性目錄。

## 目前定位

這個專案目前定位為「AI 模型可用性目錄」：

- 回答目前監控範圍內有哪些 AI 模型可以使用。
- 顯示模型能做什麼、由哪個廠商提供、可用方式、計費方式與生命週期狀態。
- 顯示官方來源、最後確認時間、上架與下架相關日期。
- 不提供掃描、驗證、刪除、訂閱、通知或資料庫控制功能。
- 前台維持唯讀；每日資料更新由後台排程執行。

本站收錄「指定監控廠商與平台中，官方文件、API 文件、模型頁、定價頁、模型卡或公開平台頁面可確認的可用模型」。若模型僅由新聞、社群或 AI 搜尋發現，會先列為待查核，不視為正式可用模型。

## 常用指令

```bash
npm install
npm run dev
npm run lint
npm run build
npm start
```

開發伺服器預設位於：

```text
http://localhost:3000
```

## 後端 API

唯讀端點：

- `GET /api/health`
- `GET /api/historical`
- `GET /api/active-catalog`
- `GET /api/vendors`
- `GET /api/scan/snapshots`
- `GET /api/scan/snapshots/:vendorId`
- `GET /api/scan/sessions`
- `GET /AI_HANDOFF.md`

已停用的寫入或耗額度端點：

- `POST /api/scan/releases`
- `POST /api/scan`
- `POST /api/scan/inventory`
- `POST /api/verify-deprecated`
- `POST /api/assess-deep`

這些 POST 端點會回傳 `403 READ_ONLY_MODE`。

## 後台更新工作流

前台不提供手動掃描。後端使用 `node-cron` 每日 04:00 Asia/Taipei 執行模型目錄更新：

1. 讀取 vendors sourceUrls。
2. 逐一 fetch 官方來源。
3. 產生 contentHash。
4. 若 hash 無變化，不重跑抽取。
5. 若 hash 有變化，才進行 LLM extraction。
6. 執行程式層 gap check。
7. 更新模型生命週期狀態。
8. 保存 scan history。
9. 更新前台可讀資料。

可用 `ENABLE_SCHEDULED_SCAN=false` 停用排程。

## 接手紀錄

請先閱讀 [AI_HANDOFF.md](./AI_HANDOFF.md)。該文件記錄了接手時看到的問題、已完成的整理，以及下一步建議。
