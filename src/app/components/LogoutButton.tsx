'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="px-6 py-3 rounded-xl w-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors duration-200 text-sm shadow-md cursor-pointer"
    >
      Keluar (Logout)
    </button>
  );
}
