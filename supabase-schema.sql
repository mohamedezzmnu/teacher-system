-- ==========================================
-- سكيما قاعدة بيانات نظام إدارة مدرس اللغة العربية
-- نفّذ الكود ده في Supabase SQL Editor
-- ==========================================

create extension if not exists "uuid-ossp";

-- جدول المجموعات
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  grade text not null,
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  location text,
  color text default '#3b82f6',
  created_at timestamptz default now()
);

-- جدول الطلاب
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  grade text not null,
  group_id uuid references groups(id) on delete set null,
  parent_phone text,
  notes text,
  created_at timestamptz default now()
);

-- جدول الحصص الفعلية (occurrences)
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  status text default 'scheduled',
  created_at timestamptz default now()
);

-- جدول الحضور والغياب
create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  status text not null,
  created_at timestamptz default now(),
  unique(session_id, student_id)
);

-- سجل الإشعارات
create table if not exists notification_log (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  notify_type text not null,
  sent_at timestamptz default now()
);

-- اشتراكات Web Push
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz default now()
);

-- إعدادات الإشعارات
create table if not exists notification_settings (
  id uuid primary key default uuid_generate_v4(),
  day_before boolean default false,
  hour_before boolean default true,
  min_30_before boolean default true,
  min_10_before boolean default true
);

insert into notification_settings (hour_before, min_30_before, min_10_before)
select true, true, true
where not exists (select 1 from notification_settings);

-- indexes للبحث السريع
create index if not exists idx_students_group on students(group_id);
create index if not exists idx_sessions_date on sessions(session_date);

-- ==========================================
-- تفعيل RLS
-- ==========================================
alter table groups enable row level security;
alter table students enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;
alter table notification_log enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_settings enable row level security;

drop policy if exists "authenticated full access" on groups;
create policy "authenticated full access" on groups for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on students;
create policy "authenticated full access" on students for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on sessions;
create policy "authenticated full access" on sessions for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on attendance;
create policy "authenticated full access" on attendance for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on notification_log;
create policy "authenticated full access" on notification_log for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on notification_settings;
create policy "authenticated full access" on notification_settings for all using (auth.role() = 'authenticated');

drop policy if exists "public insert push" on push_subscriptions;
create policy "public insert push" on push_subscriptions for all using (true);

-- ==========================================
-- ملاحظة: بعد تنفيذ الكود، روح Authentication > Users
-- في Supabase واعمل يوزر واحد بس (إيميل + باسورد المدرس)
-- مفيش تسجيل حسابات جديدة من الموقع نهائي
-- ==========================================
