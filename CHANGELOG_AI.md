# AI 接手更新紀錄

## 2026-06-25

- 主畫面改成桌面版「左側篩選欄 + 右側緊湊模型列表 + 詳情抽屜」；手機版維持直向列表，讓模型目錄更容易掃描與比較。
- 模型列預設只顯示廠商、模型名稱 / ID、摘要、模態、可用方式、生命週期、計費狀態、最後確認與官方來源；完整欄位仍放在詳情抽屜。
- 依操作回饋移除左側篩選欄，改為清單上方的「篩選與排序」控制區，搜尋、廠商、模態、排序與狀態 chips 都集中在結果列表前方。
- 試套 `Synthetic Intelligence Index` 深色玻璃感視覺主題；透過 `.synthetic-theme` CSS scope 覆蓋，方便不喜歡時 revert 單一 commit 回到原本淺色版。
- 新增 Dockerfile / .dockerignore，讓 Zeabur 以 Node Express 服務部署，而不是只部署靜態 Vite 檔案；否則 `/api/*` 會回首頁 HTML，前台會顯示「模型目錄載入失敗」。
- 新增 favicon 資產：`public/favicon.ico`、`favicon-32x32.png`、`apple-touch-icon.png`、`icon-192.png`，並在 `index.html` 設定對應 link。
- 模型卡片列表改成單欄排列：每列只顯示一張模型卡片，全部上下堆疊，避免桌面版三欄卡片造成閱讀跳躍。
- 目前沒有使用資料庫。後端以本機 `data_store.json` 做 runtime 檔案式儲存，啟動時讀取，更新時寫入暫存檔後替換，並保留備份檔。
- `data_store.json` 已加入 `.gitignore`，不再推送到 GitHub；它應視為部署環境的本機資料檔。
- 種子資料仍放在 `src/data/*.ts`，包含預置模型目錄、擴充模型清單與廠商來源。
- `package.json` 沒有 SQLite、Postgres、MongoDB、Firebase、Supabase 等資料庫套件。
