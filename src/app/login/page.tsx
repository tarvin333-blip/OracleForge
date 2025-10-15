'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/studio'); // Redirect to creator's studio on successful login
    } catch (error: any) {
      setError(error.message);
      console.error("Error logging in:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">Login to Oracle Forge</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
