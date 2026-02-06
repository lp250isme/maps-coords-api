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
            <p><strong>🔗 轉換網址：</strong><br/>貼上 Google Maps 的分享連結，即可取得精確座標。也可直接輸入座標（如 25.03, 121.56）。</p>
            <p><strong>🗺️ 快速導航：</strong><br/>一鍵在 <strong>Apple Maps</strong> 或 <strong>NAVER Maps</strong> 中開啟導航。</p>
            <p><strong>📍 實用資訊：</strong><br/>自動顯示與您的距離、當地即時天氣。點擊座標即可複製。</p>
            <p><strong>⭐️ 收藏管理：</strong><br/>登入 Google 帳號後，可將地點加入收藏並自訂名稱。收藏與歷史紀錄會跨裝置同步。</p>
            <p><strong>📤 分享連結：</strong><br/>點擊分享按鈕可產生帶有地點名稱的連結，對方開啟後即可看到完整資訊。</p>
            <p><strong>💡 小提示：</strong><br/>轉換失敗？請確認使用的是 Google 地圖的「分享」連結。</p>
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
        loginRequired: '請登入以查看您的收藏',
        // Folder Feature
        allFavorites: '全部收藏',
        uncategorized: '未分類',
        newFolder: '新增資料夾',
        folderName: '資料夾名稱',
        moveToFolder: '移至資料夾',
        deleteFolder: '刪除資料夾',
        deleteFolderConfirm: '刪除此資料夾？內容將移至「未分類」',
        selectFolder: '選擇資料夾'
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
            <p><strong>GTC (Google To Coords)</strong> quickly converts Google Maps URLs into coordinates.</p>
            <p><strong>🔗 Convert URLs:</strong><br/>Paste a Google Maps share link to get precise coordinates. You can also input coordinates directly (e.g., 25.03, 121.56).</p>
            <p><strong>🗺️ Quick Navigation:</strong><br/>Open locations directly in <strong>Apple Maps</strong> or <strong>NAVER Maps</strong> with one tap.</p>
            <p><strong>📍 Useful Info:</strong><br/>View distance from your location and real-time weather. Tap coordinates to copy.</p>
            <p><strong>⭐️ Favorites:</strong><br/>Sign in with Google to save locations with custom names. Favorites and history sync across devices.</p>
            <p><strong>📤 Share Links:</strong><br/>Tap share to generate a link that preserves the place name for recipients.</p>
            <p><strong>💡 Tip:</strong><br/>Conversion failed? Make sure you're using a Google Maps "Share" link.</p>
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
        loginRequired: 'Please login to access your favorites.',
        // Folder Feature
        allFavorites: 'All Favorites',
        uncategorized: 'Uncategorized',
        newFolder: 'New Folder',
        folderName: 'Folder Name',
        moveToFolder: 'Move to Folder',
        deleteFolder: 'Delete Folder',
        deleteFolderConfirm: 'Delete this folder? Items will move to Uncategorized.',
        selectFolder: 'Select Folder'
    }
};
