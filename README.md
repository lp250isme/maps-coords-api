# GTC (Google To Coords)

A powerful tool to convert Google Maps URLs into precise coordinates (Latitude, Longitude) and provide deep links to open them directly in **Apple Maps** or **Naver Map**.

![App Icon](public/icon.png)

## Features

### 🚀 Core API
- **Advanced Extraction**: Uses multiple strategies to find coordinates (Meta tags, RPC requests, detailed JSON parsing).
- **Smart Redirect Handling**: specific handling for `goo.gl`, `maps.app.goo.gl` redirects, and `ftid` shortcuts.
- **Reliability**: 
  - **Random User-Agent**: Rotates UAs to prevent blocking.
  - **Fail-safe Strategies**: Implements timeouts (6s) and exponential backoff retries.
  - **Priority Logic**: Carefully tuned priority to prefer precise "Pin" locations over generic viewports.

### ✨ Frontend Interface
- **Modern Design**: Apple-style "Glassmorphism" UI with liquid animated backgrounds.
- **Dark Mode**: Fully supports system dark mode with animated dark mesh gradients.
- **Deep Links**: 
  - **Apple Maps**: one-click navigation.
  - **Naver Map**: Deep integration using `nmap://place` with name and app source preservation.
- **i18n**: Auto-detects **Traditional Chinese (繁體中文)** and **English** based on system settings.
- **User Friendly**: Custom error messages guiding users to use the "Share" link if extraction fails.

## Usage

### Web Interface
Simply visit the root URL (`/`), paste a Google Maps link, and click "Convert".

### API Endpoint
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

## Tech Stack
- **Runtime**: Node.js (Vercel Serverless Function)
- **Frontend**: Vanilla HTML/JS/CSS (No framework overhead)
- **Styling**: Native CSS Variables & Animations

## Local Development

```bash
# Install dependencies
npm install

# Run locally
npm start
```
