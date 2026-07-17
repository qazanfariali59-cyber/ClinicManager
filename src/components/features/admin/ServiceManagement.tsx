import { useState, useEffect } from 'react';
import { User, Service, UserServiceShare } from '@/types';
import { getUsers, addUser, updateUser, getServices, getShares, upsertShare, formatCurrency } from '@/lib/api';
import { Plus, Edit2, Check, X, UserCheck, UserX, Stethoscope, Users, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

type SubRole = 'doctor' | 'reception';

export default function ServiceManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [shares, setShares] = useState<UserServiceShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingShare, setEditingShare] = useState<{ userId: string; serviceId: string; type: 'referrer' | 'performer' } | null>(null);
  const [shareValue, setShareValue] = useState('');
  // New service
  const [addingService, setAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

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
    const share: UserServiceShare = { userId: editingShare.userId, serviceId: editingShare.serviceId, shareType: editingShare.type, percentage: pct };
    await upsertShare(share);
    const updated = shares.filter(s => !(s.userId === share.userId && s.serviceId === share.serviceId && s.shareType === share.shareType));
    setShares([...updated, share]);
    setEditingShare(null);
  };

  const saveNewService = async () => {
    if (!newServiceName.trim()) return;
    const svc = await addService(newServiceName.trim(), parseInt(newServicePrice) || 0);
    if (svc) { setServices(prev => [...prev, svc]); setNewServiceName(''); setNewServicePrice(''); setAddingService(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  const performers = users.filter(u => u.isPerformer);
  const referrers = users.filter(u => u.isReferrer);

  return (
    <div className="p-4" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">خدمات و سهم‌ها</h2>
          <p className="text-xs text-slate-400">{services.length} خدمت</p>
        </div>
        <button onClick={() => setAddingService(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
          <Plus size={13} /> خدمت جدید
        </button>
      </div>

      {addingService && (
        <div className="bg-[#0d1b2a] rounded-2xl p-4 mb-4 border border-cyan-400/20">
          <h3 className="font-semibold text-cyan-400 mb-3 text-sm">خدمت جدید</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">نام خدمت</label>
              <input value={newServiceName} onChange={e => setNewServiceName(e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                placeholder="نام خدمت" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">قیمت پایه (ریال)</label>
              <input type="number" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                placeholder="0" dir="ltr" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveNewService}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
              <Check size={13} /> ذخیره
            </button>
            <button onClick={() => setAddingService(false)}
              className="flex items-center gap-1.5 border border-white/15 text-white/60 px-4 py-2 rounded-xl text-xs hover:bg-white/5">
              <X size={13} /> انصراف
            </button>
          </div>
        </div>
      )}

      {/* Per-user shares panel */}
      <div className="mb-5">
        <p className="text-xs font-bold text-slate-600 mb-3">سهم هر همکار</p>
        <div className="space-y-2">
          {users.map(u => {
            const isExp = expandedUser === u.id;
            const myShares = shares.filter(s => s.userId === u.id);
            return (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button className="w-full flex items-center gap-3 px-4 py-3"
                  onClick={() => setExpandedUser(isExp ? null : u.id)}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${u.subRole === 'doctor' ? 'bg-cyan-50' : 'bg-slate-50'}`}>
                    {u.subRole === 'doctor' ? <Stethoscope size={15} className="text-cyan-600" /> : <Users size={15} className="text-slate-500" />}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{myShares.length} سهم تنظیم‌شده</p>
                  </div>
                  {isExp ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>

                {isExp && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                    <div className="space-y-2">
                      {services.map(svc => {
                        const refShare = getShare(u.id, svc.id, 'referrer');
                        const perfShare = getShare(u.id, svc.id, 'performer');
                        const isEditingRef = editingShare?.userId === u.id && editingShare.serviceId === svc.id && editingShare.type === 'referrer';
                        const isEditingPerf = editingShare?.userId === u.id && editingShare.serviceId === svc.id && editingShare.type === 'performer';
                        const showRefRow = u.isReferrer;
                        const showPerfRow = u.isPerformer;
                        if (!showRefRow && !showPerfRow) return null;

                        return (
                          <div key={svc.id} className="bg-white rounded-xl border border-slate-100 p-3">
                            <p className="text-xs font-semibold text-slate-700 mb-2">{svc.name}</p>
                            <div className="space-y-1.5">
                              {showRefRow && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 w-16 flex-shrink-0">ارجاع‌دهنده</span>
                                  {isEditingRef ? (
                                    <div className="flex items-center gap-1 flex-1">
                                      <input autoFocus type="number" value={shareValue} onChange={e => setShareValue(e.target.value)} min="0" max="100"
                                        className="w-16 border-2 border-cyan-400 rounded-lg px-2 py-1 text-xs text-center focus:outline-none" dir="ltr" />
                                      <span className="text-xs text-slate-500">٪</span>
                                      <button onClick={saveShare} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                                      <button onClick={() => setEditingShare(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setEditingShare({ userId: u.id, serviceId: svc.id, type: 'referrer' }); setShareValue(refShare ? String(refShare.percentage) : ''); }}
                                      className="flex items-center gap-1 text-xs hover:text-cyan-700 transition-colors">
                                      <span className={`font-bold ${refShare ? 'text-cyan-700' : 'text-slate-300'}`}>{refShare ? `${refShare.percentage}٪` : '—'}</span>
                                      <Edit2 size={10} className="text-slate-300" />
                                    </button>
                                  )}
                                </div>
                              )}
                              {showPerfRow && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 w-16 flex-shrink-0">انجام‌دهنده</span>
                                  {isEditingPerf ? (
                                    <div className="flex items-center gap-1 flex-1">
                                      <input autoFocus type="number" value={shareValue} onChange={e => setShareValue(e.target.value)} min="0" max="100"
                                        className="w-16 border-2 border-cyan-400 rounded-lg px-2 py-1 text-xs text-center focus:outline-none" dir="ltr" />
                                      <span className="text-xs text-slate-500">٪</span>
                                      <button onClick={saveShare} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                                      <button onClick={() => setEditingShare(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setEditingShare({ userId: u.id, serviceId: svc.id, type: 'performer' }); setShareValue(perfShare ? String(perfShare.percentage) : ''); }}
                                      className="flex items-center gap-1 text-xs hover:text-cyan-700 transition-colors">
                                      <span className={`font-bold ${perfShare ? 'text-teal-700' : 'text-slate-300'}`}>{perfShare ? `${perfShare.percentage}٪` : '—'}</span>
                                      <Edit2 size={10} className="text-slate-300" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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

async function addService(name: string, price: number) {
  const { addService: apiAdd } = await import('@/lib/api');
  return apiAdd(name, price);
}
