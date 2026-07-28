import Link from 'next/link';
import LogoutButton from '../../components/LogoutButton';

const navItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: '🏠' },
  { href: '/students', label: 'الطلاب', icon: '👨‍🎓' },
  { href: '/groups', label: 'المجموعات', icon: '👥' },
  { href: '/schedule', label: 'الجدول', icon: '📅' },
  { href: '/notifications', label: 'الإشعارات', icon: '🔔' },
];

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-l shadow-sm hidden md:flex flex-col">
        <div className="p-5 border-b">
          <h1 className="font-bold text-lg">نظام المدرس</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Mobile top nav */}
        <div className="md:hidden bg-white border-b p-3 flex justify-around">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-gray-700 flex flex-col items-center">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
