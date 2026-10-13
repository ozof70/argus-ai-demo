# Argus AI — 十路全流程 Demo

創創入門第四組的創新創業產品展示。10 路影像為瀏覽器合成動畫；後端規則、事件、人員回報與操作紀錄是真正的 API 與 SQL 資料保存。網站與競賽簡報分開，本儲存庫僅包含產品程式碼。

## 立即體驗

https://argus-ai-class-demo.fancy-curry-3072.chatgpt.site

## 本機啟動

需要 Node.js 22.13 或更新版本，沒有第三方依賴。

```sh
npm start
# 開啟 http://127.0.0.1:8765
npm test
```

資料保存在 .data/argus.sqlite，重新整理或重啟服務仍會保留。PORT 可指定埠號，ARGUS_DB_PATH 可指定資料檔案。展示資料不應包含真實人員或事件內容。

## 完整展示流程

1. 初次開啟由後端建立獨立工作區，包含10路鏡頭與A至E五個分區。
2. 選擇鏡頭與疑似倒地、持續低位或區域聚集情境。
3. 後端計算時間窗，條件成立後建立事件；輪詢頁面收到通知。
4. 開啟值班連結，可在另一頁或裝置共用該展示工作區。
5. 接案、到場、選擇確認結果，填寫回報後結案。
6. 模擬斷線會停止新判讀，既有事件保留；未接案超過門檻會升級。
7. 修改規則與分區、查看操作紀錄、匯出CSV，或封存並重置展示。

## 後端與部署

本機使用 Node HTTP + node:sqlite。相同 API 核心可打包成 Cloudflare Worker，使用 D1 DB 綁定；0000_argus_demo.sql 為資料庫結構。npm run build 產生含前端資產的獨立 Worker。正式遷移由部署工具執行，API 不在請求期間建立資料表。

## 主要檔案

- api.mjs：時間規則、事件狀態、工作區隔離、分區、匯出與操作紀錄。
- sqlite.mjs、local.mjs：本機資料庫與HTTP伺服器。
- index.html、app.js、style.css、logo.svg：十路監看與值班介面。
- backend.test.mjs：後端自動檢查，涵蓋持續門檻、去重、斷線、合法狀態、升級、資料隔離、值班共用、匯出及重置。
- build-worker.mjs：將前後端組合成單一 Worker。

## API

GET /api/health、/api/bootstrap、/api/state
POST /api/scenarios、/api/events/:id/ack、/api/events/:id/arrived、/api/events/:id/closed
PATCH /api/cameras/:id、/api/settings
GET /api/join?token=...、/api/export
POST /api/reset

## 模擬與實作邊界

沒有真實攝影機、RTSP解碼或AI模型推論。畫面動畫和姿態輸入是模擬；因此10路Demo不能證明64路影像推論容量、辨識精確率或商用可用性。通知為網頁狀態與提示，不是SMS或現場救援。

工作區以隨機、HttpOnly、SameSite Cookie隔離；公開Demo不用登入。持有值班連結的人可操作對應工作區。值班頁是展示角色介面，不是企業身分驗證系統。沒有真實敏感資料用途或企業服務等級承諾。

Logo 沿用使用者提供的 Argus AI 原始素材。
