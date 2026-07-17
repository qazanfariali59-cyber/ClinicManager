import { useState, useEffect } from 'react';
import { User, Referral, Patient, Service, UserServiceShare } from '@/types';
import { getReferrals, getPatients, getServices, getUsers, getShares, calcShareAmount, formatCurrency } from '@/lib/api';
import { Check, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface MyReferralsProps {
  currentUser: User;
}

export default function MyReferrals({ currentUser }: MyReferralsProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shares, setShares] = useState<UserServiceShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getReferrals(), getPatients(), getServices(), getUsers(), getShares()]).then(([r, p, s, u, sh]) => {
      setReferrals(r.filter(x => x.referrerId === currentUser.id));
      setPatients(p);
      setServices(s);
      setUsers(u);
      setShares(sh);
      setLoading(false);
    });
  }, [currentUser.id]);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  // سهم به عنوان ارجاع‌دهنده
  const paidShare = referrals.filter(r => r.status === 'paid' && r.serviceId && r.totalAmount)
    .reduce((sum, r) => sum + calcShareAmount(shares, currentUser.id, r.serviceId!, 'referrer', r.totalAmount!), 0);
  const pendingShare = referrals.filter(r => r.status === 'pending' && r.serviceId && r.totalAmount)
    .reduce((sum, r) => sum + calcShareAmount(shares, currentUser.id, r.serviceId!, 'referrer', r.totalAmount!), 0);

  return (
    <div className="p-4" dir="rtl">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800">ارجاعات من</h2>
        <p className="text-xs text-slate-400">{referrals.length} ارجاع ثبت‌شده · سهم ارجاع‌دهنده</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl p-3 text-white" style={{ background: 'linear-gradient(135deg, #0d1b2a, #1a3a5c)' }}>
          <p className="text-[10px] text-cyan-300 mb-1">دریافت‌شده</p>
          <p className="text-base font-bold text-cyan-400">{paidShare.toLocaleString('fa-IR')}</p>
          <p className="text-[9px] text-white/30">ریال</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <p className="text-[10px] text-amber-600 mb-1">در انتظار</p>
          <p className="text-base font-bold text-amber-600">{pendingShare.toLocaleString('fa-IR')}</p>
          <p className="text-[9px] text-amber-400">ریال</p>
        </div>
      </div>

      {referrals.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">هیچ ارجاعی ثبت نکرده‌اید</div>}

      <div className="space-y-2">
        {referrals.map(r => {
          const patient = patients.find(p => p.id === r.patientId);
          const service = services.find(s => s.id === r.serviceId);
          const performer = users.find(u => u.id === r.performerId);
          // سهم ارجاع‌دهنده
          const myShare = r.serviceId && r.totalAmount
            ? calcShareAmount(shares, currentUser.id, r.serviceId, 'referrer', r.totalAmount)
            : 0;
          const isExpanded = expanded === r.id;

          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-right"
                onClick={() => setExpanded(isExpanded ? null : r.id)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #e0faf8, #b2f0ea)', color: '#00b8aa' }}>
                  {patient?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{patient?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{r.date} · {service?.name || 'خدمت تعیین‌نشده'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.status === 'paid'
                    ? <span className="flex items-center gap-0.5 bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full"><Check size={9}/>واریز</span>
                    : <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full"><Clock size={9}/>انتظار</span>
                  }
                  {myShare > 0 && (
                    <p className={`text-xs font-bold ${r.status === 'paid' ? 'text-cyan-700' : 'text-amber-600'}`}>
                      {myShare.toLocaleString('fa-IR')}
                    </p>
                  )}
                  {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><p className="text-slate-400 mb-0.5">پزشک انجام‌دهنده</p><p className="font-medium text-slate-700">{performer?.name || 'تعیین‌نشده'}</p></div>
                    <div><p className="text-slate-400 mb-0.5">خدمت</p><p className="font-medium text-slate-700">{service?.name || '—'}</p></div>
                    <div><p className="text-slate-400 mb-0.5">مبلغ کل</p><p className="font-medium text-slate-700">{r.totalAmount ? formatCurrency(r.totalAmount) : '—'}</p></div>
                    <div>
                      <p className="text-slate-400 mb-0.5">سهم ارجاع شما</p>
                      <p className={`font-bold text-sm ${r.status === 'paid' ? 'text-cyan-700' : 'text-amber-600'}`}>
                        {myShare > 0 ? formatCurrency(myShare) : '—'}
                      </p>
                    </div>
                    {r.sessions > 0 && <div><p className="text-slate-400 mb-0.5">جلسات</p><p className="font-medium text-slate-700">{r.completedSessions}/{r.sessions}</p></div>}
                    {r.paidDate && <div><p className="text-slate-400 mb-0.5">تاریخ واریز</p><p className="font-medium text-green-700">{r.paidDate}</p></div>}
                    {r.notes && <div className="col-span-2"><p className="text-slate-400 mb-0.5">یادداشت</p><p className="text-slate-600">{r.notes}</p></div>}
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
