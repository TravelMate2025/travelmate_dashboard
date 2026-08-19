export type WindowStatus = "not_started" | "open" | "closed";

// The class/session/registrant admin list endpoints are paginated
// (DRF's PageNumberPagination shape) -- default page sizes are large
// enough that every realistic class/session/registrant count today
// still fits on page 1, but callers must read .results, not treat the
// response as the array directly.
export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

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

// Phase 17 -- tutor access, questions links, assignment submissions.

export type ClassTutor = {
  id: string;
  full_name: string;
  email: string;
  magic_token: string;
  revoked_at: string | null;
  created_at: string;
};

export type AssignTutorPayload = {
  full_name: string;
  email: string;
};

export type SentBy = "admin" | "tutor";

export type QuestionsLinkScope = "all" | "session" | "attended_any";

export type QuestionsLinkSend = {
  id: string;
  title: string;
  questions_url: string;
  share_token: string;
  sent_by: SentBy;
  session_id: string | null;
  session_label: string | null;
  scope: QuestionsLinkScope;
  submission_count: number;
  created_at: string;
};

export type CreateQuestionsLinkSendPayload = {
  title?: string;
  questions_url: string;
  session_id?: string | null;
  require_attendance?: boolean;
};

export type AssignmentSubmission = {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  assignment_link: string;
  updated_at: string;
};
