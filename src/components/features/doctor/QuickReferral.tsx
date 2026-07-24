import { useState } from 'react';
import { User, Patient } from '@/types';
import { getPatientByNationalId, addPatient, addReferral } from '@/lib/api';
import { Search, CheckCircle, UserPlus, Loader2, AlertCircle } from 'lucide-react';

interface QuickReferralProps {
  currentUser: User;
}

export default function QuickReferral({ currentUser }: QuickReferralProps) {
  const [nationalId, setNationalId] = useState('');
  const [found, setFound] = useState<Patient | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const search = async () => {
    if (!nationalId.trim() || nationalId.length < 10) return;
    setSearching(true);
    setFound(null);
    setNotFound(false);
    setSuccess(false);
    const p = await getPatientByNationalId(nationalId.trim());
    setSearching(false);
    if (p) {
      setFound(p);
    } else {
      setNotFound(true);
    }
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
    setNationalId('');
    setFound(null);
    setNotFound(false);
  };

  const addAndRegister = async () => {
    if (!nationalId.trim()) return;
    setSaving(true);
    // Register patient with national ID only, auto-generate a placeholder name
    const newPatient = await addPatient({
      nationalId: nationalId.trim(),
      name: `بیمار ${nationalId.trim()}`,
      createdAt: new Date().toISOString().split('T')[0],
    });
    if (newPatient) await registerReferral(newPatient);
    setSaving(false);
  };

  const reset = () => {
    setNationalId('');
    setFound(null);
    setNotFound(false);
    setSuccess(false);
  };

  return (
    <div dir="rtl">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-800">ثبت ارجاع سریع</h2>
        <p className="text-xs text-slate-400 mt-0.5">کد ملی بیمار را وارد کنید</p>
      </div>

      {success && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-5">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-semibold">ارجاع با موفقیت ثبت شد</p>
          </div>
          <button onClick={reset} className="text-green-600 text-xs underline">ارجاع جدید</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex gap-2 mb-5">
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
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            جستجو
          </button>
        </div>

        {/* Patient found */}
        {found && (
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
            <p className="text-[11px] text-cyan-600 font-semibold mb-2">بیمار در سیستم یافت شد</p>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-slate-800 text-base">{found.name}</p>
                <p className="text-xs text-slate-500 mt-0.5" dir="ltr">{found.nationalId}</p>
                {found.phone && <p className="text-xs text-slate-400" dir="ltr">{found.phone}</p>}
              </div>
            </div>
            <button onClick={() => registerReferral(found)} disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              ثبت ارجاع
            </button>
          </div>
        )}

        {/* Patient not found */}
        {notFound && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-700">بیمار با این کد ملی در سیستم نیست</p>
            </div>
            <p className="text-xs text-amber-600/80 mb-4">با ثبت ارجاع، بیمار جدید با این کد ملی ایجاد می‌شود.</p>
            <button onClick={addAndRegister} disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              ثبت بیمار جدید و ارجاع
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
