import { useState, useEffect } from 'react';
import { User, Patient, Referral } from '@/types';
import { getPatientByNationalId, addPatient, addReferral, getPatients } from '@/lib/api';
import { Search, CheckCircle, UserPlus, Loader2 } from 'lucide-react';

interface QuickReferralProps {
  currentUser: User;
}

export default function QuickReferral({ currentUser }: QuickReferralProps) {
  const [nationalId, setNationalId] = useState('');
  const [found, setFound] = useState<Patient | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const search = async () => {
    if (!nationalId.trim() || nationalId.length < 10) return;
    setSearching(true);
    const p = await getPatientByNationalId(nationalId.trim());
    setSearching(false);
    if (p) { setFound(p); setNotFound(false); }
    else { setFound(null); setNotFound(true); }
    setSuccess(false);
  };

  const registerReferral = async (patient: Patient) => {
    setSaving(true);
    await addReferral({
      patientId: patient.id,
      referrerId: currentUser.id,
      status: 'pending',
      sessions: 0,
      completedSessions: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    setSuccess(true);
    setNationalId(''); setFound(null); setNotFound(false);
    setNewName(''); setNewPhone('');
  };

  const addAndRegister = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const newPatient = await addPatient({
      nationalId: nationalId.trim(),
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
    });
    if (newPatient) await registerReferral(newPatient);
    setSaving(false);
  };

  return (
    <div className="p-4" dir="rtl">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800">ثبت ارجاع سریع</h2>
        <p className="text-xs text-slate-400 mt-0.5">کد ملی بیمار را وارد کنید</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">ارجاع با موفقیت ثبت شد</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={nationalId}
            onChange={e => { setNationalId(e.target.value); setFound(null); setNotFound(false); setSuccess(false); }}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="کد ملی ۱۰ رقمی"
            maxLength={10}
            className="flex-1 border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            dir="ltr"
          />
          <button
            onClick={search}
            disabled={nationalId.length < 10 || searching}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>

        {found && (
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
            <p className="text-[11px] text-cyan-600 font-semibold mb-1">بیمار یافت شد</p>
            <p className="font-bold text-slate-800">{found.name}</p>
            <p className="text-xs text-slate-500 mt-0.5" dir="ltr">{found.nationalId}</p>
            {found.phone && <p className="text-xs text-slate-400" dir="ltr">{found.phone}</p>}
            <button onClick={() => registerReferral(found)} disabled={saving}
              className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              ثبت ارجاع
            </button>
          </div>
        )}

        {notFound && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus size={15} className="text-amber-600" />
              <p className="text-sm font-semibold text-amber-700">بیمار جدید</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-600 mb-1 block">نام و نام خانوادگی *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="نام کامل بیمار" />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 mb-1 block">شماره تماس</label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="۰۹۱۲..." dir="ltr" />
              </div>
              <button onClick={addAndRegister} disabled={!newName.trim() || saving}
                className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                ثبت بیمار جدید و ارجاع
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
