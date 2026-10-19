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
  /** Cuándo vio el tour del panel (null = aún no: se abre solo). */
  tourSeenAt: string | null;
  /** Límites vigentes del plan (durante la prueba, todo habilitado). */
  planLimits: PlanLimits | null;
}

export type PlanFeature = "clinical" | "billing" | "reports";

export interface PlanLimits {
  /** null = sin límite. */
  maxDoctors: number | null;
  /** Usuarios de recepción y asistentes. */
  supportStaff: boolean;
  features: Record<PlanFeature, boolean>;
}

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  source: "PANEL" | "ONLINE";
  notes: string | null;
  /** Cuándo se envió el recordatorio por correo al paciente. */
  reminderSentAt: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    medicalHistory?: MedicalAlerts | null;
    /** Saldo pendiente (solo para quienes manejan cobros y si debe algo). */
    balance?: string;
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
  whatsapp: string | null;
  primaryColor: string;
  /** La cita o el paciente registrado más reciente. */
  lastActivityAt: string | null;
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
  /** Saldo pendiente; no llega para los asistentes. */
  balance?: string;
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
  emailReminders: boolean;
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

// ─── Presupuestos y caja ───
// Los montos llegan como texto (Decimal), por ejemplo "35" o "97.85".

export type BudgetStatus = "DRAFT" | "APPROVED" | "REJECTED" | "CANCELLED";
export type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "OTHER";

export interface BudgetItem {
  id: string;
  treatmentId: string | null;
  description: string;
  tooth: string | null;
  quantity: number;
  unitPrice: string;
  discountPercent: string;
  total: string;
  position: number;
  completedAt: string | null;
}

export interface Budget {
  id: string;
  patientId: string;
  number: number;
  status: BudgetStatus;
  discountPercent: string;
  subtotal: string;
  total: string;
  notes: string | null;
  validUntil: string | null;
  approvedAt: string | null;
  createdAt: string;
  createdBy: { id: string; fullName: string };
  items: BudgetItem[];
  paid: string;
  balance: string;
}

export interface BudgetDetail extends Budget {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    idType: IdType;
    idNumber: string;
    phone: string | null;
    email: string | null;
  };
  clinic: {
    name: string;
    ruc: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    primaryColor: string;
    timezone: string;
  };
}

export interface Payment {
  id: string;
  /** Nº de recibo. */
  number: number;
  patientId: string;
  budgetId: string | null;
  amount: string;
  method: PaymentMethod;
  reference: string | null;
  concept: string | null;
  paidAt: string;
  voidedAt: string | null;
  voidReason: string | null;
  receivedBy: { id: string; fullName: string };
  voidedBy: { id: string; fullName: string } | null;
  budget: { id: string; number: number } | null;
  patient: { id: string; firstName: string; lastName: string };
}

export interface PatientAccount {
  budgets: Budget[];
  payments: Payment[];
  summary: { charged: string; paid: string; balance: string };
}

export interface CashReport {
  items: Payment[];
  summary: { total: string; count: number; voided: number; byMethod: Record<PaymentMethod, string> };
}

export interface PaymentReceipt extends Omit<Payment, "budget" | "patient"> {
  budget: { id: string; number: number; total: string } | null;
  patient: BudgetDetail["patient"];
  clinic: BudgetDetail["clinic"];
  /** Saldo del presupuesto justo después de este pago (null en pagos sueltos). */
  balanceAfter: string | null;
}

// ─── Reportes ───

export interface ReportSummary {
  range: {
    from: string;
    to: string;
    granularity: "day" | "week" | "month";
    previous: { from: string; to: string };
  };
  income: {
    total: string;
    count: number;
    previous: string;
    byMethod: Record<PaymentMethod, string>;
    series: { bucket: string; amount: string }[];
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    noShow: number;
    cancelled: number;
    online: number;
    previousCompleted: number;
    noShowRate: number | null;
    previousNoShowRate: number | null;
  };
  patients: { new: number; previous: number };
  treatments: { id: string; name: string; count: number }[];
  doctors: {
    id: string;
    fullName: string;
    color: string;
    total: number;
    completed: number;
    noShow: number;
    cancelled: number;
  }[];
  budgets: { approvedCount: number; approvedTotal: string; acceptanceRate: number | null };
  receivable: string;
}

/** Ficha de una clínica para el super-admin (GET /admin/clinics/:id). */
export interface AdminClinicDetail {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  primaryColor: string;
  timezone: string;
  status: ClinicStatus;
  plan: "BASIC" | "PRO" | "CLINIC";
  trialEndsAt: string | null;
  createdAt: string;
  owners: { id: string; fullName: string; email: string; isActive: boolean }[];
  _count: { patients: number; appointments: number; doctors: number; users: number; treatments: number };
  appointmentsThisMonth: number;
  lastActivityAt: string | null;
}

/** Primeros pasos de una clínica nueva (cada uno se calcula con sus datos). */
export interface OnboardingStatus {
  dismissed: boolean;
  steps: {
    profile: boolean;
    treatments: boolean;
    doctors: boolean;
    schedules: boolean;
    shareLink: boolean;
    firstAppointment: boolean;
  };
}
