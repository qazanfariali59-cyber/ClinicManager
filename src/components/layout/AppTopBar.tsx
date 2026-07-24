import { User } from '@/types';
import { logout } from '@/lib/auth';
import { LogOut, Shield, Stethoscope, Users } from 'lucide-react';

interface AppTopBarProps {
  user: User;
  title: string;
  onLogout: () => void;
}

const subRoleLabel = {
  doctor: 'پزشک',
  reception: 'پذیرش',
};

export default function AppTopBar({ user, title, onLogout }: AppTopBarProps) {
  const handleLogout = () => {
    logout();
    onLogout();
  };

  const isAdmin = user.role === 'admin';
  const label = isAdmin ? 'مدیر' : (user.subRole ? subRoleLabel[user.subRole] : 'همکار');

  return (
    <div className="app-topbar relative overflow-hidden">
      {/* Subtle cyan glow */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-400/5 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between max-w-[1100px] mx-auto">
        {/* Logo + clinic name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-400/30 flex-shrink-0">
            <img
              src="https://cdn-ai.onspace.ai/onspace/files/USWz3SFsYg5VMsZvvSxNSW/1000201395_LE_magic_x4_creativity_99_resemblance_20.jpg"
              alt="RAM"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-base font-bold">رام</span>
              <span className="text-cyan-400/50 text-sm font-mono">RAM</span>
              <span className="text-white/20 text-sm">|</span>
              <span className="text-white/50 text-sm">{title}</span>
            </div>
          </div>
        </div>

        {/* User badge + logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/8 border border-cyan-400/20 rounded-xl px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-cyan-400/20 flex items-center justify-center flex-shrink-0">
              {isAdmin
                ? <Shield size={12} className="text-cyan-400" />
                : user.subRole === 'doctor'
                  ? <Stethoscope size={12} className="text-cyan-400" />
                  : <Users size={12} className="text-cyan-400" />}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-cyan-400/70 text-[10px] leading-tight">{label}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs"
          >
            <LogOut size={14} />
            <span>خروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}
