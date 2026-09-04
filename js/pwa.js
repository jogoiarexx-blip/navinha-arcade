if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(error =>
            console.warn('[PWA] Service Worker indisponível:', error));
    }, { once:true });
}
