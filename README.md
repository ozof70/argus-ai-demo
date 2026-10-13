# Argus AI — 大型場館真實畫面 Demo

體驗：https://argus-ai-class-demo.fancy-curry-3072.chatgpt.site

## 展示內容

大型場館（Emirates Stadium）周邊人流實拍，黑白簡潔介面，保留分區示意框，移除裝飾小點。10個視窗是同一場館不同時段的20秒影片片段，**不是10路攝影機或即時監控**。原速1倍播放、25fps，沒有加速或生成真人。事件由情境按鈕模擬；未接AI判讀。

點選鏡頭放大、暫停／播放、模擬事件、接案、到場、結果回報及結案。後端API與SQL保存狀態；輪詢不重建播放器。斷線暫停對應回放，恢復後續播。

## 執行

`npm start`：http://127.0.0.1:8765；`npm test`：後端與影片範圍請求檢查；`npm run build`：Worker打包。

## 素材

作者：Big Japa。
來源：https://commons.wikimedia.org/wiki/File:Arsenal_vs_Crystal_Palace_-_Matchday_experience_-_emirates_stadium_London_-_Premier_league_match.webm
授權：CC BY 3.0，https://creativecommons.org/licenses/by/3.0/
修改：截取10段各20秒、縮圖、H.264轉碼、移除音訊，保留1倍速；未移除原影片作者標示。作者與場館不代表認可此Demo。
逐段時間與授權：media/sources.json。

## 邊界

區域、事件、人數門檻和通知皆為示意，影片不代表真的發生倒地或受到AI判讀。沒有RTSP、真實SMS、救援效果或企業服務承諾。每位訪客有獨立展示工作區，持有值班連結者可共用該工作區。
