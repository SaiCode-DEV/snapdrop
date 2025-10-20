if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(serviceWorker => {
      console.log('Service Worker registered')
      ;(window as any).serviceWorker = serviceWorker
    })
}
