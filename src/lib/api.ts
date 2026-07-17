import { supabase } from '@/lib/supabase';
import { User, Service, UserServiceShare, Patient, Referral, Appointment } from '@/types';

// ─── Users ────────────────────────────────────────────────────────────────────

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    username: row.username as string,
    name: row.name as string,
    role: row.role as 'admin' | 'colleague',
    subRole: row.sub_role as 'doctor' | 'reception' | undefined,
    isReferrer: row.is_referrer as boolean,
    isPerformer: row.is_performer as boolean,
    specialty: row.specialty as string | undefined,
    active: row.active as boolean,
  };
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('clinic_users').select('*').order('created_at');
  if (error) { console.error('getUsers:', error); return []; }
  return (data || []).map(mapUser);
}

export async function addUser(user: Omit<User, 'id'>): Promise<User | null> {
  const { data, error } = await supabase.from('clinic_users').insert({
    username: user.username,
    name: user.name,
    role: user.role,
    sub_role: user.subRole,
    is_referrer: user.isReferrer,
    is_performer: user.isPerformer,
    specialty: user.specialty,
    active: user.active,
  }).select().single();
  if (error) { console.error('addUser:', error); return null; }
  return mapUser(data);
}

export async function updateUser(user: User): Promise<boolean> {
  const { error } = await supabase.from('clinic_users').update({
    username: user.username,
    name: user.name,
    role: user.role,
    sub_role: user.subRole,
    is_referrer: user.isReferrer,
    is_performer: user.isPerformer,
    specialty: user.specialty,
    active: user.active,
  }).eq('id', user.id);
  if (error) { console.error('updateUser:', error); return false; }
  return true;
}

// ─── Services ─────────────────────────────────────────────────────────────────

function mapService(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    name: row.name as string,
    basePrice: row.base_price as number,
    active: row.active as boolean,
  };
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select('*').order('created_at');
  if (error) { console.error('getServices:', error); return []; }
  return (data || []).map(mapService);
}

export async function addService(name: string, basePrice: number): Promise<Service | null> {
  const { data, error } = await supabase.from('services').insert({ name, base_price: basePrice, active: true }).select().single();
  if (error) { console.error('addService:', error); return null; }
  return mapService(data);
}

export async function updateService(service: Service): Promise<boolean> {
  const { error } = await supabase.from('services').update({ name: service.name, base_price: service.basePrice, active: service.active }).eq('id', service.id);
  if (error) { console.error('updateService:', error); return false; }
  return true;
}

// ─── User Service Shares ──────────────────────────────────────────────────────

function mapShare(row: Record<string, unknown>): UserServiceShare {
  return {
    userId: row.user_id as string,
    serviceId: row.service_id as string,
    shareType: row.share_type as 'referrer' | 'performer',
    percentage: row.percentage as number,
  };
}

export async function getShares(): Promise<UserServiceShare[]> {
  const { data, error } = await supabase.from('user_service_shares').select('*');
  if (error) { console.error('getShares:', error); return []; }
  return (data || []).map(mapShare);
}

export async function getSharesForUser(userId: string): Promise<UserServiceShare[]> {
  const { data, error } = await supabase.from('user_service_shares').select('*').eq('user_id', userId);
  if (error) { console.error('getSharesForUser:', error); return []; }
  return (data || []).map(mapShare);
}

export async function upsertShare(share: UserServiceShare): Promise<boolean> {
  const { error } = await supabase.from('user_service_shares').upsert({
    user_id: share.userId,
    service_id: share.serviceId,
    share_type: share.shareType,
    percentage: share.percentage,
  }, { onConflict: 'user_id,service_id,share_type' });
  if (error) { console.error('upsertShare:', error); return false; }
  return true;
}

// ─── Patients ─────────────────────────────────────────────────────────────────

function mapPatient(row: Record<string, unknown>): Patient {
  return {
    id: row.id as string,
    nationalId: row.national_id as string,
    name: row.name as string,
    phone: row.phone as string | undefined,
    birthYear: row.birth_year as number | undefined,
    createdAt: row.created_at as string,
  };
}

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getPatients:', error); return []; }
  return (data || []).map(mapPatient);
}

