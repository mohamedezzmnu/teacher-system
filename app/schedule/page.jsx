'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import AttendanceModal from '@/components/AttendanceModal';

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const weekOrder = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date) {
  const dayIndex = date.getDay();
  const diff = (dayIndex - 6 + 7) % 7;
  return addDays(date, -diff);
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function SchedulePage() {
  const supabase = createClient();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceTarget, setAttendanceTarget] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('groups').select('*').order('start_time');
      setGroups(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const today = new Date();
  const isSameDay = (a, b) => formatDate(a) === formatDate(b);

  const getSessionsForDate = (date) => {
    const dayName = dayNames[date.getDay()];
    return groups
      .filter((g) => g.day_of_week === dayName)
      .slice()
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  };

  const getSessionStatus = (group, date) => {
    if (!isSameDay(date, today)) return null;
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    const start = timeToMinutes(group.start_time);
    const end = timeToMinutes(group.end_time);
    if (nowMinutes >= start && nowMinutes <= end) return 'current';
    if (nowMinutes < start) return 'upcoming';
    return 'past';
  };

  const goPrev = () => {
    if (view === 'day') setSelectedDate((d) => addDays(d, -1));
    else if (view === 'week') setSelectedDate((d) => addDays(d, -7));
    else setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNext = () => {
    if (view === 'day') setSelectedDate((d) => addDays(d, 1));
    else if (view === 'week') setSelectedDate((d) => addDays(d, 7));
    else setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const goToday = () => setSelectedDate(new Date());

  const weekDates = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const monthGrid = useMemo(() => {
    const firstOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const gridStart = startOfWeek(firstOfMonth);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [selectedDate]);

  const headerLabel = () => {
    if (view === 'day') {
      return `${dayNames[selectedDate.getDay()]} ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (view === 'week') {
      const start = weekDates[0];
      const end = weekDates[6];
      return `${start.getDate()} ${monthNames[start.getMonth()]} — ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">الجدول</h1>
        <div className="flex bg-white rounded-lg shadow-sm p-1">
          {[
            { key: 'day', label: 'يومي' },
            { key: 'week', label: 'أسبوعي' },
            { key: 'month', label: 'شهري' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-4 py-1.5 rounded-md text-sm transition ${
                view === v.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 bg-white rounded-xl p-3 shadow-sm">
        <button onClick={goPrev} className="px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">◀</button>
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm md:text-base">{headerLabel()}</span>
          <button
            onClick={goToday}
            className="text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 transition"
          >
            النهاردة
          </button>
        </div>
        <button onClick={goNext} className="px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">▶</button>
      </div>

      {loading ? (
        <p className="text-gray-400">جاري التحميل...</p>
      ) : (
        <>
          {view === 'day' && (
            <DayView
              date={selectedDate}
              sessions={getSessionsForDate(selectedDate)}
              getSessionStatus={getSessionStatus}
              onOpenAttendance={(group) => setAttendanceTarget({ group, date: selectedDate })}
            />
          )}

          {view === 'week' && (
            <WeekView
              weekDates={weekDates}
              getSessionsForDate={getSessionsForDate}
              isSameDay={isSameDay}
              today={today}
              onOpenAttendance={(group, date) => setAttendanceTarget({ group, date })}
            />
          )}

          {view === 'month' && (
            <MonthView
              monthGrid={monthGrid}
              selectedMonth={selectedDate.getMonth()}
              getSessionsForDate={getSessionsForDate}
              isSameDay={isSameDay}
              today={today}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setView('day');
              }}
            />
          )}
        </>
      )}

      {attendanceTarget && (
        <AttendanceModal
          group={attendanceTarget.group}
          date={attendanceTarget.date}
          onClose={() => setAttendanceTarget(null)}
        />
      )}
    </div>
  );
}

function DayView({ date, sessions, getSessionStatus, onOpenAttendance }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
        مفيش حصص في اليوم ده
      </div>
    );
  }

  const statusBadge = {
    current: { label: 'جارية دلوقتي', className: 'bg-green-100 text-green-700' },
    upcoming: { label: 'قادمة', className: 'bg-blue-100 text-blue-700' },
    past: { label: 'انتهت', className: 'bg-gray-100 text-gray-500' },
  };

  return (
    <div className="space-y-3">
      {sessions.map((g) => {
        const status = getSessionStatus(g, date);
        const badge = status ? statusBadge[status] : null;
        return (
          <div
            key={g.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center flex-wrap gap-3 border-r-4"
            style={{ borderColor: g.color }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold">{g.name}</h3>
                {badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {g.start_time?.slice(0, 5)} - {g.end_time?.slice(0, 5)} · الصف {g.grade}
                {g.location ? ` · ${g.location}` : ''}
              </p>
            </div>
            <button
              onClick={() => onOpenAttendance(g)}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              تسجيل الحضور
            </button>
          </div>
        );
      })}
    </div>
  );
}

function WeekView({ weekDates, getSessionsForDate, isSameDay, today, onOpenAttendance }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {weekDates.map((date) => {
        const sessions = getSessionsForDate(date);
        const isToday = isSameDay(date, today);
        return (
          <div
            key={formatDate(date)}
            className={`bg-white rounded-2xl p-3 shadow-sm min-h-[140px] ${
              isToday ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <p className={`text-sm font-bold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
              {dayNames[date.getDay()]} {date.getDate()}
            </p>
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-300">لا يوجد</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onOpenAttendance(g, date)}
                    className="w-full text-right text-xs rounded-lg p-2 hover:opacity-80 transition"
                    style={{ backgroundColor: `${g.color}20`, color: g.color }}
                  >
                    <span className="font-bold block">{g.name}</span>
                    <span>{g.start_time?.slice(0, 5)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ monthGrid, selectedMonth, getSessionsForDate, isSameDay, today, onSelectDate }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekOrder.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-gray-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {monthGrid.map((date) => {
          const sessions = getSessionsForDate(date);
          const isCurrentMonth = date.getMonth() === selectedMonth;
          const isToday = isSameDay(date, today);
          return (
            <button
              key={formatDate(date)}
              onClick={() => onSelectDate(date)}
              className={`bg-white rounded-xl p-2 min-h-[70px] text-right shadow-sm hover:shadow-md transition ${
                !isCurrentMonth ? 'opacity-40' : ''
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <span className="text-sm font-bold block mb-1">{date.getDate()}</span>
              <div className="flex gap-1 flex-wrap">
                {sessions.slice(0, 4).map((g) => (
                  <span
                    key={g.id}
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: g.color }}
                  ></span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}