import { useState, useEffect } from 'react';
import { Referral, User, Patient, Service } from '@/types';
import { getReferrals, updateReferral, getUsers, getPatients, getServices, formatCurrency } from '@/lib/api';
import { Check, Clock, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function ReferralAssignment() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Referral>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getReferrals(), getUsers(), getPatients(), getServices()]).then(([r, u, p, s]) => {
      setReferrals(r);
      setUsers(u);
      setPatients(p);
      setServices(s);
      setLoading(false);
    });
  }, []);

  const refresh = () => getReferrals().then(setReferrals);
  const getPerformers = () => users.filter(u => u.isPerformer);

  const startEdit = (r: Referral) => {
    setEditing(r.id);
    setEditForm({ performerId: r.performerId, serviceId: r.serviceId, totalAmount: r.totalAmount, sessions: r.sessions, completedSessions: r.completedSessions, status: r.status, notes: r.notes });
  };

  const saveEdit = async (referral: Referral) => {
    setSaving(true);
    const updated: Referral = {
      ...referral,
      performerId: editForm.performerId,
      serviceId: editForm.serviceId,
      totalAmount: editForm.totalAmount ? Number(editForm.totalAmount) : undefined,
      sessions: Number(editForm.sessions) || referral.sessions,
      completedSessions: Number(editForm.completedSessions) || referral.completedSessions,
      status: editForm.status || referral.status,
      notes: editForm.notes,
      paidDate: editForm.status === 'paid' && !referral.paidDate ? new Date().toISOString().split('T')[0] : referral.paidDate,
    };
    await updateReferral(updated);
    await refresh();
    setSaving(false);
    setEditing(null);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  const pending = referrals.filter(r => !r.performerId);

  return (
    <div className="p-4" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">مدیریت ارجاعات</h2>
          <p className="text-xs text-slate-400">{referrals.length} ارجاع · {pending.length} نیاز به بررسی</p>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">{pending.length} ارجاع نیاز به تعیین پزشک دارد</p>
        </div>
      )}

      <div className="space-y-2">
        {referrals.map(r => {
          const patient = patients.find(p => p.id === r.patientId);
          const referrer = users.find(u => u.id === r.referrerId);
          const performer = users.find(u => u.id === r.performerId);
          const service = services.find(s => s.id === r.serviceId);
          const isEditing = editing === r.id;
          const isPending = !r.performerId;

          return (
            <div key={r.id} className={`bg-white rounded-2xl border overflow-hidden ${isPending ? 'border-amber-200' : 'border-slate-100'}`}>
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 text-sm truncate">{patient?.name}</span>
                      {r.status === 'paid'
                        ? <span className="flex items-center gap-0.5 bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"><Check size={9}/>واریز</span>
                        : <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"><Clock size={9}/>انتظار</span>
                      }
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>ارجاع: <span className="text-slate-700">{referrer?.name || '—'}</span> · {r.date}</p>
                      <p>پزشک: <span className={performer ? 'text-slate-700' : 'text-amber-600 font-medium'}>{performer?.name || 'تعیین نشده'}</span>
                        {service && <span> · {service.name}</span>}
                      </p>
                      {r.totalAmount && <p>مبلغ: <span className="text-slate-700 font-medium">{r.totalAmount.toLocaleString('fa-IR')} ریال</span></p>}
                    </div>
                  </div>
                  <button onClick={() => isEditing ? setEditing(null) : startEdit(r)}
                    className="flex items-center gap-1 text-[11px] text-cyan-700 border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 rounded-lg font-medium flex-shrink-0">
                    {isEditing ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                    {isEditing ? 'بستن' : 'ویرایش'}
                  </button>
                </div>

                {isEditing && (
                  <div className="mt-3 bg-[#0d1b2a] rounded-xl p-3 border border-cyan-400/20">
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">پزشک انجام‌دهنده</label>
                          <select value={editForm.performerId || ''} onChange={e => setEditForm(p => ({ ...p, performerId: e.target.value || undefined }))}
                            className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400">
                            <option value="" className="bg-[#0d1b2a]">— انتخاب —</option>
                            {getPerformers().map(u => <option key={u.id} value={u.id} className="bg-[#0d1b2a]">{u.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">نوع خدمت</label>
                          <select value={editForm.serviceId || ''} onChange={e => setEditForm(p => ({ ...p, serviceId: e.target.value || undefined }))}
                            className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400">
                            <option value="" className="bg-[#0d1b2a]">— انتخاب —</option>
                            {services.map(s => <option key={s.id} value={s.id} className="bg-[#0d1b2a]">{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">مبلغ کل (ریال)</label>
                          <input type="number" value={editForm.totalAmount || ''}
                            onChange={e => setEditForm(p => ({ ...p, totalAmount: Number(e.target.value) || undefined }))}
                            className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400" dir="ltr" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">وضعیت</label>
                          <select value={editForm.status || 'pending'}
                            onChange={e => setEditForm(p => ({ ...p, status: e.target.value as 'pending' | 'paid' }))}
                            className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400">
                            <option value="pending" className="bg-[#0d1b2a]">در انتظار</option>
                            <option value="paid" className="bg-[#0d1b2a]">واریز شده</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">تعداد جلسات</label>
                          <input type="number" value={editForm.sessions ?? ''}
                            onChange={e => setEditForm(p => ({ ...p, sessions: Number(e.target.value) }))}
                            className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400" dir="ltr" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">جلسات انجام‌شده</label>
                          <input type="number" value={editForm.completedSessions ?? ''}
                            onChange={e => setEditForm(p => ({ ...p, completedSessions: Number(e.target.value) }))}
                            className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400" dir="ltr" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">یادداشت</label>
                        <input value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                          className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400" />
                      </div>
                      <button onClick={() => saveEdit(r)} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} ذخیره
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
