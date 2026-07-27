'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const statusOptions = [
  { value: 'حاضر', className: 'bg-green-600 text-white border-green-600', idle: 'hover:bg-green-50 text-green-700 border-green-200' },
  { value: 'متأخر', className: 'bg-orange-500 text-white border-orange-500', idle: 'hover:bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'غائب', className: 'bg-red-600 text-white border-red-600', idle: 'hover:bg-red-50 text-red-700 border-red-200' },
];

export default function AttendanceModal({ group, date, onClose }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  const dateStr = formatDate(date);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');

      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('group_id', group.id)
        .order('name');

      setStudents(studentsData || []);

      const { data: existingSession } = await supabase
        .from('sessions')
        .select('*')
        .eq('group_id', group.id)
        .eq('session_date', dateStr)
        .maybeSingle();

      let session = existingSession;

      if (!session) {
        const { data: newSession, error: insertError } = await supabase
          .from('sessions')
          .insert({
            group_id: group.id,
            session_date: dateStr,
            start_time: group.start_time,
            end_time: group.end_time,
          })
          .select()
          .single();

        if (insertError) {
          setError('حصل خطأ أثناء إنشاء الحصة');
          setLoading(false);
          return;
        }
        session = newSession;
      }

      setSessionId(session.id);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', session.id);

      const map = {};
      (attendanceData || []).forEach((a) => {
        map[a.student_id] = a.status;
      });
      setAttendanceMap(map);

      setLoading(false);
    };

    init();
  }, [group.id, dateStr]);

  const markStatus = async (studentId, status) => {
    setSaving(studentId);
    setError('');

    const { error } = await supabase
      .from('attendance')
      .upsert(
        { session_id: sessionId, student_id: studentId, status },
        { onConflict: 'session_id,student_id' }
      );

    if (error) {
      setError('حصل خطأ أثناء الحفظ');
    } else {
      setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
    }

    setSaving(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-lg">{group.name}</h2>
            <p className="text-sm text-gray-500">
              {dateStr} · {group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-6">جاري التحميل...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-400 text-center py-6">مفيش طلاب في المجموعة دي لسه</p>
        ) : (
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.id} className="flex justify-between items-center border rounded-xl p-3 flex-wrap gap-2">
                <span className="font-medium">{s.name}</span>
                <div className="flex gap-1.5">
                  {statusOptions.map((opt) => {
                    const isSelected = attendanceMap[s.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        disabled={saving === s.id}
                        onClick={() => markStatus(s.id, opt.value)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
                          isSelected ? opt.className : `bg-white ${opt.idle}`
                        }`}
                      >
                        {opt.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}