# Argus AI — 大型場館真實畫面 Demo

體驗：[Netlify Demo](https://argus-ai-ozof70.netlify.app/)

最後版 UI：九個鏡頭，桌面每排三個；黑白介面、放大文字、簡化情境與事件操作。Netlify 提供前端與 API 轉接，事件資料沿用原持久化後端；九路展示會同步篩選鏡頭、事件與統計。

部署：`node build-netlify.mjs`，發布 `netlify-dist/`，函式目錄 `netlify-functions/`。

## 展示內容

大型場館（Emirates Stadium）周邊人流實拍，每排三格，黑白簡潔介面，保留分區示意框，移除裝飾小點。9個視窗是同一場館不同時段的20秒影片片段，**不是9路攝影機或即時監控**。原速1倍播放、25fps，沒有加速或生成真人。事件由情境按鈕模擬；點選鏡頭後可啟動 MediaPipe 真人姿態辨識。

點選鏡頭放大、暫停／播放、模擬事件、接案、到場、結果回報及結案。後端API與SQL保存狀態；輪詢不重建播放器。斷線暫停對應回放，恢復後續播。

## 執行

`npm start`：http://127.0.0.1:8765；`npm test`：後端與影片範圍請求檢查；`npm run build`：Worker打包。

## 素材

作者：Big Japa。
來源：https://commons.wikimedia.org/wiki/File:Arsenal_vs_Crystal_Palace_-_Matchday_experience_-_emirates_stadium_London_-_Premier_league_match.webm
授權：CC BY 3.0，https://creativecommons.org/licenses/by/3.0/
修改：截取9段各20秒、縮圖、H.264轉碼、移除音訊，保留1倍速；未移除原影片作者標示。作者與場館不代表認可此Demo。
逐段時間與授權：media/sources.json。

## 邊界

區域、事件、人數門檻和通知皆為示意，影片不代表真的發生倒地或受到AI判讀。沒有RTSP、真實SMS、救援效果或企業服務承諾。每位訪客有獨立展示工作區，持有值班連結者可共用該工作區。

## 真人關節角度

點選鏡頭 → 開始關節辨識。MediaPipe Pose Landmarker Lite 在瀏覽器 Worker 內分析目前影片，影格不上傳。顯示左右膝、髖與手肘的 2D 投影角度及相鄰有效影格差值；依信心、遮擋及人物位置重置比較。此功能是影像姿態估計，事件通知仍為情境模擬，角度未用於自動判定倒地。

`node install-pose-assets.mjs` 下載固定版本 1.1.0 runtime 與官方 Lite 模型，逐檔驗證 SHA-256；`node build-netlify.mjs` 在缺少模型時自動執行。資產來源與雜湊見 `pose-assets.json`；MediaPipe 為 Apache 2.0，授權隨資產保存。

檢查：`node --test pose-math.test.mjs netlify-proxy.test.mjs`。
