# نظام إدارة مدرس اللغة العربية

نظام لإدارة الطلاب والمجموعات ومواعيد الحصص لمدرس خصوصي، مبني بـ Next.js و Supabase.

## المرحلة الحالية (Phase 1)

- تسجيل دخول للمدرس فقط (حساب واحد، مفيش تسجيل حسابات جديدة)
- لوحة تحكم: عدد الطلاب، عدد المجموعات، حصص اليوم، حصص الأسبوع، أقرب حصة قادمة
- إدارة الطلاب (إضافة / تعديل / حذف / بحث / فلترة بالصف والمجموعة)
- إدارة المجموعات (إضافة / تعديل / حذف) مع تلوين كل مجموعة بلون مختلف

المراحل الجاية: الجدول (يومي/أسبوعي/شهري)، الحضور والغياب، الإشعارات (Web Push)، التقارير والتصدير.

## خطوات التشغيل

### 1. تجهيز قاعدة البيانات في Supabase

1. افتح مشروعك على [supabase.com](https://supabase.com)
2. روح **SQL Editor** وانسخ محتوى ملف `supabase-schema.sql` كامل ونفذه
3. روح **Authentication > Users** واعمل يوزر واحد بس بإيميل وباسورد المدرس (ده حساب الدخول الوحيد المسموح بيه)
4. من **Project Settings > API** انسخ:
   - `Project URL`
   - `anon public key`

### 2. تجهيز المشروع محليًا

```bash
npm install
```

اعمل ملف `.env.local` في جذر المشروع (انسخ من `.env.example`) وحط فيه بياناتك:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. التشغيل محليًا

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

### 4. الرفع على GitHub

```bash
git init
git add . && git commit -m "phase 1: auth + dashboard + students + groups" 
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### 5. النشر على Vercel

1. روح [vercel.com](https://vercel.com) واعمل **New Project**
2. اختار الريبو من GitHub
3. في **Environment Variables** ضيف نفس المتغيرين اللي في `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## هيكل المشروع

```
teacher-system/
├── app/
│   ├── layout.jsx          # الليه أوت الرئيسي
│   ├── page.jsx            # يوجه لـ /dashboard
│   ├── globals.css
│   ├── login/page.jsx      # تسجيل الدخول
│   ├── dashboard/
│   │   ├── layout.jsx      # القائمة الجانبية
│   │   └── page.jsx        # لوحة التحكم
│   ├── students/page.jsx   # إدارة الطلاب
│   └── groups/page.jsx     # إدارة المجموعات
├── components/
│   └── LogoutButton.jsx
├── lib/
│   ├── supabase.js         # عميل المتصفح
│   └── supabaseServer.js   # عميل السيرفر
├── middleware.js           # حماية الصفحات
├── supabase-schema.sql     # سكيما قاعدة البيانات
└── .env.example
