'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const settingsFields = [
  { key: 'day_before', label: 'قبل الحصة بيوم' },
  { key: 'hour_before', label: 'قبل الحصة بساعة' },
  { key: 'min_30_before', label: 'قبل الحصة بـ30 دقيقة' },
  { key: 'min_10_before', label: 'قبل الحصة بـ10 دقائق' },
];

export default function NotificationSettings() {
  const supabase = createClient();
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setSupported(false);
        setLoading(false);
        return;
      }

      setPermission(Notification.permission);

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const existingSub = await registration.pushManager.getSubscription();
        setSubscribed(!!existingSub);
      } catch (err) {
        // تجاهل لو الـ service worker مسجلش لسه
      }

      let { data } = await supabase.from('notification_settings').select('*').limit(1).maybeSingle();

      // لو الصف مش موجود، اعمله دلوقتي
      if (!data) {
        const { data: created } = await supabase
          .from('notification_settings')
          .insert({ day_before: false, hour_before: true, min_30_before: true, min_10_before: true })
          .select()
          .single();
        data = created;
      }

      setSettings(data);
      setLoading(false);
    };

    init();
  }, []);

  const handleSubscribe = async () => {
    setMessage('');
    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult);

    if (permissionResult !== 'granted') {
      setMessage('محتاج توافق على الإشعارات من المتصفح عشان تفعلها');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      setSubscribed(true);
      setMessage('تم تفعيل الإشعارات بنجاح ✅');
    } catch (err) {
      setMessage('حصل خطأ أثناء تفعيل الإشعارات، جرب تاني');
    }
  };

  const handleUnsubscribe = async () => {
    setMessage('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
      setMessage('تم إيقاف الإشعارات');
    } catch (err) {
      setMessage('حصل خطأ أثناء إيقاف الإشعارات');
    }
  };

  const toggleSetting = async (key) => {
    if (!settings) return;
    const newValue = !settings[key];
    const updated = { ...settings, [key]: newValue };
    setSettings(updated);

    const { error } = await supabase
      .from('notification_settings')
      .update({ [key]: newValue })
      .eq('id', settings.id);

    if (error) {
      setMessage('حصل خطأ أثناء حفظ الإعداد، جرب تاني');
      setSettings(settings); // رجّع القيمة القديمة
    }
  };

  if (loading) {
    return <p className="text-gray-400">جاري التحميل...</p>;
  }

  if (!supported) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-gray-500">المتصفح ده مش بيدعم الإشعارات، جرب من متصفح تاني زي Chrome.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold mb-2">تفعيل الإشعارات على الجهاز ده</h2>
        <p className="text-sm text-gray-500 mb-4">
          لازم تفعل الإشعارات من كل جهاز أو متصفح هتستخدمه عشان تستقبل التذكيرات، حتى لو الموقع مقفول.
        </p>

        {subscribed ? (
          <button
            onClick={handleUnsubscribe}
            className="bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-4 py-2 text-sm transition"
          >
            إيقاف الإشعارات على الجهاز ده
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 text-sm transition"
          >
            تفعيل الإشعارات
          </button>
        )}

        {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold mb-3">مواعيد التذكير</h2>
        <div className="space-y-2">
          {settingsFields.map((f) => (
            <label key={f.key} className="flex items-center justify-between border rounded-xl p-3 cursor-pointer">
              <span>{f.label}</span>
              <input
                type="checkbox"
                checked={!!settings?.[f.key]}
                onChange={() => toggleSetting(f.key)}
                className="w-5 h-5 accent-blue-600"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}