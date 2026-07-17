import { useState, useEffect } from 'react';
import { User } from '@/types';
import { addUser, updateUser, getUsers } from '@/lib/api';
import { Plus, Edit2, Check, X, UserCheck, UserX, Stethoscope, Users, Loader2 } from 'lucide-react';

type SubRole = 'doctor' | 'reception';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<User & { subRole: SubRole }>>({});

  useEffect(() => {
    getUsers().then(u => { setUsers(u.filter(x => x.role !== 'admin')); setLoading(false); });
  }, []);

  const refresh = () => getUsers().then(u => setUsers(u.filter(x => x.role !== 'admin')));

  const startAdd = () => {
    setForm({ role: 'colleague', subRole: 'doctor', isReferrer: true, isPerformer: true, active: true });
    setAdding(true);
    setEditing(null);
  };

  const startEdit = (u: User) => {
    setEditing(u);
    setForm({ ...u });
    setAdding(false);
  };

  const cancel = () => { setEditing(null); setAdding(false); setForm({}); };

  const save = async () => {
    if (!form.username || !form.name) return;
    setSaving(true);
    const isDoctor = form.subRole === 'doctor';
    if (adding) {
      await addUser({
        username: form.username!,
        name: form.name!,
        role: 'colleague',
        subRole: form.subRole || 'reception',
        isReferrer: true,
        isPerformer: isDoctor,
        specialty: form.specialty,
        active: true,
      });
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
    }
    await refresh();
    setSaving(false);
    cancel();
  };

  const toggleActive = async (u: User) => {
    await updateUser({ ...u, active: !u.active });
    await refresh();
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="p-4" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">کاربران</h2>
          <p className="text-xs text-slate-400">{users.length} نفر ثبت‌شده</p>
        </div>
        <button onClick={startAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
          <Plus size={15} /> افزودن
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-[#0d1b2a] rounded-2xl p-4 mb-4 border border-cyan-400/20">
          <h3 className="font-semibold text-cyan-400 mb-3 text-sm">{adding ? 'کاربر جدید' : 'ویرایش'}</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">نام کاربری</label>
                <input value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  dir="ltr" placeholder="username" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">نام کامل</label>
                <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  placeholder="نام و نام خانوادگی" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-2">سطح دسترسی</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'doctor', label: 'پزشک', desc: 'دسترسی کامل به پرونده بیمار', icon: Stethoscope },
                  { val: 'reception', label: 'پذیرش', desc: 'فقط ثبت ارجاع', icon: Users },
                ].map(opt => {
                  const Icon = opt.icon;
                  const selected = form.subRole === opt.val;
                  return (
                    <button key={opt.val} onClick={() => setForm(p => ({ ...p, subRole: opt.val as SubRole }))}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-all ${
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

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">تخصص (اختیاری)</label>
              <input value={form.specialty || ''} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                placeholder="مثال: جراح ارتوپد" />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />} ذخیره
              </button>
              <button onClick={cancel} className="flex items-center gap-1.5 border border-white/15 text-white/60 px-4 py-2 rounded-xl text-xs hover:bg-white/5">
                <X size={13} /> انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className={`bg-white rounded-2xl border p-3 ${u.active ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                u.subRole === 'doctor' ? 'bg-cyan-50' : 'bg-slate-50'
              }`}>
                {u.subRole === 'doctor'
                  ? <Stethoscope size={18} className="text-cyan-600" />
                  : <Users size={18} className="text-slate-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    u.subRole === 'doctor' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.subRole === 'doctor' ? 'پزشک' : 'پذیرش'}
                  </span>
                  {!u.active && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">غیرفعال</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{u.username}</span>
                  {u.specialty && <span className="text-[10px] text-slate-400">· {u.specialty}</span>}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => startEdit(u)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                  <Edit2 size={12} />
                </button>
                <button onClick={() => toggleActive(u)} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                  u.active ? 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600' : 'bg-green-50 text-green-600'
                }`}>
                  {u.active ? <UserX size={12} /> : <UserCheck size={12} />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
