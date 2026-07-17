import { useState, useEffect } from 'react';
import { User, Referral, Patient, Service, UserServiceShare } from '@/types';
import { getReferrals, getPatients, getServices, getUsers, getShares, calcShareAmount, formatCurrency } from '@/lib/api';
import { Check, Clock, ChevronDown, ChevronUp, Activity, Loader2 } from 'lucide-react';

interface MyPatientsProps {
  currentUser: User;
}

export default function MyPatients({ currentUser }: MyPatientsProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shares, setShares] = useState<UserServiceShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getReferrals(), getPatients(), getServices(), getUsers(), getShares()]).then(([r, p, s, u, sh]) => {
      setReferrals(r.filter(x => x.performerId === currentUser.id));
      setPatients(p);
      setServices(s);
      setUsers(u);
      setShares(sh);
      setLoading(false);
    });
  }, [currentUser.id]);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  // سهم به عنوان انجام‌دهنده
  const paidShare = referrals.filter(r => r.status === 'paid' && r.serviceId && r.totalAmount)
    .reduce((sum, r) => sum + calcShareAmount(shares, currentUser.id, r.serviceId!, 'performer', r.totalAmount!), 0);
  const pendingShare = referrals.filter(r => r.status === 'pending' && r.serviceId && r.totalAmount)
    .reduce((sum, r) => sum + calcShareAmount(shares, currentUser.id, r.serviceId!, 'performer', r.totalAmount!), 0);

  const uniquePatientIds = [...new Set(referrals.map(r => r.patientId))];

  return (
    <div className="p-4" dir="rtl">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800">بیماران من</h2>
        <p className="text-xs text-slate-400">{uniquePatientIds.length} بیمار · {referrals.length} خدمت انجام‌شده · سهم انجام‌دهنده</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl p-3" style={{ background: 'linear-gradient(135deg, #0d1b2a, #1a3a5c)' }}>
          <p className="text-[10px] text-cyan-300 mb-1">سهم درمان واریزشده</p>
          <p className="text-base font-bold text-cyan-400">{paidShare.toLocaleString('fa-IR')}</p>
          <p className="text-[9px] text-white/30">ریال</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <p className="text-[10px] text-amber-600 mb-1">در انتظار دریافت</p>
          <p className="text-base font-bold text-amber-600">{pendingShare.toLocaleString('fa-IR')}</p>
          <p className="text-[9px] text-amber-400">ریال</p>
        </div>
      </div>

      {uniquePatientIds.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">بیماری ثبت نشده</div>}

      <div className="space-y-2">
        {uniquePatientIds.map(patientId => {
          const patient = patients.find(p => p.id === patientId);
          const patientReferrals = referrals.filter(r => r.patientId === patientId);
          const latest = patientReferrals[0];
          const isExpanded = expanded === patientId;

          const totalMyShare = patientReferrals.reduce((sum, r) => {
            if (!r.serviceId || !r.totalAmount) return sum;
            return sum + calcShareAmount(shares, currentUser.id, r.serviceId, 'performer', r.totalAmount);
          }, 0);
          const paidMyShare = patientReferrals.filter(r => r.status === 'paid').reduce((sum, r) => {
            if (!r.serviceId || !r.totalAmount) return sum;
            return sum + calcShareAmount(shares, currentUser.id, r.serviceId, 'performer', r.totalAmount);
          }, 0);
          const hasOngoing = patientReferrals.some(r => r.completedSessions < r.sessions && r.sessions > 0);

          return (
            <div key={patientId} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-right"
                onClick={() => setExpanded(isExpanded ? null : patientId)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #e0faf8, #b2f0ea)', color: '#00b8aa' }}>
                  {patient?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-800 text-sm truncate">{patient?.name}</p>
                    {hasOngoing && (
                      <span className="flex items-center gap-0.5 bg-cyan-50 text-cyan-600 text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0">
                        <Activity size={8} />درجریان
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{patientReferrals.length} خدمت · آخرین: {latest?.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-xs font-bold text-cyan-700">
                    {totalMyShare > 0 ? formatCurrency(totalMyShare) : '—'}
                  </p>
                  {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 pb-3 border-b border-slate-200 text-xs">
                    <div><span className="text-slate-400">کد ملی: </span><span className="font-medium text-slate-700" dir="ltr">{patient?.nationalId}</span></div>
                    {patient?.phone && <div><span className="text-slate-400">تلفن: </span><span className="font-medium text-slate-700" dir="ltr">{patient.phone}</span></div>}
                    <div><span className="text-slate-400">واریزشده: </span><span className="font-bold text-green-700">{paidMyShare.toLocaleString('fa-IR')}</span></div>
                    <div><span className="text-slate-400">در انتظار: </span><span className="font-bold text-amber-600">{(totalMyShare - paidMyShare).toLocaleString('fa-IR')}</span></div>
                  </div>

                  <p className="text-[11px] font-bold text-slate-600 mb-3">سیر بیماری</p>
                  <div className="relative">
                    <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-cyan-200/60 rounded-full"></div>
                    <div className="space-y-3 pr-8">
                      {patientReferrals.map(r => {
                        const s = services.find(sv => sv.id === r.serviceId);
                        const referrer = users.find(u => u.id === r.referrerId);
                        // سهم انجام‌دهنده
                        const myS = r.serviceId && r.totalAmount
                          ? calcShareAmount(shares, currentUser.id, r.serviceId, 'performer', r.totalAmount)
                          : 0;
                        const isOngoing = r.completedSessions < r.sessions && r.sessions > 0;

                        return (
                          <div key={r.id} className="relative">
                            <div className={`absolute -right-5 top-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                              r.status === 'paid' ? 'bg-green-500' : isOngoing ? 'bg-cyan-500' : 'bg-amber-400'
                            }`}></div>
                            <div className="bg-white rounded-xl border border-slate-100 p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-sm text-slate-800">{s?.name || 'خدمت نامشخص'}</p>
                                  <p className="text-[10px] text-slate-400">{r.date}</p>
                                </div>
                                <div className="flex gap-1">
                                  {r.status === 'paid'
                                    ? <span className="bg-green-50 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full">واریز</span>
                                    : <span className="bg-amber-50 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full">انتظار</span>
                                  }
                                  {isOngoing && <span className="bg-cyan-50 text-cyan-700 text-[9px] px-1.5 py-0.5 rounded-full">درجریان</span>}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 mb-2">
                                <div><span className="text-slate-400">ارجاع‌دهنده: </span>{referrer?.name}</div>
                                {r.sessions > 0 && <div><span className="text-slate-400">جلسات: </span>{r.completedSessions}/{r.sessions}</div>}
                                <div><span className="text-slate-400">مبلغ: </span>{r.totalAmount ? r.totalAmount.toLocaleString('fa-IR') : '—'}</div>
                                <div><span className="text-slate-400">سهم انجام: </span>
                                  <span className={`font-bold ${r.status === 'paid' ? 'text-cyan-700' : 'text-amber-600'}`}>
                                    {myS > 0 ? myS.toLocaleString('fa-IR') : '—'}
                                  </span>
                                </div>
                              </div>
                              {r.sessions > 0 && (
                                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${r.status === 'paid' ? 'bg-green-500' : 'bg-cyan-500'}`}
                                    style={{ width: `${(r.completedSessions / r.sessions) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
