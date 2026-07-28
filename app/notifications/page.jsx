'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import NotificationSettings from '@/components/NotificationSettings';

const typeLabels = {
  day_before: 'قبل الحصة بيوم',
  hour_before: 'قبل الحصة بساعة',
  min_30_before: 'قبل الحصة بـ30 دقيقة',
  min_10_before: 'قبل الحصة بـ10 دقائق',
};

export default function NotificationsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notification_log')
        .select('*, groups(name, color)')
        .order('sent_at', { ascending: false })
        .limit(50);
      setLogs(data || []);
      setLoading(false);
    };
    loadLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">الإشعارات</h1>

      <NotificationSettings />

      <div className="bg-white rounded-2xl p-5 shadow-sm mt-5">
        <h2 className="font-bold mb-3">سجل الإشعارات المرسلة</h2>
        {loading ? (
          <p className="text-gray-400">جاري التحميل...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-400">لسه مفيش إشعارات اتبعتت</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex justify-between items-center border-b pb-2 last:border-0 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: log.groups?.color || '#999' }}
                  ></span>
                  <span className="font-medium">{log.groups?.name || 'مجموعة محذوفة'}</span>
                  <span className="text-gray-400">{typeLabels[log.notify_type] || log.notify_type}</span>
                </div>
                <span className="text-gray-400">
                  {new Date(log.sent_at).toLocaleString('ar-EG', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}