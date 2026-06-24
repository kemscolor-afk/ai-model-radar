# AI 發佈情報站

AI 模型發佈與模型目錄的唯讀瀏覽網站。

## 目前定位

這個專案已改成「唯讀情報站」：

- 可以瀏覽 AI 模型發佈情報。
- 可以搜尋、篩選、排序與查看來源連結。
- 可以查看 Active Catalog 裡的模型狀態。
- 不提供掃描、驗證、刪除、訂閱、通知或資料庫控制功能。
- 所有會影響設定或資料的前端控制都已移除。

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

## 接手紀錄

請先閱讀 [AI_HANDOFF.md](./AI_HANDOFF.md)。該文件記錄了接手時看到的問題、已完成的整理，以及下一步建議。
