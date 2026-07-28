import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from '@/lib/webPush';

export const dynamic = 'force-dynamic';

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );

  const [{ data: settings }, { data: groups }, { data: subs }] = await Promise.all([
    supabaseAdmin.from('notification_settings').select('*').limit(1).maybeSingle(),
    supabaseAdmin.from('groups').select('*'),
    supabaseAdmin.from('push_subscriptions').select('*'),
  ]);

  if (!settings || !groups?.length || !subs?.length) {
    return NextResponse.json({ checked: groups?.length || 0, sent: 0, note: 'مفيش مجموعات أو اشتراكات' });
  }

  const leadTimes = [
    { minutes: 1440, key: 'day_before', enabled: settings.day_before, label: 'يوم' },
    { minutes: 60, key: 'hour_before', enabled: settings.hour_before, label: 'ساعة' },
    { minutes: 30, key: 'min_30_before', enabled: settings.min_30_before, label: '30 دقيقة' },
    { minutes: 10, key: 'min_10_before', enabled: settings.min_10_before, label: '10 دقائق' },
  ];

  const now = new Date();
  let sentCount = 0;

  for (const group of groups) {
    for (let offset = 0; offset <= 1; offset++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + offset);
      const dayName = dayNames[checkDate.getDay()];
      if (group.day_of_week !== dayName) continue;

      const [h, m] = (group.start_time || '00:00').split(':').map(Number);
      const sessionDateTime = new Date(
        checkDate.getFullYear(),
        checkDate.getMonth(),
        checkDate.getDate(),
        h,
        m
      );
      const diffMinutes = (sessionDateTime - now) / 60000;
      const sessionDateStr = formatDate(sessionDateTime);

      for (const lead of leadTimes) {
        if (!lead.enabled) continue;
        if (Math.abs(diffMinutes - lead.minutes) > 4) continue;

        const { data: existingLog } = await supabaseAdmin
          .from('notification_log')
          .select('id')
          .eq('group_id', group.id)
          .eq('session_date', sessionDateStr)
          .eq('notify_type', lead.key)
          .maybeSingle();

        if (existingLog) continue;

        const payload = JSON.stringify({
          title: `تذكير: ${group.name}`,
          body: `الحصة بعد ${lead.label} — الساعة ${group.start_time?.slice(0, 5)}${
            group.location ? ` — ${group.location}` : ''
          }`,
          tag: `${group.id}-${sessionDateStr}-${lead.key}`,
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(sub.subscription, payload);
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
        }

        await supabaseAdmin.from('notification_log').insert({
          group_id: group.id,
          session_date: sessionDateStr,
          notify_type: lead.key,
        });

        sentCount++;
      }
    }
  }

  return NextResponse.json({ checked: groups.length, sent: sentCount });
}