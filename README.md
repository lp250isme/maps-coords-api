# GTC (Google To Coords)

[English](#english) | [繁體中文](#繁體中文)

---

## English

A powerful tool to convert Google Maps URLs into precise coordinates (Latitude, Longitude) and provide deep links to open them directly in **Apple Maps** or **Naver Map**. Now featuring Cloud Sync and a premium Apple-style interface.

![App Icon](public/icon.png)

### Features

#### 🚀 Core Functionality
- **Smart Conversion**: Extracts coordinates from complex Google Maps URLs (including `goo.gl`, `maps.app.goo.gl`, and `ftid`).
- **Reverse Geocoding**: Input coordinates (e.g., `25.03, 121.56`) to instantly generate actionable map cards.
- **Deep Links**: One-click navigation in **Apple Maps** or **Naver Map**.
- **Quick Share**: Generate deep links (e.g., `/?q=25.03,121.56&name=Taipei%20101`) that auto-convert when opened, preserving the place name for sharing.

#### ☁️ Cloud Sync & User Profile
- **Google Sign-In**: Login to sync your data across devices.
- **Cross-Device Sync**: Favorites and History are automatically synced via Firebase.
- **Smart Merge**: Seamlessly merges local guest data with cloud data upon login.

#### ⭐️ History & Favorites
- **History Log**: Automatically saves your last 20 conversions.
- **Favorites Management**:
  - Save important locations for quick access.
  - **Custom Naming**: Rename favorites for easier identification.
  - **Folders**: Organize favorites into custom folders for better management.
  - **Login Required**: Restricted access ensures your data is secure and personalized.
  - **Smart Search**: Real-time filtering by name, folder, or coordinates.

#### ✨ Premium UI/UX
- **Mobile-First Design**: Bottom tab navigation for easy one-handed use.
- **Apple Aesthetic**: "Glassmorphism" design with liquid animated backgrounds and native-like interactions.
- **Dark Mode**: Fully supports system dark mode with adaptive icons and mesh gradients.
- **Smart Utilities**:
  - **📍 Distance**: Calculates linear distance from your current location.
  - **🌤️ Weather**: Real-time weather info (Temp, Condition) via OpenMeteo.
  - **📋 Auto-Copy**: Click coordinates to copy instantly.
- **PWA**: Installable as a native-like app on iOS/Android (Offline support + Custom Icon).

### Usage

#### Web Interface
Simply visit the root URL (`/`), paste a Google Maps link, and click "Convert".

#### Key Shortcuts
- **Paste & Go**: App auto-detects clipboard content on focus.
- **Coordinates Input**: Directly type `lat,lon` to skip extraction.

### Tech Stack
- **Framework**: React 18 + Vite
- **State**: Zustand (Persisted + Firebase Sync)
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Vercel Serverless Functions (Node.js)
- **Cloud**: Firebase Auth & Firestore

### Local Development

```bash
# Install dependencies
npm install

# Run locally (Frontend + API)
npm run dev
```

---

## 繁體中文

一個強大的工具，可將 Google Maps 網址轉換為精確的座標（經度、緯度），並提供直接在 **Apple Maps** 或 **Naver Map** 中開啟的深度連結。現已支援雲端同步與全新 Apple 風格介面。

### 功能特色

#### 🚀 核心功能
- **智慧轉換**：支援各種複雜的 Google Maps 網址（包含 `goo.gl`、`maps.app.goo.gl` 和 `ftid` 捷徑）。
- **反向地理編碼**：直接輸入座標（如 `25.03, 121.56`）即可生成地圖卡片。
- **深度連結**：一鍵在 **Apple Maps** 或 **Naver Map** 中開啟導航。
- **快速分享**：產生分享連結（如 `/?q=25.03,121.56&name=Taipei%20101`），開啟後自動轉換並保留地點名稱。

#### ☁️ 雲端同步與個人化
- **Google 登入**：登入後即可在多裝置間同步資料。
- **跨裝置同步**：歷史紀錄與我的最愛皆透過 Firebase 自動備份。
- **智慧合併**：登入時自動將訪客模式的資料合併至雲端帳號。

#### ⭐️ 歷史紀錄與收藏
- **歷史紀錄**：自動保存最近 20 筆轉換紀錄。
- **收藏管理**：
  - 將重要地點加入最愛。
  - **自訂名稱**：可為收藏地點設定自訂名稱。
  - **資料夾分類**：建立資料夾來整理您的收藏地點。
  - **權限控管**：需登入才能使用收藏功能，確保資料安全與個人化。
  - **智慧搜尋**：支援透過名稱、資料夾或座標即時篩選。

#### ✨ 頂級 UI/UX 體驗
- **行動優先設計**：底部導航分頁，單手操作更輕鬆。
- **Apple 風格**：流體動畫背景搭配「毛玻璃 (Glassmorphism)」設計。
- **深色模式**：完整支援系統深色模式，搭配自適應圖示與動態網格背景。
- **智慧小工具**：
  - **📍 距離計算**：顯示目標地點與您目前位置的直線距離。
  - **🌤️ 天氣資訊**：即時顯示當地氣溫與天氣狀況 (OpenMeteo)。
  - **📋 一鍵複製**：點擊座標即可快速複製。
- **PWA 支援**：可安裝至手機桌面，提供接近原生 App 的體驗（支援離線使用）。

### 使用説明

#### 網頁介面
只需訪問根網址 (`/`)，貼上 Google Maps 連結，然後點擊「轉換」。

#### 快捷操作
- **貼上即轉**：點擊輸入框時自動讀取剪貼簿內容。
- **座標輸入**：直接輸入 `緯度,經度` 可跳過提取步驟直接顯示結果。

### 技術堆疊
- **前端框架**: React 18 + Vite
- **狀態管理**: Zustand (Persisted + Firebase Sync)
- **樣式設計**: Tailwind CSS + Framer Motion
- **後端 API**: Vercel Serverless Functions (Node.js)
- **雲端服務**: Firebase Auth & Firestore

### 本地開發

```bash
# 安裝依賴
npm install

# 本地執行 (前端 + API)
npm run dev
```
