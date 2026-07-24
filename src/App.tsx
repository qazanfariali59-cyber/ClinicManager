import { useState, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import LoginPage from '@/pages/LoginPage';
import AdminPanel from '@/pages/AdminPanel';
import DoctorPanel from '@/pages/DoctorPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getCurrentUser();
    setUser(stored);
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => setUser(loggedInUser);
  const handleLogout = () => setUser(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1b2a' }}>
        <div className="text-cyan-400 text-sm">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={handleLogin} />;
  if (user.role === 'admin') return <AdminPanel user={user} onLogout={handleLogout} />;
  return <DoctorPanel user={user} onLogout={handleLogout} />;
}
