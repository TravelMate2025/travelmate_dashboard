import axios from "axios";

// Deliberately NOT the shared `instance` from useAxiosDefaults -- that
// attaches an admin Bearer token (read from localStorage) and force-
// redirects to /auth/login on any 401. The tutor has no admin account
// at all, so neither behavior applies here; using the authenticated
// client would be both meaningless (no token to attach) and unsafe
// (any stray 401 would boot the tutor off their own portal).
//
// Routed through the existing generic /api/proxy/[...path] route
// (same-origin) rather than calling the Django API directly, so this
// needs no new CORS allowance and no client-side knowledge of which
// backend host is live -- the proxy already resolves that.
const tutorApi = axios.create({
  baseURL: "/api/proxy/v1/public/academy/tutor",
});

export type TutorPortal = {
  training_class_name: string;
  tutor_full_name: string;
};

export type TutorClassSession = {
  id: string;
  label: string;
  session_date: string;
  session_start_at: string;
  checkin_window_minutes: number;
  checkin_closes_at: string;
  present_count: number;
  window_status: "not_started" | "open" | "closed";
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
  deadline_at: string | null;
  is_past_deadline: boolean;
  created_at: string;
};

export type CreateQuestionsLinkSendPayload = {
  title?: string;
  questions_url: string;
  session_id?: string | null;
  require_attendance?: boolean;
  deadline_at?: string | null;
};

export type AssignmentSubmission = {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  assignment_link: string;
  updated_at: string;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export const getTutorPortal = (token: string) =>
  tutorApi.get<TutorPortal>(`/${token}/`).then((r) => r.data);

export const getTutorSessions = (token: string) =>
  tutorApi
    .get<PaginatedResponse<TutorClassSession>>(`/${token}/sessions/`)
    .then((r) => r.data.results);

export const getTutorSends = (token: string) =>
  tutorApi
    .get<PaginatedResponse<QuestionsLinkSend>>(`/${token}/questions-link-sends/`)
    .then((r) => r.data.results);

export const createTutorSend = (token: string, payload: CreateQuestionsLinkSendPayload) =>
  tutorApi
    .post<QuestionsLinkSend>(`/${token}/questions-link-sends/`, payload)
    .then((r) => r.data);

export const getTutorSubmissions = (token: string, sendId: string) =>
  tutorApi
    .get<PaginatedResponse<AssignmentSubmission>>(
      `/${token}/questions-link-sends/${sendId}/submissions/`,
    )
    .then((r) => r.data.results);
