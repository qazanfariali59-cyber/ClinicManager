import { useState, useEffect } from 'react';
import { User, Service, UserServiceShare } from '@/types';
import { getUsers, getServices, getShares, upsertShare, addService, updateService } from '@/lib/api';
import { Plus, Edit2, Check, X, Stethoscope, Users, ChevronDown, ChevronUp, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ServiceManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [shares, setShares] = useState<UserServiceShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingShare, setEditingShare] = useState<{ userId: string; serviceId: string; type: 'referrer' | 'performer' } | null>(null);
  const [shareValue, setShareValue] = useState('');

  // Service editing
  const [addingService, setAddingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [svcForm, setSvcForm] = useState({ name: '', price: '' });

  useEffect(() => {
    Promise.all([getUsers(), getServices(), getShares()]).then(([u, s, sh]) => {
      setUsers(u.filter(x => x.role !== 'admin'));
      setServices(s);
      setShares(sh);
      setLoading(false);
    });
  }, []);

  const getShare = (userId: string, serviceId: string, type: 'referrer' | 'performer') =>
    shares.find(s => s.userId === userId && s.serviceId === serviceId && s.shareType === type);

  const saveShare = async () => {
    if (!editingShare) return;
    const pct = parseFloat(shareValue);
    if (isNaN(pct) || pct < 0 || pct > 100) return;
    const share: UserServiceShare = {
      userId: editingShare.userId,
      serviceId: editingShare.serviceId,
      shareType: editingShare.type,
      percentage: pct,
    };
    await upsertShare(share);
    const updated = shares.filter(s => !(s.userId === share.userId && s.serviceId === share.serviceId && s.shareType === share.shareType));
    setShares([...updated, share]);
    setEditingShare(null);
  };

  const saveNewService = async () => {
    if (!svcForm.name.trim()) return;
    const svc = await addService(svcForm.name.trim(), parseInt(svcForm.price) || 0);
    if (svc) {
      setServices(prev => [...prev, svc]);
      setSvcForm({ name: '', price: '' });
      setAddingService(false);
    }
  };

  const saveEditService = async () => {
    if (!editingService || !svcForm.name.trim()) return;
    const updated = { ...editingService, name: svcForm.name.trim(), basePrice: parseInt(svcForm.price) || 0 };
    await updateService(updated);
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditingService(null);
    setSvcForm({ name: '', price: '' });
  };

  const toggleServiceActive = async (svc: Service) => {
    const updated = { ...svc, active: !svc.active };
    await updateService(updated);
    setServices(prev => prev.map(s => s.id === svc.id ? updated : s));
  };

  const startEditService = (svc: Service) => {
    setEditingService(svc);
    setSvcForm({ name: svc.name, price: String(svc.basePrice) });
    setAddingService(false);
  };

  const startAddService = () => {
    setAddingService(true);
    setSvcForm({ name: '', price: '' });
    setEditingService(null);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  return (
    <div dir="rtl">
      {/* ── Services list ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">لیست خدمات</h2>
            <p className="text-xs text-slate-400">{services.length} خدمت ثبت‌شده</p>
          </div>
          <button onClick={startAddService}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
            <Plus size={14} /> خدمت جدید
          </button>
        </div>

        {/* Add/Edit service form */}
        {(addingService || editingService) && (
          <div className="bg-[#0d1b2a] rounded-2xl p-4 mb-4 border border-cyan-400/20">
            <h3 className="font-semibold text-cyan-400 mb-3 text-sm">
              {addingService ? 'خدمت جدید' : `ویرایش: ${editingService?.name}`}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">نام خدمت</label>
                <input value={svcForm.name} onChange={e => setSvcForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
                  placeholder="نام خدمت" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5">قیمت پایه (ریال)</label>
                <input type="number" value={svcForm.price} onChange={e => setSvcForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
                  placeholder="0" dir="ltr" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addingService ? saveNewService : saveEditService}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
                <Check size={13} /> ذخیره
              </button>
              <button onClick={() => { setAddingService(false); setEditingService(null); }}
                className="flex items-center gap-1.5 border border-white/15 text-white/60 px-4 py-2.5 rounded-xl text-sm hover:bg-white/5">
                <X size={13} /> انصراف
              </button>
            </div>
          </div>
        )}

        {/* Services table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="grid text-[11px] font-semibold text-slate-500 bg-slate-50 px-4 py-2.5 border-b border-slate-100"
            style={{ gridTemplateColumns: '1fr 130px 70px 80px' }}>
            <span>نام خدمت</span>
            <span className="text-center">قیمت پایه (ریال)</span>
            <span className="text-center">وضعیت</span>
            <span className="text-center">عملیات</span>
          </div>
          <div className="divide-y divide-slate-50">
            {services.map(svc => (
              <div key={svc.id}
                className="grid items-center px-4 py-3"
                style={{ gridTemplateColumns: '1fr 130px 70px 80px' }}>
                <span className={`text-sm font-medium ${svc.active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                  {svc.name}
                </span>
                <span className="text-sm text-center text-slate-600">
                  {svc.basePrice.toLocaleString('fa-IR')}
                </span>
                <div className="flex justify-center">
                  <button onClick={() => toggleServiceActive(svc)} className="transition-colors">
                    {svc.active
                      ? <ToggleRight size={22} className="text-cyan-500" />
                      : <ToggleLeft size={22} className="text-slate-300" />}
                  </button>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => startEditService(svc)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Per-user shares ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">سهم همکاران</h2>
        <p className="text-xs text-slate-400 mb-4">درصد سهم هر کاربر از هر خدمت (ارجاع‌دهنده / انجام‌دهنده)</p>
        <div className="space-y-2">
          {users.map(u => {
            const isExp = expandedUser === u.id;
            const myShares = shares.filter(s => s.userId === u.id);
            return (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button className="w-full flex items-center gap-3 px-4 py-3"
                  onClick={() => setExpandedUser(isExp ? null : u.id)}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${u.subRole === 'doctor' ? 'bg-cyan-50' : 'bg-slate-50'}`}>
                    {u.subRole === 'doctor' ? <Stethoscope size={16} className="text-cyan-600" /> : <Users size={16} className="text-slate-500" />}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{myShares.length} سهم تنظیم‌شده</p>
                  </div>
                  {isExp ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>

                {isExp && (
                  <div className="border-t border-slate-100 px-4 py-4 bg-slate-50">
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                      <div className={`grid text-[10px] font-semibold text-slate-500 bg-slate-50 px-3 py-2 border-b border-slate-100`}
                        style={{ gridTemplateColumns: u.subRole === 'doctor' ? '1fr 110px 110px' : '1fr 110px' }}>
                        <span>خدمت</span>
                        <span className="text-center">سهم ارجاع ٪</span>
                        {u.subRole === 'doctor' && <span className="text-center">سهم انجام ٪</span>}
                      </div>
                      <div className="divide-y divide-slate-50">
                        {services.map(svc => {
                          const refShare = getShare(u.id, svc.id, 'referrer');
                          const perfShare = getShare(u.id, svc.id, 'performer');
                          const isEditingRef = editingShare?.userId === u.id && editingShare.serviceId === svc.id && editingShare.type === 'referrer';
                          const isEditingPerf = editingShare?.userId === u.id && editingShare.serviceId === svc.id && editingShare.type === 'performer';

                          return (
                            <div key={svc.id}
                              className={`grid items-center px-3 py-2.5 ${!svc.active ? 'opacity-50' : ''}`}
                              style={{ gridTemplateColumns: u.subRole === 'doctor' ? '1fr 110px 110px' : '1fr 110px' }}>
                              <span className="text-xs text-slate-700">{svc.name}</span>

                              {/* Referrer share */}
                              <div className="flex justify-center">
                                {isEditingRef ? (
                                  <div className="flex items-center gap-1">
                                    <input autoFocus type="number" value={shareValue}
                                      onChange={e => setShareValue(e.target.value)} min="0" max="100"
                                      className="w-14 border-2 border-cyan-400 rounded-lg px-1.5 py-1 text-xs text-center focus:outline-none"
                                      dir="ltr" />
                                    <button onClick={saveShare} className="text-green-600 hover:text-green-700"><Check size={13} /></button>
                                    <button onClick={() => setEditingShare(null)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setEditingShare({ userId: u.id, serviceId: svc.id, type: 'referrer' }); setShareValue(refShare ? String(refShare.percentage) : ''); }}
                                    className="flex items-center gap-1 hover:text-cyan-700 transition-colors">
                                    <span className={`text-xs font-bold ${refShare ? 'text-cyan-700' : 'text-slate-300'}`}>
                                      {refShare ? `${refShare.percentage}٪` : '—'}
                                    </span>
                                    <Edit2 size={10} className="text-slate-300" />
                                  </button>
                                )}
                              </div>

                              {/* Performer share (doctor only) */}
                              {u.subRole === 'doctor' && (
                                <div className="flex justify-center">
                                  {isEditingPerf ? (
                                    <div className="flex items-center gap-1">
                                      <input autoFocus type="number" value={shareValue}
                                        onChange={e => setShareValue(e.target.value)} min="0" max="100"
                                        className="w-14 border-2 border-cyan-400 rounded-lg px-1.5 py-1 text-xs text-center focus:outline-none"
                                        dir="ltr" />
                                      <button onClick={saveShare} className="text-green-600 hover:text-green-700"><Check size={13} /></button>
                                      <button onClick={() => setEditingShare(null)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setEditingShare({ userId: u.id, serviceId: svc.id, type: 'performer' }); setShareValue(perfShare ? String(perfShare.percentage) : ''); }}
                                      className="flex items-center gap-1 hover:text-teal-700 transition-colors">
                                      <span className={`text-xs font-bold ${perfShare ? 'text-teal-700' : 'text-slate-300'}`}>
                                        {perfShare ? `${perfShare.percentage}٪` : '—'}
                                      </span>
                                      <Edit2 size={10} className="text-slate-300" />
                                    </button>
                                  )}
                                </div>
                              )}
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
    </div>
  );
}
