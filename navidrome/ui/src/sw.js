/* eslint-disable */

// documentation: https://developers.google.com/web/tools/workbox/modules/workbox-sw
// Only load workbox if not in development and the script exists
if (typeof importScripts !== 'undefined') {
  try {
    importScripts('3rdparty/workbox/workbox-sw.js')
    
    if (typeof workbox !== 'undefined') {
      workbox.setConfig({
        modulePathPrefix: '3rdparty/workbox/',
        debug: false,
      })

      workbox.loadModule('workbox-core')
      workbox.loadModule('workbox-strategies')
      workbox.loadModule('workbox-routing')
      workbox.loadModule('workbox-navigation-preload')
      workbox.loadModule('workbox-precaching')

      workbox.core.clientsClaim()
      self.skipWaiting()

      // self.__WB_MANIFEST is default injection point
      workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

      const networkOnly = new workbox.strategies.NetworkOnly()
      const navigationHandler = async (params) => {
        try {
          // Attempt a network request.
          return await networkOnly.handle(params)
        } catch (error) {
          // If it fails, return the cached HTML.
          return caches.match(FALLBACK_HTML_URL, {
            cacheName: CACHE_NAME,
          })
        }
      }

      // Register this strategy to handle all navigations.
      workbox.routing.registerRoute(
        new workbox.routing.NavigationRoute(navigationHandler),
      )
    }
  } catch (error) {
    console.warn('Workbox scripts not available, service worker running in fallback mode')
  }
}

// Fallback basic service worker functionality
self.skipWaiting()

addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    skipWaiting()
  }
})

const CACHE_NAME = 'offline-html'
// This assumes /offline.html is a URL for your self-contained
// (no external images or styles) offline page.
const FALLBACK_HTML_URL = './offline.html'
// Populate the cache with the offline HTML page when the
// service worker is installed.
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(FALLBACK_HTML_URL)),
  )
})
