'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="px-6 py-3 rounded-xl bg-danger-600 hover:bg-danger-500 text-white font-semibold transition-colors duration-200 text-sm shadow-md"
    >
      Keluar (Logout)
    </button>
  );
}
