export type Role =
  | "SUPER_ADMIN"
  | "OWNER"
  | "DOCTOR"
  | "RECEPTIONIST"
  | "ASSISTANT";

export type ClinicStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface Me {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  clinic: {
    id: string;
    name: string;
    slug: string;
    status: ClinicStatus;
    plan: "BASIC" | "PRO" | "CLINIC";
    trialEndsAt: string | null;
    timezone: string;
    logoUrl: string | null;
    primaryColor: string;
  } | null;
  doctor: { id: string } | null;
}

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  source: "PANEL" | "ONLINE";
  notes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    medicalHistory?: MedicalAlerts | null;
  };
  doctor: { id: string; fullName: string; color: string };
  treatment: { id: string; name: string; durationMin: number };
}

export interface AdminClinic {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  email: string | null;
  phone: string | null;
  status: ClinicStatus;
  plan: string;
  trialEndsAt: string | null;
  createdAt: string;
  _count: { patients: number; appointments: number; doctors: number; users: number };
}

export interface DashboardSummary {
  today: string;
  month: {
    count: number;
    previousCount: number;
    changePct: number | null;
    onlinePct: number;
  };
  todayCount: number;
  pendingUpcoming: number;
  weekly: { weekStart: string; count: number }[];
  weeklyAverage: number;
  nextAppointment: Appointment | null;
  todayAppointments: Appointment[];
}

export type IdType = "CEDULA" | "RUC" | "PASAPORTE";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Patient {
  id: string;
  idType: IdType;
  idNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: Gender | null;
  address: string | null;
  notes: string | null;
  dataConsentAt: string | null;
  createdAt: string;
  /** Alertas médicas: las ve todo el personal. */
  medicalHistory?: MedicalAlerts | null;
}

export interface PatientDetail extends Patient {
  appointments: Appointment[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Treatment {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  /** Decimal serializado como texto, por ejemplo "35" o "35.5". */
  price: string | null;
  isPublic: boolean;
  isActive: boolean;
  doctors: { id: string; fullName: string }[];
}

export interface DoctorOption {
  id: string;
  fullName: string;
  specialty: string | null;
  color: string;
  isActive: boolean;
}

export interface ScheduleBlock {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface Doctor extends DoctorOption {
  bio: string | null;
  photoUrl: string | null;
  userId: string | null;
  user: { id: string; email: string } | null;
  treatments: { id: string; name: string; durationMin: number }[];
  schedules: ScheduleBlock[];
}

export interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  doctor: { id: string } | null;
}

export interface DoctorSlots {
  doctor: { id: string; fullName: string };
  durationMin: number;
  slots: { startsAt: string; endsAt: string }[];
}

/** Datos para el formulario de nueva cita. */
export interface BookingOptions {
  treatments: Treatment[];
  doctors: DoctorOption[];
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  ruc: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  primaryColor: string;
  description: string | null;
  timezone: string;
  status: ClinicStatus;
  plan: "BASIC" | "PRO" | "CLINIC";
  trialEndsAt: string | null;
  slotStepMin: number;
  minBookingNoticeMin: number;
  maxBookingDaysAhead: number;
  autoConfirmOnline: boolean;
}

export interface TimeOff {
  id: string;
  doctorId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  doctor: { id: string; fullName: string; color: string } | null;
}

/** Datos de la web pública de una clínica (GET /public/clinics/:slug). */
export interface PublicClinic {
  clinic: {
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    primaryColor: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    timezone: string;
  };
  doctors: { id: string; fullName: string; specialty: string | null; bio: string | null; photoUrl: string | null }[];
  treatments: {
    id: string;
    name: string;
    description: string | null;
    durationMin: number;
    price: string | null;
    doctorIds: string[];
    /** El tratamiento con más reservas en los últimos 90 días. */
    popular: boolean;
  }[];
}

export interface PublicBooking {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  doctor: string;
  treatment: string;
}

export interface NextAvailable {
  doctorId: string;
  startsAt: string;
}

// ─── Historia clínica ───

export interface MedicalAlerts {
  allergies: string[];
  /** Claves de `CONDITIONS` (lib/clinical.ts). */
  conditions: string[];
}

export interface MedicalHistory extends MedicalAlerts {
  id: string;
  answers: Record<string, string>;
  updatedAt: string;
  updatedBy: { id: string; fullName: string } | null;
}

export interface Diagnosis {
  code: string;
  label: string;
  comment?: string;
}

export interface Vitals {
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
}

export interface ClinicalNote {
  id: string;
  appointmentId: string | null;
  authorId: string;
  reason: string | null;
  findings: string | null;
  diagnoses: Diagnosis[];
  procedure: string | null;
  indications: string | null;
  prescription: string | null;
  vitals: Vitals | null;
  createdAt: string;
  updatedAt: string;
  /** Después de esta fecha la evolución solo admite aclaraciones. */
  editableUntil: string;
  author: { id: string; fullName: string };
  appointment: {
    id: string;
    startsAt: string;
    treatment: { name: string };
    doctor: { fullName: string };
  } | null;
  addenda: { id: string; text: string; createdAt: string; author: { id: string; fullName: string } }[];
}
