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
    <div className="app-shell" dir="rtl" style={{ background: '#0d1b2a' }}>
      {/* Background logo watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <img
          src="https://cdn-ai.onspace.ai/onspace/files/USWz3SFsYg5VMsZvvSxNSW/1000201395_LE_magic_x4_creativity_99_resemblance_20.jpg"
          alt=""
          className="w-80 h-80 object-contain opacity-5"
          style={{ filter: 'blur(2px)' }}
        />
      </div>

      {/* Cyan glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,232,214,0.08) 0%, transparent 70%)' }} />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center flex-1 px-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-cyan-400/30 shadow-lg mb-5"
            style={{ boxShadow: '0 0 40px rgba(0,232,214,0.2)' }}>
            <img
              src="https://cdn-ai.onspace.ai/onspace/files/USWz3SFsYg5VMsZvvSxNSW/1000201395_LE_magic_x4_creativity_99_resemblance_20.jpg"
              alt="RAM"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-wide mb-1">
            <span style={{ color: '#00e8d6' }}>R</span>AM
          </h1>
          <p className="text-white/40 text-sm">سامانه مدیریت کلینیک</p>
        </div>

        {/* Form */}
        <div className="w-full">
          <div className="mb-5">
            <label className="block text-xs text-white/50 mb-2 font-medium">نام کاربری</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="username"
              autoComplete="username"
              className="w-full bg-white/6 border-2 border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-400/60 transition-colors"
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

        <p className="text-white/20 text-[11px] mt-10 text-center">
          دسترسی فقط برای پرسنل مجاز کلینیک رام
        </p>
      </div>
    </div>
  );
}
