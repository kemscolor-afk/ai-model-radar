# AI 接手更新紀錄

## 2026-06-25

- 模型卡片列表改成單欄排列：每列只顯示一張模型卡片，全部上下堆疊，避免桌面版三欄卡片造成閱讀跳躍。
- 目前沒有使用資料庫。後端以本機 `data_store.json` 做 runtime 檔案式儲存，啟動時讀取，更新時寫入暫存檔後替換，並保留備份檔。
- `data_store.json` 已加入 `.gitignore`，不再推送到 GitHub；它應視為部署環境的本機資料檔。
- 種子資料仍放在 `src/data/*.ts`，包含預置模型目錄、擴充模型清單與廠商來源。
- `package.json` 沒有 SQLite、Postgres、MongoDB、Firebase、Supabase 等資料庫套件。
