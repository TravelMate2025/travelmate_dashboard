import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";
import {
  AssignmentSubmission,
  AssignTutorPayload,
  ClassSession,
  ClassTutor,
  CreateQuestionsLinkSendPayload,
  CreateSessionPayload,
  CreateTrainingClassPayload,
  PaginatedResponse,
  QuestionsLinkSend,
  Registrant,
  TrainingClass,
} from "./types";

class AcademyService {
  getClasses() {
    return instance.get<PaginatedResponse<TrainingClass>>(env.api.academyAdminClasses);
  }

  createClass(payload: CreateTrainingClassPayload) {
    return instance.post<TrainingClass>(env.api.academyAdminClasses, payload);
  }

  getClass(slug: string) {
    return instance.get<TrainingClass>(`${env.api.academyAdminClasses}${slug}/`);
  }

  setRegistrationOpen(slug: string, registrationOpen: boolean) {
    return instance.patch<TrainingClass>(`${env.api.academyAdminClasses}${slug}/`, {
      registration_open: registrationOpen,
    });
  }

  deleteClass(slug: string) {
    return instance.delete<void>(`${env.api.academyAdminClasses}${slug}/`);
  }

  deleteSession(slug: string, sessionId: string) {
    return instance.delete<void>(`${env.api.academyAdminClasses}${slug}/sessions/${sessionId}/`);
  }

  getSessions(slug: string) {
    return instance.get<PaginatedResponse<ClassSession>>(
      `${env.api.academyAdminClasses}${slug}/sessions/`,
    );
  }

  createSession(slug: string, payload: CreateSessionPayload) {
    return instance.post<ClassSession>(
      `${env.api.academyAdminClasses}${slug}/sessions/`,
      payload,
    );
  }

  getRegistrants(slug: string) {
    return instance.get<PaginatedResponse<Registrant>>(
      `${env.api.academyAdminClasses}${slug}/registrants/`,
    );
  }

  deleteRegistrant(slug: string, enrollmentId: string) {
    return instance.delete<void>(
      `${env.api.academyAdminClasses}${slug}/registrants/${enrollmentId}/`,
    );
  }

  // Phase 17 -- tutor access, questions links, assignment submissions.

  getTutor(slug: string) {
    return instance.get<ClassTutor>(`${env.api.academyAdminClasses}${slug}/tutor/`);
  }

  assignTutor(slug: string, payload: AssignTutorPayload) {
    return instance.post<ClassTutor>(`${env.api.academyAdminClasses}${slug}/tutor/`, payload);
  }

  resendTutorLink(slug: string) {
    return instance.post<void>(`${env.api.academyAdminClasses}${slug}/tutor/resend/`);
  }

  revokeTutor(slug: string) {
    return instance.post<ClassTutor>(`${env.api.academyAdminClasses}${slug}/tutor/revoke/`);
  }

  getQuestionsLinkSends(slug: string) {
    return instance.get<PaginatedResponse<QuestionsLinkSend>>(
      `${env.api.academyAdminClasses}${slug}/questions-link-sends/`,
    );
  }

  createQuestionsLinkSend(slug: string, payload: CreateQuestionsLinkSendPayload) {
    return instance.post<QuestionsLinkSend>(
      `${env.api.academyAdminClasses}${slug}/questions-link-sends/`,
      payload,
    );
  }

  deleteQuestionsLinkSend(slug: string, sendId: string) {
    return instance.delete<void>(
      `${env.api.academyAdminClasses}${slug}/questions-link-sends/${sendId}/`,
    );
  }

  getSubmissions(slug: string, sendId: string, search?: string) {
    return instance.get<PaginatedResponse<AssignmentSubmission>>(
      `${env.api.academyAdminClasses}${slug}/questions-link-sends/${sendId}/submissions/`,
      { params: search ? { search } : undefined },
    );
  }
}

export default new AcademyService();
