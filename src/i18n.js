export const I18N = {
    'zh-TW': {
        placeholder: '在此貼上 Google Maps 網址...',
        errorFetching: '無法取得座標',
        unknownPlace: '未知地點',
        copied: '已複製！',
        pleaseCopyFromShare: '請從 Google 地圖的「分享」功能複製網址',
        coordsNotFound: '找不到座標',
        invalidUrl: '這不是有效的 Google Maps 網址',
        toggleBtn: 'English',
        infoTitle: '關於 GTC',
        infoBody: `
            <p><strong>GTC (Google To Coords)</strong> 是一個快速將 Google Maps 網址轉換為經緯度座標的工具。</p>
            <p><strong>🔗 使用方式：</strong><br/>從 Google Maps 複製地點的分享連結，貼上後點擊「轉換」即可取得精確座標。</p>
            <p><strong>🗺️ 快速開啟：</strong><br/>轉換成功後，可一鍵在 <strong>Apple Maps</strong> 或 <strong>NAVER Maps</strong> 中開啟該地點進行導航。</p>
            <p><strong>📋 複製座標：</strong><br/>點擊座標文字即可複製到剪貼簿。</p>
            <p><strong>💡 小提示：</strong><br/>如果轉換失敗，請確認您使用的是 Google 地圖的「分享」連結，而非直接複製網址列。若確認無誤，請嘗試重新轉換一次。</p>
        `,
        history: '歷史紀錄',
        favorites: '我的最愛',
        search: '搜尋',
        noResults: '沒有符合的結果',
        clear: '清除',
        noHistory: '暫無歷史紀錄',
        noFavorites: '暫無收藏地點',
        addedToFav: '已加入收藏',
        removedFromFav: '已移除收藏',
        shareLink: '分享連結',
        linkCopied: '連結已複製！',
        distanceFromYou: '距您',
        calculating: '定位中...',
        showDistance: '顯示距離',
        locError: '重試定位',
        lightMode: '亮色模式',
        darkMode: '深色模式',
        weather: {
            clear: '晴朗',
            cloudy: '多雲',
            fog: '霧',
            rain: '下雨',
            snow: '下雪',
            storm: '暴風雨',
            unknown: '未知'
        },
        settings: {
            title: '顯示設定',
            showCoords: '顯示座標',
            showDistance: '顯示距離',
            showWeather: '天氣資訊',
            showAppleMap: 'Apple Maps',
            showNaverMap: 'Naver Maps',
            showMapPreview: '地圖預覽'
        },
        favModalTitle: '為此地點命名',
        favModalDesc: '為您的收藏選擇一個自訂名稱。',
        favModalPlaceholder: '地點名稱',
        save: '儲存',
        cancel: '取消', 
        linkCopied: '連結已複製到剪貼簿！',
        login: '登入 Google 進行同步',
        logout: '登出',
        synced: '已同步',
        guest: '訪客',
        loginToFavorite: '請登入以管理收藏',
        loginRequired: '請登入以查看您的收藏'
    },
    'en': {
        placeholder: 'Paste Google Maps URL here...',
        errorFetching: 'Failed to fetch coordinates',
        unknownPlace: 'Unknown Place',
        copied: 'Copied!',
        pleaseCopyFromShare: 'Please copy the URL using the Share function in Google Maps',
        coordsNotFound: 'Coords not found',
        invalidUrl: 'Not a valid Google Maps URL',
        toggleBtn: '中文',
        infoTitle: 'About GTC',
        infoBody: `
            <p><strong>GTC (Google To Coords)</strong> is a tool that quickly converts Google Maps URLs into latitude and longitude coordinates.</p>
            <p><strong>🔗 How to use:</strong><br/>Copy a location's share link from Google Maps, paste it, and click "Convert" to get precise coordinates.</p>
            <p><strong>🗺️ Quick Navigation:</strong><br/>After conversion, open the location directly in <strong>Apple Maps</strong> or <strong>NAVER Maps</strong> for navigation.</p>
            <p><strong>📋 Copy Coordinates:</strong><br/>Click on the coordinates text to copy to clipboard.</p>
            <p><strong>💡 Tip:</strong><br/>If conversion fails, please ensure you are using the link from Google Maps' "Share" function, not the address bar. If confirmed, please try converting again.</p>
        `,
        history: 'History',
        favorites: 'Favorites',
        search: 'Search',
        noResults: 'No results found',
        clear: 'Clear',
        noHistory: 'No recent history',
        noFavorites: 'No favorites yet',
        addedToFav: 'Added to Favorites',
        removedFromFav: 'Removed from Favorites',
        shareLink: 'Share Link',
        linkCopied: 'Link copied to clipboard!',
        distanceFromYou: 'Distance from you',
        calculating: 'Locating...',
        showDistance: 'Show Distance',
        locError: 'Retry Location',
        lightMode: 'Light Mode',
        darkMode: 'Dark Mode',
        weather: {
            clear: 'Clear',
            cloudy: 'Cloudy',
            fog: 'Fog',
            rain: 'Rain',
            snow: 'Snow',
            storm: 'Storm',
            unknown: 'Unknown'
        },
        settings: {
            title: 'Display Settings',
            showCoords: 'Show Coordinates',
            showDistance: 'Show Distance',
            showWeather: 'Weather Info',
            showAppleMap: 'Apple Maps',
            showNaverMap: 'Naver Maps',
            showMapPreview: 'Map Preview'
        },
        favModalTitle: 'Name this location',
        favModalDesc: 'Choose a custom name for your favorite.',
        favModalPlaceholder: 'Location Name',
        save: 'Save',
        cancel: 'Cancel',
        linkCopied: 'Link copied to clipboard!',
        login: 'Sign in with Google',
        logout: 'Sign Out',
        synced: 'Synced',
        guest: 'Guest',
        loginToFavorite: 'Please login to manage favorites.',
        loginRequired: 'Please login to access your favorites.'
    }
};
