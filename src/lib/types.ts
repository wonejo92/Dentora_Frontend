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
  patient: { id: string; firstName: string; lastName: string; phone: string | null };
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
