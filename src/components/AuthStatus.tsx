'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return <div className="text-sm text-gray-300">Loading...</div>;
  }

  return (
    <div className="flex gap-4 items-center">
      {user ? (
        <>
          <span className="text-sm text-gray-300">{user.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 transition-colors">
            Login
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors">
            Register
          </Link>
        </>
      )}
    </div>
  );
}
