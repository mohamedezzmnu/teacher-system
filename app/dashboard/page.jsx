import { createServerSupabase } from '@/lib/supabaseServer';

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function getTodayName() {
  return dayNames[new Date().getDay()];
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

async function getStats() {
  const supabase = await createServerSupabase();
  const todayName = getTodayName();

  const [studentsRes, groupsRes, allGroupsRes] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('groups').select('id', { count: 'exact', head: true }),
    supabase.from('groups').select('*'),
  ]);

  const allGroups = allGroupsRes.data || [];
  const todaySessions = allGroups.filter((g) => g.day_of_week === todayName);

  // حساب أقرب حصة قادمة
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let nextSession = null;
  const todayIndex = now.getDay();

  for (let offset = 0; offset < 8; offset++) {
    const checkIndex = (todayIndex + offset) % 7;
    const checkDayName = dayNames[checkIndex];
    const candidates = allGroups
      .filter((g) => g.day_of_week === checkDayName)
      .filter((g) => (offset === 0 ? timeToMinutes(g.start_time) > nowMinutes : true))
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    if (candidates.length > 0) {
      nextSession = { ...candidates[0], dayLabel: offset === 0 ? 'النهاردة' : checkDayName };
      break;
    }
  }

  return {
    studentsCount: studentsRes.count || 0,
    groupsCount: groupsRes.count || 0,
    todaySessions,
    weekSessionsCount: allGroups.length,
    nextSession,
  };
}

export default async function Dashboard() {
  const stats = await getStats();

  const cards = [
    { label: 'عدد الطلاب', value: stats.studentsCount, color: 'bg-blue-500' },
    { label: 'عدد المجموعات', value: stats.groupsCount, color: 'bg-green-500' },
    { label: 'حصص اليوم', value: stats.todaySessions.length, color: 'bg-orange-500' },
    { label: 'حصص الأسبوع', value: stats.weekSessionsCount, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة التحكم</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className={`${c.color} text-white rounded-2xl p-5`}>
            <p className="text-sm opacity-90">{c.label}</p>
            <p className="text-3xl font-bold mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      {stats.nextSession && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border-r-4" style={{ borderColor: stats.nextSession.color || '#3b82f6' }}>
          <h2 className="font-bold mb-1 text-gray-500 text-sm">أقرب حصة قادمة</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{stats.nextSession.name}</p>
              <p className="text-gray-500 text-sm">{stats.nextSession.dayLabel} — {stats.nextSession.start_time}</p>
            </div>
            {stats.nextSession.location && (
              <span className="text-gray-400 text-sm">{stats.nextSession.location}</span>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold mb-3">حصص اليوم</h2>
        {stats.todaySessions.length === 0 ? (
          <p className="text-gray-400">مفيش حصص النهاردة</p>
        ) : (
          <ul className="space-y-2">
            {stats.todaySessions.map((g) => (
              <li key={g.id} className="flex justify-between border-b pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: g.color || '#3b82f6' }}
                  ></span>
                  <span>{g.name}</span>
                </div>
                <span className="text-gray-500">
                  {g.start_time} - {g.end_time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
