import { useState } from 'react';
import { User } from '@/types';
import { login } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    const user = await login(username.trim());
    setLoading(false);
    if (user) {
      onLogin(user);
    } else {
      setError('نام کاربری یافت نشد یا غیرفعال است');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1b2a 50%, #0a1f30 100%)' }}>

      {/* Background logo watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <img
          src="https://cdn-ai.onspace.ai/onspace/files/USWz3SFsYg5VMsZvvSxNSW/1000201395_LE_magic_x4_creativity_99_resemblance_20.jpg"
          alt=""
          className="w-[500px] h-[500px] object-contain"
          style={{ opacity: 0.04, filter: 'blur(4px)' }}
        />
      </div>

      {/* Glow blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,232,214,0.06) 0%, transparent 70%)' }} />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,184,170,0.05) 0%, transparent 70%)' }} />

      {/* Card */}
      <div className="relative w-full max-w-md mx-auto px-6">
        <div className="rounded-3xl p-10 border border-white/8"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>

          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-cyan-400/30 shadow-2xl mb-6"
              style={{ boxShadow: '0 0 60px rgba(0,232,214,0.2)' }}>
              <img
                src="https://cdn-ai.onspace.ai/onspace/files/USWz3SFsYg5VMsZvvSxNSW/1000201395_LE_magic_x4_creativity_99_resemblance_20.jpg"
                alt="RAM"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl font-black text-white tracking-wider mb-2">
              <span style={{ color: '#00e8d6' }}>R</span>AM
            </h1>
            <p className="text-white/40 text-sm">سامانه مدیریت کلینیک رام</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-2 font-medium">نام کاربری</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="username"
                autoComplete="username"
                className="login-input w-full border-2 border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-cyan-400/60 transition-colors"
                dir="ltr"
              />
              {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !username.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'ورود به سامانه'}
            </button>
          </div>

          <p className="text-white/20 text-[11px] mt-8 text-center">
            دسترسی فقط برای پرسنل مجاز کلینیک رام
          </p>
        </div>
      </div>
    </div>
  );
}
