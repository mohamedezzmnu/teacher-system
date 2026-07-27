'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-right text-sm text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 transition"
    >
      تسجيل الخروج
    </button>
  );
}
