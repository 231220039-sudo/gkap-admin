import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function Login() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Call the backend to verify the key
    try {
      const res = await fetch('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: key }),
      });

      if (res.ok) {
        localStorage.setItem('adminKey', key);
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid Admin Key');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-theme min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#E5E7EB] border border-[#91d06c] rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#91d06c] rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#406093]" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-[#406093] mb-2">Admin Portal</h2>
        <p className="text-[#4c8ce4] text-center mb-8">Enter your secure key to access orders</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#406093] mb-2">Admin Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-3 bg-[#fffbd1] border border-[#4c8ce4] rounded-xl text-[#406093] placeholder-[#4c8ce4]/60 focus:outline-none focus:border-[#406093] focus:ring-1 focus:ring-[#406093] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-[#406093] text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4c8ce4] hover:bg-[#406093] text-[#E5E7EB] font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