export async function getPatientByNationalId(nid: string): Promise<Patient | null> {
  const { data, error } = await supabase.from('patients').select('*').eq('national_id', nid).maybeSingle();
  if (error) { console.error('getPatientByNationalId:', error); return null; }
  return data ? mapPatient(data) : null;
}

export async function addPatient(patient: Omit<Patient, 'id'>): Promise<Patient | null> {
  const { data, error } = await supabase.from('patients').insert({
    national_id: patient.nationalId,
    name: patient.name,
    phone: patient.phone,
    birth_year: patient.birthYear,
    created_at: new Date().toISOString().split('T')[0],
  }).select().single();
  if (error) { console.error('addPatient:', error); return null; }
  return mapPatient(data);
}

// ─── Referrals ────────────────────────────────────────────────────────────────

function mapReferral(row: Record<string, unknown>): Referral {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    referrerId: row.referrer_id as string,
    performerId: row.performer_id as string | undefined,
    serviceId: row.service_id as string | undefined,
    status: row.status as 'pending' | 'paid',
    totalAmount: row.total_amount as number | undefined,
    sessions: row.sessions as number,
    completedSessions: row.completed_sessions as number,
    date: row.date as string,
    paidDate: row.paid_date as string | undefined,
    notes: row.notes as string | undefined,
  };
}

export async function getReferrals(): Promise<Referral[]> {
  const { data, error } = await supabase.from('referrals').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getReferrals:', error); return []; }
  return (data || []).map(mapReferral);
}

export async function addReferral(referral: Omit<Referral, 'id'>): Promise<Referral | null> {
  const { data, error } = await supabase.from('referrals').insert({
    patient_id: referral.patientId,
    referrer_id: referral.referrerId,
    performer_id: referral.performerId,
    service_id: referral.serviceId,
    status: referral.status,
    total_amount: referral.totalAmount,
    sessions: referral.sessions,
    completed_sessions: referral.completedSessions,
    date: new Date().toISOString().split('T')[0],
    notes: referral.notes,
  }).select().single();
  if (error) { console.error('addReferral:', error); return null; }
  return mapReferral(data);
}

export async function updateReferral(referral: Referral): Promise<boolean> {
  const { error } = await supabase.from('referrals').update({
    performer_id: referral.performerId,
    service_id: referral.serviceId,
    status: referral.status,
    total_amount: referral.totalAmount,
    sessions: referral.sessions,
    completed_sessions: referral.completedSessions,
    paid_date: referral.paidDate,
    notes: referral.notes,
  }).eq('id', referral.id);
  if (error) { console.error('updateReferral:', error); return false; }
  return true;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

function mapAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    doctorId: row.doctor_id as string,
    serviceId: row.service_id as string,
    date: row.date as string,
    time: row.time as string,
    createdBy: row.created_by as string,
  };
}

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getAppointments:', error); return []; }
  return (data || []).map(mapAppointment);
}

export async function addAppointment(appt: Omit<Appointment, 'id'>): Promise<Appointment | null> {
  const { data, error } = await supabase.from('appointments').insert({
    patient_id: appt.patientId,
    doctor_id: appt.doctorId,
    service_id: appt.serviceId,
    date: appt.date,
    time: appt.time,
    created_by: appt.createdBy,
  }).select().single();
  if (error) { console.error('addAppointment:', error); return null; }
  return mapAppointment(data);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase.from('clinic_users').select('*').eq('username', username).eq('active', true).maybeSingle();
  if (error || !data) return null;
  return mapUser(data);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Calculate share amount for a user on a referral.
 * shareType: 'referrer' when the user referred, 'performer' when they performed.
 */
export function calcShareAmount(
  shares: UserServiceShare[],
  userId: string,
  serviceId: string,
  shareType: 'referrer' | 'performer',
  totalAmount: number
): number {
  const s = shares.find(sh => sh.userId === userId && sh.serviceId === serviceId && sh.shareType === shareType);
  if (!s || !totalAmount) return 0;
  return Math.round((totalAmount * s.percentage) / 100);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fa-IR') + ' ریال';
}
