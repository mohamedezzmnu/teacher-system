'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';

const emptyForm = {
  name: '',
  grade: '',
  group_id: '',
  parent_phone: '',
  notes: '',
};

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterPaid, setFilterPaid] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const loadData = async () => {
    setLoading(true);
    const [studentsRes, groupsRes] = await Promise.all([
      supabase.from('students').select('*, groups(name, color)').order('name', { ascending: true }),
      supabase.from('groups').select('*').order('name'),
    ]);
    setStudents(studentsRes.data || []);
    setGroups(groupsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (student) => {
    setForm({
      name: student.name,
      grade: student.grade,
      group_id: student.group_id || '',
      parent_phone: student.parent_phone || '',
      notes: student.notes || '',
    });
    setEditingId(student.id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.grade) {
      setError('الاسم والصف الدراسي مطلوبين');
      return;
    }

    const payload = { ...form, group_id: form.group_id || null };

    if (editingId) {
      const { error } = await supabase.from('students').update(payload).eq('id', editingId);
      if (error) {
        setError('حصل خطأ أثناء التعديل');
        return;
      }
    } else {
      const { error } = await supabase.from('students').insert(payload);
      if (error) {
        setError('حصل خطأ أثناء الإضافة');
        return;
      }
    }

    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('متأكد إنك عايز تحذف الطالب ده؟')) return;
    await supabase.from('students').delete().eq('id', id);
    loadData();
  };

  const togglePaid = async (student) => {
    const newValue = !student.paid;
    setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, paid: newValue } : s)));
    await supabase.from('students').update({ paid: newValue }).eq('id', student.id);
  };

  const toggleCollapse = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const grades = [...new Set(students.map((s) => s.grade))];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.grade.toLowerCase().includes(search.toLowerCase()) ||
      (s.groups?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesGrade = !filterGrade || s.grade === filterGrade;
    const matchesGroup = !filterGroup || s.group_id === filterGroup;
    const matchesPaid = !filterPaid || (filterPaid === 'paid' ? s.paid : !s.paid);
    return matchesSearch && matchesGrade && matchesGroup && matchesPaid;
  });

  const sections = useMemo(() => {
    const map = new Map();

    groups.forEach((g) => {
      map.set(g.id, { id: g.id, name: g.name, color: g.color, students: [] });
    });
    map.set('none', { id: 'none', name: 'بدون مجموعة', color: '#9ca3af', students: [] });

    filteredStudents.forEach((s) => {
      const key = s.group_id || 'none';
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: s.groups?.name || 'بدون مجموعة',
          color: s.groups?.color || '#9ca3af',
          students: [],
        });
      }
      map.get(key).students.push(s);
    });

    return Array.from(map.values()).filter((section) => section.students.length > 0);
  }, [filteredStudents, groups]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">إدارة الطلاب</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + إضافة طالب
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="بحث بالاسم أو الصف أو المجموعة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg p-2 text-right flex-1 min-w-[200px]"
          />
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="border rounded-lg p-2 text-right"
          >
            <option value="">كل الصفوف</option>
            {grades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
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
          <select
            value={filterPaid}
            onChange={(e) => setFilterPaid(e.target.value)}
            className="border rounded-lg p-2 text-right"
          >
            <option value="">كل حالات الدفع</option>
            <option value="paid">دفعوا</option>
            <option value="unpaid">لسه</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">جاري التحميل...</p>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
          مفيش طلاب مطابقين
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const isCollapsed = collapsed[section.id];
            const unpaidCount = section.students.filter((s) => !s.paid).length;

            return (
              <div key={section.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCollapse(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: section.color }}
                    ></span>
                    <span className="font-bold">{section.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                      {section.students.length} طالب
                    </span>
                    {unpaidCount > 0 && (
                      <span className="text-xs bg-red-50 text-red-600 rounded-full px-2 py-0.5">
                        {unpaidCount} لسه ما دفعش
                      </span>
                    )}
                  </div>
                  <span className={`text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
                    ▼
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="border-t divide-y">
                    {section.students.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 p-4 flex-wrap hover:bg-gray-50 transition"
                      >
                        <div className="min-w-[140px]">
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-gray-400">
                            {s.grade}
                            {s.parent_phone ? ` · ${s.parent_phone}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => togglePaid(s)}
                            className={`text-xs px-3 py-1 rounded-full transition ${
                              s.paid
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {s.paid ? 'دفع ✓' : 'لسه'}
                          </button>
                          <button
                            onClick={() => openEditForm(s)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 transition"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-3 py-1 transition"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-bold text-lg mb-2">
              {editingId ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
            </h2>

            <div>
              <label className="block text-sm font-medium mb-1">الاسم</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg p-2 text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">الصف الدراسي</label>
              <input
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full border rounded-lg p-2 text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">المجموعة</label>
              <select
                value={form.group_id}
                onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                className="w-full border rounded-lg p-2 text-right"
              >
                <option value="">بدون مجموعة</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">رقم ولي الأمر (اختياري)</label>
              <input
                value={form.parent_phone}
                onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                className="w-full border rounded-lg p-2 text-right"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border rounded-lg p-2 text-right"
                rows={3}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition"
              >
                {editingId ? 'حفظ التعديلات' : 'إضافة'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}