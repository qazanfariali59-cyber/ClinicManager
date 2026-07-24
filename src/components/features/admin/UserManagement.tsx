import { useState, useEffect } from 'react';
import { User, Service, UserServiceShare } from '@/types';
import { addUser, updateUser, getUsers, getServices, getShares, upsertShare } from '@/lib/api';
import { Plus, Edit2, Check, X, UserCheck, UserX, Stethoscope, Users, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

type SubRole = 'doctor' | 'reception';

interface ShareDraft {
  serviceId: string;
  referrerPct: string;
  performerPct: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [shares, setShares] = useState<UserServiceShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<User & { subRole: SubRole }>>({});
  const [shareDrafts, setShareDrafts] = useState<ShareDraft[]>([]);
  const [showShares, setShowShares] = useState(false);

  useEffect(() => {
    Promise.all([getUsers(), getServices(), getShares()]).then(([u, s, sh]) => {
      setUsers(u.filter(x => x.role !== 'admin'));
      setServices(s);
      setShares(sh);
      setLoading(false);
    });
  }, []);

  const refresh = () =>
    Promise.all([getUsers(), getShares()]).then(([u, sh]) => {
      setUsers(u.filter(x => x.role !== 'admin'));
      setShares(sh);
    });

  const buildShareDrafts = (userId?: string): ShareDraft[] =>
    services.map(svc => {
      const ref = userId ? shares.find(s => s.userId === userId && s.serviceId === svc.id && s.shareType === 'referrer') : undefined;
      const perf = userId ? shares.find(s => s.userId === userId && s.serviceId === svc.id && s.shareType === 'performer') : undefined;
      return {
        serviceId: svc.id,
        referrerPct: ref ? String(ref.percentage) : '',
        performerPct: perf ? String(perf.percentage) : '',
      };
    });

  const startAdd = () => {
    setForm({ role: 'colleague', subRole: 'doctor', isReferrer: true, isPerformer: true, active: true });
    setShareDrafts(buildShareDrafts());
    setShowShares(false);
    setAdding(true);
    setEditing(null);
  };

  const startEdit = (u: User) => {
    setEditing(u);
    setForm({ ...u });
    setShareDrafts(buildShareDrafts(u.id));
    setShowShares(false);
    setAdding(false);
  };

  const cancel = () => { setEditing(null); setAdding(false); setForm({}); setShareDrafts([]); };

  const save = async () => {
    if (!form.username || !form.name) return;
    setSaving(true);
    const isDoctor = form.subRole === 'doctor';

    let savedUserId: string | null = null;

    if (adding) {
      const newUser = await addUser({
        username: form.username!,
        name: form.name!,
        role: 'colleague',
        subRole: form.subRole || 'reception',
        isReferrer: true,
        isPerformer: isDoctor,
        specialty: form.specialty,
        active: true,
      });
      savedUserId = newUser?.id ?? null;
    } else if (editing) {
      await updateUser({
        ...editing,
        username: form.username!,
        name: form.name!,
        subRole: form.subRole || editing.subRole,
        isReferrer: true,
        isPerformer: form.subRole === 'doctor',
        specialty: form.specialty,
      } as User);
      savedUserId = editing.id;
    }

    // Save shares
    if (savedUserId) {
      for (const draft of shareDrafts) {
        const refPct = parseFloat(draft.referrerPct);
        if (!isNaN(refPct) && refPct >= 0) {
          await upsertShare({ userId: savedUserId, serviceId: draft.serviceId, shareType: 'referrer', percentage: refPct });
        }
        if (isDoctor) {
          const perfPct = parseFloat(draft.performerPct);
          if (!isNaN(perfPct) && perfPct >= 0) {
            await upsertShare({ userId: savedUserId, serviceId: draft.serviceId, shareType: 'performer', percentage: perfPct });
          }
        }
      }
    }

    await refresh();
    setSaving(false);
    cancel();
  };

  const toggleActive = async (u: User) => {
    await updateUser({ ...u, active: !u.active });
    await refresh();
  };

  const updateDraft = (serviceId: string, field: 'referrerPct' | 'performerPct', value: string) => {
    setShareDrafts(prev => prev.map(d => d.serviceId === serviceId ? { ...d, [field]: value } : d));
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  const isDoctor = form.subRole === 'doctor';

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800">کاربران</h2>
          <p className="text-xs text-slate-400">{users.length} نفر ثبت‌شده</p>
        </div>
        <button onClick={startAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
          <Plus size={15} /> افزودن کاربر
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-[#0d1b2a] rounded-2xl p-5 mb-5 border border-cyan-400/20">
          <h3 className="font-semibold text-cyan-400 mb-4 text-sm">{adding ? 'کاربر جدید' : 'ویرایش کاربر'}</h3>
          <div className="space-y-4">

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">نام کاربری</label>
                <input value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  className="w-full border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
                  dir="ltr" placeholder="username" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">نام کامل</label>
                <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
                  placeholder="نام و نام خانوادگی" />
              </div>
            </div>

            {/* Sub role */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-2">نوع کاربر</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { val: 'doctor', label: 'پزشک', desc: 'دسترسی کامل، می‌تواند انجام‌دهنده باشد', icon: Stethoscope },
                  { val: 'reception', label: 'پذیرش', desc: 'فقط ثبت ارجاع', icon: Users },
                ] as const).map(opt => {
                  const Icon = opt.icon;
                  const selected = form.subRole === opt.val;
                  return (
                    <button key={opt.val}
                      onClick={() => setForm(p => ({ ...p, subRole: opt.val, isPerformer: opt.val === 'doctor' }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-right transition-all ${
                        selected ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:bg-white/8'
                      }`}>
                      <Icon size={14} className={selected ? 'text-cyan-400' : 'text-white/40'} />
                      <div>
                        <p className={`text-xs font-semibold ${selected ? 'text-cyan-400' : 'text-white/70'}`}>{opt.label}</p>
                        <p className="text-[9px] text-white/30 leading-tight">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specialty (doctor only) */}
            {isDoctor && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">تخصص (اختیاری)</label>
                <input value={form.specialty || ''} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                  className="w-full border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
                  placeholder="مثال: جراح ارتوپد" />
              </div>
            )}

            {/* Service shares */}
            <div>
              <button
                type="button"
                onClick={() => setShowShares(!showShares)}
                className="flex items-center gap-2 text-cyan-400/80 hover:text-cyan-400 text-xs font-semibold transition-colors mb-2"
              >
                {showShares ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                تنظیم سهم از خدمات
                <span className="text-white/30 font-normal">(اختیاری)</span>
              </button>

              {showShares && (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="grid text-[10px] text-slate-400 px-3 py-2 border-b border-white/10"
                    style={{ gridTemplateColumns: isDoctor ? '1fr 100px 100px' : '1fr 100px' }}>
                    <span>خدمت</span>
                    <span className="text-center">سهم ارجاع ٪</span>
                    {isDoctor && <span className="text-center">سهم انجام ٪</span>}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                    {services.map(svc => {
                      const draft = shareDrafts.find(d => d.serviceId === svc.id);
                      if (!draft) return null;
                      return (
                        <div key={svc.id}
                          className="grid items-center px-3 py-2"
                          style={{ gridTemplateColumns: isDoctor ? '1fr 100px 100px' : '1fr 100px' }}>
                          <span className="text-xs text-white/80">{svc.name}</span>
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number" min="0" max="100"
                              value={draft.referrerPct}
                              onChange={e => updateDraft(svc.id, 'referrerPct', e.target.value)}
                              className="w-16 border border-white/20 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-cyan-400"
                              placeholder="0"
                              dir="ltr"
                            />
                          </div>
                          {isDoctor && (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number" min="0" max="100"
                                value={draft.performerPct}
                                onChange={e => updateDraft(svc.id, 'performerPct', e.target.value)}
                                className="w-16 border border-white/20 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-cyan-400"
                                placeholder="0"
                                dir="ltr"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving || !form.username || !form.name}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} ذخیره
              </button>
              <button onClick={cancel}
                className="flex items-center gap-1.5 border border-white/15 text-white/60 px-5 py-2.5 rounded-xl text-sm hover:bg-white/5">
                <X size={13} /> انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {users.map(u => {
          const myShareCount = shares.filter(s => s.userId === u.id).length;
          return (
            <div key={u.id} className={`bg-white rounded-2xl border p-4 ${u.active ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  u.subRole === 'doctor' ? 'bg-cyan-50' : 'bg-slate-50'
                }`}>
                  {u.subRole === 'doctor'
                    ? <Stethoscope size={20} className="text-cyan-600" />
                    : <Users size={20} className="text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                      u.subRole === 'doctor' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.subRole === 'doctor' ? 'پزشک' : 'پذیرش'}
                    </span>
                    {!u.active && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">غیرفعال</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{u.username}</span>
                    {u.specialty && <span className="text-[10px] text-slate-400">{u.specialty}</span>}
                    {myShareCount > 0 && (
                      <span className="text-[10px] text-cyan-600">{myShareCount} سهم تنظیم‌شده</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => startEdit(u)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => toggleActive(u)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      u.active ? 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                    {u.active ? <UserX size={13} /> : <UserCheck size={13} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
