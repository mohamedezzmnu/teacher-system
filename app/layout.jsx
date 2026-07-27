import './globals.css';

export const metadata = {
  title: 'نظام إدارة مدرس اللغة العربية',
  description: 'إدارة الطلاب والمجموعات ومواعيد الحصص',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
