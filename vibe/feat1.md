# Features

I want to build a web app that helps people near NTHU choose where to eat.

The app should have the following features:

- random choose a store
    - record location
- money count
    - backend memory
    - login system
- comments
    - backend support
- map
	- heat map
	- 人流
- **should be easily coverted to a mobile app**

抽選應該要可以設定條件，例如：
- 人數
- 預算
- 距離
- 偏好

抽選動畫的時間太久了
加入google map連結
加入「加入未收錄店家」按鈕
繼續加入留言與評分功能

加入圖片、菜單
加入讓店家可以推廣優惠的banner
參考這張圖片的ui設計
完善後端設計：
 - 加入未收錄清單的請求會被發到哪裡？
新增消費的部分加入「其他」選項
消費紀錄加入分類分析
消費紀錄加入「最常吃的...」等分析

處理圖中error
NTHUMods UI設計

抽選應該要基於用戶定位來進行
營業時段做成圖表
抽選應該考慮是否營業
收錄請求地址為必填，並新增「使用當前定位」按鈕
收錄請求backend輸出到json

從其他頁面切回地圖時pin會不見
收錄請求應該另存一個json，等待人工審核才加入db
營業時段圖表只顯示當天（包含精確時間），點擊再顯示全部
不顯示營業時段文字
若未營業圖上pin呈現灰色
抽選基於定位，在抽選按鈕下面請user輸入搜尋半徑（預設300m）
所有輸入框文字都使用對比度更高的顏色（目前為淺灰）

