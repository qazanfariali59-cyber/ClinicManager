import { useState, useEffect } from 'react';
import { User, Patient, Service, Appointment } from '@/types';
import { getPatients, getServices, getUsers, getAppointments, addAppointment } from '@/lib/api';
import { CalendarDays, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface AppointmentFormProps {
  currentUser: User;
}

export default function AppointmentForm({ currentUser }: AppointmentFormProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [performers, setPerformers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patientId: '', doctorId: '', serviceId: '', date: '', time: '' });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([getPatients(), getServices(), getUsers(), getAppointments()]).then(([p, s, u, a]) => {
      setPatients(p);
      setServices(s);
      setPerformers(u.filter(x => x.isPerformer));
      setAppointments(a);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!form.patientId || !form.doctorId || !form.serviceId || !form.date || !form.time) return;
    setSaving(true);
    await addAppointment({
      patientId: form.patientId,
      doctorId: form.doctorId,
      serviceId: form.serviceId,
      date: form.date,
      time: form.time,
      createdBy: currentUser.id,
    });
    const updated = await getAppointments();
    setAppointments(updated);
    setForm({ patientId: '', doctorId: '', serviceId: '', date: '', time: '' });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-cyan-500" /></div>;

  const isValid = form.patientId && form.doctorId && form.serviceId && form.date && form.time;

  return (
    <div className="p-4" dir="rtl">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800">ثبت نوبت</h2>
        <p className="text-xs text-slate-400">پرسنل به جای بیمار ثبت می‌کند</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">نوبت ثبت شد</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">بیمار</label>
            <select value={form.patientId} onChange={e => setForm(p => ({ ...p, patientId: e.target.value }))}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors">
              <option value="">— انتخاب بیمار —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">پزشک / درمانگر</label>
            <select value={form.doctorId} onChange={e => setForm(p => ({ ...p, doctorId: e.target.value }))}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors">
              <option value="">— انتخاب پزشک —</option>
              {performers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">نوع خدمت</label>
            <select value={form.serviceId} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors">
              <option value="">— انتخاب خدمت —</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاریخ</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">ساعت</label>
              <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors" dir="ltr" />
            </div>
          </div>
          <button onClick={save} disabled={!isValid || saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #00e8d6, #00b8aa)', color: '#0d1b2a' }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />}
            ثبت نوبت
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-600 mb-3">نوبت‌های اخیر</p>
        <div className="space-y-2">
          {appointments.slice(0, 5).map(a => {
            const patient = patients.find(p => p.id === a.patientId);
            const doctor = performers.find(u => u.id === a.doctorId);
            const service = services.find(s => s.id === a.serviceId);
            return (
              <div key={a.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #e0faf8, #b2f0ea)', color: '#00b8aa' }}>
                  <Clock size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{patient?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{doctor?.name} · {service?.name}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="text-xs font-medium text-cyan-700" dir="ltr">{a.time}</p>
                  <p className="text-[10px] text-slate-400">{a.date}</p>
                </div>
              </div>
            );
          })}
          {appointments.length === 0 && <p className="text-sm text-slate-400 text-center py-6">نوبتی ثبت نشده</p>}
        </div>
      </div>
    </div>
  );
}
