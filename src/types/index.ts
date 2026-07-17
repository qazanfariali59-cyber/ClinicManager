export type UserRole = 'admin' | 'colleague';

// subRole determines access level for colleagues
// 'doctor'    → can see full patient files, treatment timeline, perform services
// 'reception' → referral only, no patient medical details
export type SubRole = 'doctor' | 'reception';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  subRole?: SubRole;
  isReferrer: boolean;
  isPerformer: boolean;
  specialty?: string;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  basePrice: number;
  active: boolean;
}

// shareType: 'referrer' = درصد سهم وقتی ارجاع می‌دهد
//            'performer' = درصد سهم وقتی درمان انجام می‌دهد
export interface UserServiceShare {
  userId: string;
  serviceId: string;
  shareType: 'referrer' | 'performer';
  percentage: number;
}

export interface Patient {
  id: string;
  nationalId: string;
  name: string;
  phone?: string;
  birthYear?: number;
  createdAt: string;
}

export type ReferralStatus = 'pending' | 'paid';

export interface Referral {
  id: string;
  patientId: string;
  referrerId: string;
  performerId?: string;
  serviceId?: string;
  status: ReferralStatus;
  totalAmount?: number;
  sessions: number;
  completedSessions: number;
  date: string;
  paidDate?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  date: string;
  time: string;
  createdBy: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
