export type WindowStatus = "not_started" | "open" | "closed";

export type TrainingClass = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  description: string;
  registration_open: boolean;
  session_count: number;
  registrant_count: number;
  created_at: string;
};

export type CreateTrainingClassPayload = {
  name: string;
  slug: string;
  start_date: string;
  description?: string;
};

export type ClassSession = {
  id: string;
  label: string;
  session_date: string;
  session_start_at: string;
  checkin_window_minutes: number;
  checkin_closes_at: string;
  qr_token: string;
  present_count: number;
  window_status: WindowStatus;
};

export type CreateSessionPayload = {
  label: string;
  session_date: string;
  session_start_at: string;
  checkin_window_minutes: number;
};

export type Registrant = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  marketing_opt_in: boolean;
  registered_at: string;
  sessions_attended: number;
  attended_session_ids: string[];
};
