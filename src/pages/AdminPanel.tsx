import { useState } from 'react';
import { User } from '@/types';
import AppTopBar from '@/components/layout/AppTopBar';
import UserManagement from '@/components/features/admin/UserManagement';
import ServiceManagement from '@/components/features/admin/ServiceManagement';
import ReferralAssignment from '@/components/features/admin/ReferralAssignment';
import FinancialReport from '@/components/features/admin/FinancialReport';
import { Users, Activity, ArrowLeftRight, BarChart2 } from 'lucide-react';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

const tabs = [
  { id: 'users', label: 'کاربران', icon: Users },
  { id: 'services', label: 'خدمات', icon: Activity },
  { id: 'referrals', label: 'ارجاعات', icon: ArrowLeftRight },
  { id: 'financial', label: 'مالی', icon: BarChart2 },
];

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('users');

  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Users;

  return (
    <div className="app-shell" dir="rtl">
      <AppTopBar user={user} title="پنل مدیریت" onLogout={onLogout} />

      {/* Content */}
      <div className="app-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'services' && <ServiceManagement />}
        {activeTab === 'referrals' && <ReferralAssignment />}
        {activeTab === 'financial' && <FinancialReport />}
      </div>

      {/* Bottom Navigation */}
      <nav className="app-bottom-nav">
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
                <Icon size={18} />
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
