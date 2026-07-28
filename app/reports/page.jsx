'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function ReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [filterGroup, setFilterGroup] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const [studentsRes, groupsRes, attendanceRes, sessionsRes] = await Promise.all([
        supabase.from('students').select('*, groups(name, color)').order('name'),
        supabase.from('groups').select('*').order('name'),
        supabase.from('attendance').select('student_id, status'),
        supabase.from('sessions').select('id', { count: 'exact', head: true }),
      ]);

      setStudents(studentsRes.data || []);
      setGroups(groupsRes.data || []);
      setAttendance(attendanceRes.data || []);
      setSessionsCount(sessionsRes.count || 0);
      setLoading(false);
    };

    loadData();
  }, []);

  const studentStats = useMemo(() => {
    return students.map((s) => {
      const records = attendance.filter((a) => a.student_id === s.id);
      const present = records.filter((r) => r.status === 'حاضر').length;
      const absent = records.filter((r) => r.status === 'غائب').length;
      const late = records.filter((r) => r.status === 'متأخر').length;
      const total = present + absent + late;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : null;

      return { ...s, present, absent, late, total, attendanceRate };
    });
  }, [students, attendance]);

  const filteredStats = studentStats.filter((s) => {
    const matchesGroup = !filterGroup || s.group_id === filterGroup;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const exportExcel = async () => {
    const XLSX = await import('xlsx');

    const rows = filteredStats.map((s) => ({
      الاسم: s.name,
      الصف: s.grade,
      المجموعة: s.groups?.name || '-',
      حاضر: s.present,
      غائب: s.absent,
      متأخر: s.late,
      'نسبة الحضور %': s.attendanceRate ?? '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');
    XLSX.writeFile(workbook, `تقرير-الطلاب-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    window.print();
  };

  const totals = {
    students: students.length,
    groups: groups.length,
    sessions: sessionsCount,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3 no-print">
        <h1 className="text-2xl font-bold">التقارير</h1>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
          >
            تصدير Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
          >
            تصدير PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 no-print">
        <div className="bg-blue-500 text-white rounded-2xl p-5">
          <p className="text-sm opacity-90">عدد الطلاب</p>
          <p className="text-3xl font-bold mt-2">{totals.students}</p>
        </div>
        <div className="bg-green-500 text-white rounded-2xl p-5">
          <p className="text-sm opacity-90">عدد المجموعات</p>
          <p className="text-3xl font-bold mt-2">{totals.groups}</p>
        </div>
        <div className="bg-purple-500 text-white rounded-2xl p-5">
          <p className="text-sm opacity-90">عدد الحصص المسجلة</p>
          <p className="text-3xl font-bold mt-2">{totals.sessions}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 no-print">
        <input
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg p-2 text-right flex-1 min-w-[200px]"
        />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="border rounded-lg p-2 text-right"
        >
          <option value="">كل المجموعات</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">جاري التحميل...</p>
      ) : (
        <div id="print-area" className="bg-white rounded-2xl shadow-sm overflow-x-auto print:shadow-none">
          <h2 className="hidden print:block text-xl font-bold p-4">تقرير حضور الطلاب</h2>
          <table className="w-full text-right">
            <thead className="border-b bg-gray-50 print:bg-white">
              <tr>
                <th className="p-3 text-sm font-medium text-gray-500">الاسم</th>
                <th className="p-3 text-sm font-medium text-gray-500">الصف</th>
                <th className="p-3 text-sm font-medium text-gray-500">المجموعة</th>
                <th className="p-3 text-sm font-medium text-gray-500">حاضر</th>
                <th className="p-3 text-sm font-medium text-gray-500">غائب</th>
                <th className="p-3 text-sm font-medium text-gray-500">متأخر</th>
                <th className="p-3 text-sm font-medium text-gray-500">نسبة الحضور</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-gray-500">{s.grade}</td>
                  <td className="p-3">
                    {s.groups ? (
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block print:hidden"
                          style={{ backgroundColor: s.groups.color }}
                        ></span>
                        {s.groups.name}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="p-3 text-green-600 font-medium">{s.present}</td>
                  <td className="p-3 text-red-600 font-medium">{s.absent}</td>
                  <td className="p-3 text-orange-500 font-medium">{s.late}</td>
                  <td className="p-3">
                    {s.attendanceRate !== null ? `${s.attendanceRate}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStats.length === 0 && (
            <p className="text-gray-400 text-center py-8">مفيش طلاب مطابقين</p>
          )}
        </div>
      )}
    </div>
  );
}