const CACHE_NAME = 'sleep-tracker-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting()
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Claim control of all clients
      return self.clients.claim()
    })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response
        }
        
        // Clone the request
        const fetchRequest = event.request.clone()
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // Clone the response
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        }).catch(() => {
          // Return offline page or default response
          return new Response('App is offline', {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          })
        })
      })
  )
})

// Background sync for iOS PWA
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle background tasks for iOS PWA
  console.log('Background sync triggered')
}

// Push notification handling for iOS PWA
self.addEventListener('push', (event) => {
  console.log('Push message received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'Sleep Tracker notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Sleep Tracker', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event)
  
  event.notification.close()
  
  const action = event.action
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === '/' && 'focus' in client) {
          // Send message to client about notification action
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action: action,
            timestamp: Date.now()
          })
          return client.focus()
        }
      }
      
      // If app is not open, open it
      if (clients.openWindow) {
        const url = action === 'view-stats' ? '/#/statistics' : '/'
        return clients.openWindow(url)
      }
    })
  )
})

// Message handling from main app
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data)
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SHOW_NOTIFICATION':
        showNotificationFromMessage(event.data)
        break
      case 'SCHEDULE_ALARM':
        scheduleAlarm(event.data)
        break
      case 'CANCEL_ALARM':
        cancelAlarm(event.data)
        break
    }
  }
})

// Show notification from main app message
async function showNotificationFromMessage(data) {
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    data: {
      ...data.data,
      timestamp: Date.now()
    }
  }
  
  if (data.actions) {
    options.actions = data.actions
  }
  
  await self.registration.showNotification(data.title || 'Sleep Tracker', options)
}

// Schedule alarm using service worker (for iOS PWA)
function scheduleAlarm(data) {
  const alarmTime = new Date(data.alarmTime)
  const now = new Date()
  const timeUntilAlarm = alarmTime.getTime() - now.getTime()
  
  if (timeUntilAlarm > 0) {
    setTimeout(() => {
      self.registration.showNotification('Good Morning! 🌅', {
        body: 'Time to wake up! Your sleep has been tracked.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [400, 200, 400, 200, 400],
        requireInteraction: true,
        tag: 'wake-up-alarm',
        actions: [
          { action: 'view-stats', title: 'View Sleep Stats' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: {
          type: 'wake-up-alarm',
          timestamp: Date.now()
        }
      })
    }, timeUntilAlarm)
    
    console.log(`Alarm scheduled for ${alarmTime.toLocaleString()}`)
  }
}

// Cancel scheduled alarm
function cancelAlarm(data) {
  // Note: setTimeout IDs are not persistent across service worker restarts
  // For production, you'd want to use IndexedDB to track scheduled alarms
  console.log('Alarm cancelled')
}

// Periodic background sync for iOS PWA (experimental)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sleep-reminder') {
    event.waitUntil(checkForSleepReminder())
  }
})

async function checkForSleepReminder() {
  // Check if it's time for bedtime reminder
  const now = new Date()
  const hour = now.getHours()
  
  // Example: Show reminder at 10 PM
  if (hour === 22) {
    await self.registration.showNotification('💤 Bedtime Reminder', {
      body: 'Time to prepare for bed!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200],
      tag: 'bedtime-reminder'
    })
  }
}