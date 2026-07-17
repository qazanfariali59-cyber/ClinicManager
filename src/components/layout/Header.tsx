import { User } from '@/types';
import { logout } from '@/lib/auth';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const roleLabels = {
  admin: 'مدیریت',
  doctor: 'پزشک',
  colleague: 'همکار',
};

const roleBadgeColors = {
  admin: 'bg-teal-100 text-teal-800',
  doctor: 'bg-blue-100 text-blue-800',
  colleague: 'bg-slate-100 text-slate-700',
};

export default function Header({ user, onLogout }: HeaderProps) {
  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="لوگو کلینیک" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-[17px] font-bold text-teal-800 leading-tight">کلینیک نوین</h1>
            <p className="text-[11px] text-slate-500 leading-tight">سامانه مدیریت داخلی</p>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              {user.role === 'admin'
                ? <Shield size={16} className="text-teal-700" />
                : <UserIcon size={16} className="text-teal-700" />}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${roleBadgeColors[user.role]}`}>
                {roleLabels[user.role]}
                {user.isReferrer && user.isPerformer && ' · ارجاع‌دهنده + انجام‌دهنده'}
                {user.isReferrer && !user.isPerformer && ' · ارجاع‌دهنده'}
                {!user.isReferrer && user.isPerformer && ' · انجام‌دهنده'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}
