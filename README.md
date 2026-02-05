# GTC (Google To Coords)

[English](#english) | [繁體中文](#繁體中文)

---

## English

A powerful tool to convert Google Maps URLs into precise coordinates (Latitude, Longitude) and provide deep links to open them directly in **Apple Maps** or **Naver Map**.

![App Icon](public/icon.png)

### Features

#### 🚀 Core API
- **Advanced Extraction**: Uses multiple strategies to find coordinates (Meta tags, RPC requests, detailed JSON parsing).
- **Smart Redirect Handling**: specific handling for `goo.gl`, `maps.app.goo.gl` redirects, and `ftid` shortcuts.
- **Reliability**: 
  - **Random User-Agent**: Rotates UAs to prevent blocking.
  - **Fail-safe Strategies**: Implements timeouts (6s) and exponential backoff retries.
  - **Priority Logic**: Carefully tuned priority to prefer precise "Pin" locations over generic viewports.

#### ✨ Frontend Interface
- **Modern Design**: Apple-style "Glassmorphism" UI with liquid animated backgrounds.
- **Dark Mode**: Fully supports system dark mode with animated dark mesh gradients and **Adaptive Icons** (switch between Blue/Black logic).
- **Deep Links**: 
  - **Apple Maps**: one-click navigation.
  - **Naver Map**: Deep integration using `nmap://place` with name and app source preservation.
- **i18n**: Support **English** and **Traditional Chinese** with language toggle button.
- **User Friendly**: Custom error messages guiding users to use the "Share" link if extraction fails.

### Usage

#### Web Interface
Simply visit the root URL (`/`), paste a Google Maps link, and click "Convert".

#### API Endpoint
GET `/api?url={GOOGLE_MAPS_URL}`

**Input:**
```
https://maps.app.goo.gl/nNy5s3mhUjJx6ftz6
```

**Output:**
```json
{
  "coords": "25.033976,121.564539",
  "placeName": "Taipei 101"
}
```

### Tech Stack
- **Runtime**: Node.js (Vercel Serverless Function)
- **Frontend**: React + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Custom Animations

### Local Development

```bash
# Install dependencies
npm install

# Run locally (Frontend + API)
npm run dev
```

---

## 繁體中文

一個強大的工具，可將 Google Maps 網址轉換為精確的座標（經度、緯度），並提供直接在 **Apple Maps** 或 **Naver Map** 中開啟的深度連結。

### 功能特色

#### 🚀 核心 API
- **進階提取技術**：使用多種策略尋找座標（Meta 標籤、RPC 請求、詳細 JSON 解析）。
- **智慧轉址處理**：針對 `goo.gl`、`maps.app.goo.gl` 轉址和 `ftid` 捷徑進行特殊處理。
- **高可靠性**：
  - **隨機 User-Agent**：輪替 UA 以防止被阻擋。
  - **故障安全策略**：實作超時機制（6秒）和指數退避重試 (Exponential Backoff)。
  - **優先級邏輯**：精心調整的優先順序，優先選擇精確的「大頭針」位置而非僅是視圖範圍。

#### ✨ 前端介面
- **現代化設計**：具有流體動畫背景的 Apple 風格「毛玻璃 (Glassmorphism)」UI。
- **深色模式 (Dark Mode)**：完全支援系統深色模式，搭配動畫網格漸層背景，以及 **自適應圖示**（根據模式切換 藍色/黑色 水滴圖示）。
- **深度連結 (Deep Links)**：
  - **Apple Maps**：一鍵導航。
  - **Naver Map**：使用 `nmap://place` 進行深度整合，保留地點名稱與來源應用程式資訊。
- **多語系支援**：支援 **英文** 與 **繁體中文**，並提供語言切換按鈕。
- **使用者友善**：若提取失敗，會顯示自訂錯誤訊息，引導使用者使用「分享」連結。

### 使用説明

#### 網頁介面
只需訪問根網址 (`/`)，貼上 Google Maps 連結，然後點擊「轉換」。

#### API 端點
GET `/api?url={GOOGLE_MAPS_URL}`

**輸入:**
```
https://maps.app.goo.gl/nNy5s3mhUjJx6ftz6
```

**輸出:**
```json
{
  "coords": "25.033976,121.564539",
  "placeName": "Taipei 101"
}
```

### 技術堆疊
- **執行環境**: Node.js (Vercel Serverless Function)
- **前端**: React + Vite
- **狀態管理**: Zustand
- **樣式**: Tailwind CSS + Custom Animations

### 本地開發

```bash
# 安裝依賴
npm install

# 本地執行 (前端 + API)
npm run dev
```
