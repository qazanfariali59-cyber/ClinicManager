import { useState, useEffect } from 'react';
import { User, Referral, UserServiceShare } from '@/types';
import { getUsers, getReferrals, getShares, getPatients, calcShareAmount, formatCurrency } from '@/lib/api';
import { TrendingUp, Clock, Users, CheckCircle, Loader2 } from 'lucide-react';

export default function FinancialReport() {
  const [users, setUsers] = useState<User[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [shares, setShares] = useState<UserServiceShare[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUsers(), getReferrals(), getShares(), getPatients()]).then(([u, r, sh, p]) => {
      setUsers(u.filter(x => x.role !== 'admin'));
      setReferrals(r);
      setShares(sh);
      setPatientCount(p.length);
      setLoading(false);
    });
  }, []);

  const totalPaid = referrals.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalPending = referrals.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const getUserSummary = (userId: string) => {
    // سهم ارجاع‌دهنده
    const myRef = referrals.filter(r => r.referrerId === userId && r.serviceId && r.totalAmount);
    const refPaid = myRef.filter(r => r.status === 'paid')
      .reduce((s, r) => s + calcShareAmount(shares, userId, r.serviceId!, 'referrer', r.totalAmount!), 0);
    const refPending = myRef.filter(r => r.status === 'pending')
      .reduce((s, r) => s + calcShareAmount(shares, userId, r.serviceId!, 'referrer', r.totalAmount!), 0);

    // سهم انجام‌دهنده
    const myPerf = referrals.filter(r => r.performerId === userId && r.serviceId && r.totalAmount);
    const perfPaid = myPerf.filter(r => r.status === 'paid')
      .reduce((s, r) => s + calcShareAmount(shares, userId, r.serviceId!, 'performer', r.totalAmount!), 0);
    const perfPending = myPerf.filter(r => r.status === 'pending')
      .reduce((s, r) => s + calcShareAmount(shares, userId, r.serviceId!, 'performer', r.totalAmount!), 0);

    return { refPaid, refPending, perfPaid, perfPending, refCount: myRef.length, perfCount: myPerf.length };
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="p-4" dir="rtl">
      <h2 className="text-base font-bold text-slate-800 mb-4">گزارش مالی</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #0d1b2a, #1a3a5c)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-cyan-400" />
            <span className="text-[11px] text-cyan-200">واریز شده</span>
          </div>
          <p className="text-lg font-bold text-cyan-400">{totalPaid.toLocaleString('fa-IR')}</p>
          <p className="text-[10px] text-white/40 mt-0.5">ریال</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-amber-600" />
            <span className="text-[11px] text-amber-600">در انتظار</span>
          </div>
          <p className="text-lg font-bold text-amber-600">{totalPending.toLocaleString('fa-IR')}</p>
          <p className="text-[10px] text-amber-400 mt-0.5">ریال</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-slate-500" />
            <span className="text-[11px] text-slate-500">ارجاعات کل</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{referrals.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{referrals.filter(r => r.status === 'paid').length} واریزشده</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-green-600" />
            <span className="text-[11px] text-slate-500">بیماران</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{patientCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">نفر ثبت‌شده</p>
        </div>
      </div>

      {/* Per user - با تفکیک ارجاع و انجام */}
      <h3 className="text-xs font-bold text-slate-600 mb-3">جزئیات مالی کاربران</h3>
      <div className="space-y-2">
        {users.map(u => {
          const s = getUserSummary(u.id);
          const totalReceived = s.refPaid + s.perfPaid;
          const totalPend = s.refPending + s.perfPending;
          return (
            <div key={u.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-sm flex-shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                  <p className="text-[10px] text-slate-400">{u.subRole === 'doctor' ? 'پزشک' : 'پذیرش'} · {s.refCount} ارجاع · {s.perfCount} خدمت</p>
                </div>
              </div>
              {/* جدا کردن سهم ارجاع و انجام */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-green-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-green-600 mb-0.5">دریافت‌شده</p>
                  <p className="text-sm font-bold text-green-700">{totalReceived > 0 ? totalReceived.toLocaleString('fa-IR') : '—'}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-amber-600 mb-0.5">در انتظار</p>
                  <p className="text-sm font-bold text-amber-600">{totalPend > 0 ? totalPend.toLocaleString('fa-IR') : '—'}</p>
                </div>
              </div>
              {/* breakdown */}
              {(s.refPaid + s.refPending > 0 || s.perfPaid + s.perfPending > 0) && (
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                  {(s.refPaid + s.refPending) > 0 && (
                    <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-400">ارجاع: </span>
                      <span className="font-semibold text-slate-700">{(s.refPaid + s.refPending).toLocaleString('fa-IR')}</span>
                    </div>
                  )}
                  {(s.perfPaid + s.perfPending) > 0 && (
                    <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-400">انجام: </span>
                      <span className="font-semibold text-slate-700">{(s.perfPaid + s.perfPending).toLocaleString('fa-IR')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
