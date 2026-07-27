'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#ef4444'];

const emptyForm = {
  name: '',
  grade: '',
  day_of_week: days[0],
  start_time: '',
  end_time: '',
  location: '',
  color: colors[0],
};

export default function GroupsPage() {
  const supabase = createClient();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const loadGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    setGroups(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (group) => {
    setForm({
      name: group.name,
      grade: group.grade,
      day_of_week: group.day_of_week,
      start_time: group.start_time?.slice(0, 5) || '',
      end_time: group.end_time?.slice(0, 5) || '',
      location: group.location || '',
      color: group.color || colors[0],
    });
    setEditingId(group.id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.grade || !form.start_time || !form.end_time) {
      setError('من فضلك املأ كل الحقول المطلوبة');
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('groups').update(form).eq('id', editingId);
      if (error) {
        setError('حصل خطأ أثناء التعديل');
        return;
      }
    } else {
      const { error } = await supabase.from('groups').insert(form);
      if (error) {
        setError('حصل خطأ أثناء الإضافة');
        return;
      }
    }

    setShowForm(false);
    loadGroups();
  };

  const handleDelete = async (id) => {
    if (!confirm('متأكد إنك عايز تحذف المجموعة دي؟ هيتشال ربطها بالطلاب.')) return;
    await supabase.from('groups').delete().eq('id', id);
    loadGroups();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المجموعات</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + إضافة مجموعة
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">جاري التحميل...</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-400">مفيش مجموعات لسه، ابدأ بإضافة واحدة.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm border-r-4" style={{ borderColor: g.color }}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{g.name}</h3>
                <span
                  className="w-4 h-4 rounded-full inline-block"
                  style={{ backgroundColor: g.color }}
                ></span>
              </div>
              <p className="text-sm text-gray-500 mb-1">الصف: {g.grade}</p>
              <p className="text-sm text-gray-500 mb-1">
                {g.day_of_week} — {g.start_time?.slice(0, 5)} إلى {g.end_time?.slice(0, 5)}
              </p>
              {g.location && <p className="text-sm text-gray-500 mb-1">المكان: {g.location}</p>}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openEditForm(g)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 transition"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-3 py-1 transition"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-bold text-lg mb-2">
              {editingId ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
            </h2>

            <div>
              <label className="block text-sm font-medium mb-1">اسم المجموعة</label>
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
              <label className="block text-sm font-medium mb-1">اليوم</label>
              <select
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                className="w-full border rounded-lg p-2 text-right"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">وقت البداية</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">وقت النهاية</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">مكان الحصة (اختياري)</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border rounded-lg p-2 text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">لون المجموعة</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-black' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  ></button>
                ))}
              </div>
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
