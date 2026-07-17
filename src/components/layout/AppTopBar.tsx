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
    <>
      {/* Status bar */}
      <div className="app-status-bar">
        <span className="text-white/60 text-[10px] font-mono">09:41</span>
        <div className="flex gap-1.5 items-center">
          <div className="flex gap-0.5 items-end">
            {[3,4,5,6].map((h,i) => (
              <div key={i} className="w-0.5 bg-white/60 rounded-sm" style={{ height: `${h*2}px` }} />
            ))}
          </div>
          <div className="w-6 h-3 border border-white/50 rounded-sm flex items-center px-0.5">
            <div className="w-4 h-2 bg-white/60 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="app-topbar relative overflow-hidden">
        {/* Subtle cyan glow */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-400/5 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          {/* Logo + clinic name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-cyan-400/30">
              <img
                src="https://cdn-ai.onspace.ai/onspace/files/USWz3SFsYg5VMsZvvSxNSW/1000201395_LE_magic_x4_creativity_99_resemblance_20.jpg"
                alt="RAM"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm font-bold">رام</span>
                <span className="text-cyan-400/50 text-xs font-mono">RAM</span>
              </div>
              <span className="text-white/40 text-[10px]">{title}</span>
            </div>
          </div>

          {/* User badge + logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/8 border border-cyan-400/20 rounded-xl px-2.5 py-1.5">
              <div className="w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center">
                {isAdmin
                  ? <Shield size={11} className="text-cyan-400" />
                  : user.subRole === 'doctor'
                    ? <Stethoscope size={11} className="text-cyan-400" />
                    : <Users size={11} className="text-cyan-400" />}
              </div>
              <div>
                <p className="text-white text-[11px] font-semibold leading-tight">{user.name.split(' ').slice(-1)[0]}</p>
                <p className="text-cyan-400/70 text-[9px] leading-tight">{label}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
