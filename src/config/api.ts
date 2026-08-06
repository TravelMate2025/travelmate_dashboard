import { resolveBackendApiBase } from "@/lib/backend-api";

const api = () => {
  // Single source of truth for the backend URL — see resolveBackendApiBase
  // in src/lib/backend-api.ts for the env var / trusted-host logic. Kept
  // here as its own import (rather than each call site importing directly)
  // so every endpoint below stays defined in one place, unchanged.
  const API_BASE = resolveBackendApiBase();

  return {
    auth: API_BASE + "/auth/",
    authToken: API_BASE + "/auth-token/",
    loginSuperuser: API_BASE + "/auth/admin/jwt/login-superuser/",
    refreshSuperuser: API_BASE + "/auth/admin/jwt/refresh-superuser/",
    jwtRefreshToken: API_BASE + "/auth/jwt/token/refresh/",
    jwtVerifyToken: API_BASE + "/auth/jwt/token/verify/",
    user: API_BASE + "/users",
    usersLogout: API_BASE + "/users/logout/",
    usersMetadatas: API_BASE + "/users/metadatas/",
    bookings: API_BASE + "/admin/bookings",
    faq: API_BASE + "/admin/faqs",
    faqCategories: API_BASE + "/admin/faqs/categories/",
    ticket: API_BASE + "/admin/tickets/",
    messae: API_BASE + "/admin/tickets/",
    admin: API_BASE + "/admin",
    chat: API_BASE + "/admin/chats/",
    chatAdmins: API_BASE + "/chat/admins/",
    chatMessages: API_BASE + "/chat/messages/",
    users: API_BASE + "/superuser/",
    privacypolicy: API_BASE + "/admin/privacy-policy/",
    termsofuse: API_BASE + "/admin/terms-of-use/",
    aboutus: API_BASE + "/admin/about-us/",
    partners: API_BASE + "/admin/partners/",
    partnercategories: API_BASE + "/admin/partner-categories/",
    dashboardactivities: API_BASE + "/admin/dashboard/activities/",
    dashboardoverview: API_BASE + "/admin/dashboard/overview/",
    dashboardrevenue: API_BASE + "/admin/dashboard/revenue/",
    dashboardmessages: API_BASE + "/admin/dashboard/messages/",
    superadmin: API_BASE + "/superadmin/",
    superadminPermissionsGroups: API_BASE + "/superadmin/permissions/groups/",
    superadminRoles: API_BASE + "/superadmin/roles/",
    roles: API_BASE + "/admin/me/",
    myRoles: API_BASE + "/admin/me/roles/",
    usercount: API_BASE + "/admin/dashboard/user-count/",
    dashboardbookings: API_BASE + "/admin/dashboard/stats/",
    reportBookingsBreakdown: API_BASE + "/admin/reports/bookings/breakdown/",
    reportBookingsCombined: API_BASE + "/admin/reports/bookings/combined/",
    reportExport: API_BASE + "/admin/reports/export/",
    reportSummary: API_BASE + "/admin/reports/summary/",
    cms: API_BASE + "/admin/commissions/",
    upload: API_BASE + "/upload/",
    notification: API_BASE + "/notifications/",
    notificationBulkDelete: API_BASE + "/notifications/bulk-delete/",
    notificationBulkMarkRead: API_BASE + "/notifications/bulk-mark-read/",
    notificationMarkAllRead: API_BASE + "/notifications/mark_all_read/",
    bookingAdminById: API_BASE + "/bookings/admin/booking/",
    bookingAdminList: API_BASE + "/bookings/admin/list/",
    bookingAdminMyBookings: API_BASE + "/bookings/admin/my-bookings/",
    bookingAdminProcessCancellation: API_BASE + "/bookings/admin/",
    bookingAdminRequestCancellation: API_BASE + "/bookings/admin/request-cancellation/",
    bookingAdminResync: API_BASE + "/bookings/admin/resync/",
    bookingAdminReconcileRefund: API_BASE + "/bookings/admin/reconcile-refund/",
    bookingMyList: API_BASE + "/bookings/my/",
    bookingMyById: API_BASE + "/bookings/my/",
    bookingMyAdvancedSearch: API_BASE + "/bookings/my/advanced-search/",
    bookingMySearchByReference: API_BASE + "/bookings/my/search/",
    bookingMySummary: API_BASE + "/bookings/my/summary/",
    hotelBookingDetailsById: API_BASE + "/hotels/",
  };
};

export default api;
