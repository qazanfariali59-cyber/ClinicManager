import { useState, useEffect } from 'react';
import { User } from '@/types';
import AppTopBar from '@/components/layout/AppTopBar';
import QuickReferral from '@/components/features/doctor/QuickReferral';
import AppointmentForm from '@/components/features/doctor/AppointmentForm';
import MyReferrals from '@/components/features/doctor/MyReferrals';
import MyPatients from '@/components/features/doctor/MyPatients';
import { getReferrals, getShares, calcShareAmount } from '@/lib/api';
import { ArrowRight, CalendarDays, List, Users, TrendingUp, Clock } from 'lucide-react';

interface DoctorPanelProps {
  user: User;
  onLogout: () => void;
}

export default function DoctorPanel({ user, onLogout }: DoctorPanelProps) {
  const isDoctor = user.subRole === 'doctor';
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPend, setTotalPend] = useState(0);

  useEffect(() => {
    Promise.all([getReferrals(), getShares()]).then(([referrals, shares]) => {
      const myRef = referrals.filter(r => r.referrerId === user.id && r.serviceId && r.totalAmount);
      const myPerf = isDoctor ? referrals.filter(r => r.performerId === user.id && r.serviceId && r.totalAmount) : [];

      const paid =
        myRef.filter(r => r.status === 'paid').reduce((s, r) => s + calcShareAmount(shares, user.id, r.serviceId!, 'referrer', r.totalAmount!), 0) +
        myPerf.filter(r => r.status === 'paid').reduce((s, r) => s + calcShareAmount(shares, user.id, r.serviceId!, 'performer', r.totalAmount!), 0);
      const pend =
        myRef.filter(r => r.status === 'pending').reduce((s, r) => s + calcShareAmount(shares, user.id, r.serviceId!, 'referrer', r.totalAmount!), 0) +
        myPerf.filter(r => r.status === 'pending').reduce((s, r) => s + calcShareAmount(shares, user.id, r.serviceId!, 'performer', r.totalAmount!), 0);

      setTotalPaid(paid);
      setTotalPend(pend);
    });
  }, [user.id, isDoctor]);

  const tabs = [
    { id: 'quick-referral', label: 'ارجاع سریع', icon: ArrowRight },
    { id: 'appointment', label: 'ثبت نوبت', icon: CalendarDays },
    { id: 'my-referrals', label: 'ارجاعات من', icon: List },
    ...(isDoctor ? [{ id: 'my-patients', label: 'بیماران من', icon: Users }] : []),
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="app-shell" dir="rtl">
      <AppTopBar user={user} title={isDoctor ? 'پنل پزشک' : 'پنل پذیرش'} onLogout={onLogout} />

      {/* Tab navigation */}
      <nav className="app-bottom-nav">
        <div className="flex w-full max-w-[1100px] mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`app-bottom-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="nav-icon-wrap">
                  <Icon size={16} />
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Stats strip */}
      <div className="bg-[#0d1b2a] border-b border-cyan-400/10">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex gap-4">
          <div className="flex items-center gap-2.5 bg-white/6 border border-cyan-400/15 rounded-xl px-4 py-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,232,214,0.15)' }}>
              <TrendingUp size={13} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-[9px] text-white/40">دریافت‌شده (ریال)</p>
              <p className="text-sm font-bold text-cyan-400">{totalPaid.toLocaleString('fa-IR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white/6 border border-amber-400/15 rounded-xl px-4 py-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Clock size={13} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] text-white/40">در انتظار (ریال)</p>
              <p className="text-sm font-bold text-amber-400">{totalPend.toLocaleString('fa-IR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="app-content pt-6">
        {activeTab === 'quick-referral' && <QuickReferral currentUser={user} />}
        {activeTab === 'appointment' && <AppointmentForm currentUser={user} />}
        {activeTab === 'my-referrals' && <MyReferrals currentUser={user} />}
        {activeTab === 'my-patients' && isDoctor && <MyPatients currentUser={user} />}
      </div>
    </div>
  );
}
