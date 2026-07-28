self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'تذكير', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'تذكير بحصة';
  const options = {
    body: data.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || 'session-reminder',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});
