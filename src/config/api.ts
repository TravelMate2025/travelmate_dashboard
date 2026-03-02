const api = ({ inProduction }: { inProduction: boolean }) => {
  const BASE_URL_STAGING = "https://travelmate-backend-knvd.onrender.com/api";
  const BASE_URL_PROD = "https://travelmate-backend-1-1lgj.onrender.com/api";

  const BASE_URL_LINK = inProduction ? BASE_URL_PROD : BASE_URL_STAGING;

  return {
    auth: BASE_URL_LINK + "/api/auth/",
    user: BASE_URL_LINK + "/api/users",
    // bookings: BASE_URL_LINK + "/api/admin/bookings",
    faq: BASE_URL_LINK + "/api/admin/faqs",
    ticket: BASE_URL_LINK + "/api/admin/tickets/",
    messae: BASE_URL_LINK + "/api/admin/tickets/",
    escalation: BASE_URL_LINK + "/api/admin/escalation-levels",
    admin: BASE_URL_LINK + "/api/admin",
    chat: BASE_URL_LINK + "/api/admin/chats/",
    users: BASE_URL_LINK + "/api/superuser/",
    privacypolicy: BASE_URL_LINK + "/api/admin/privacy-policy",
    termsofuse: BASE_URL_LINK + "/api/admin/terms-of-use",
    aboutus: BASE_URL_LINK + "/api/admin/about-us",
    partners: BASE_URL_LINK + "/api/admin/partners",
    partnercategories: BASE_URL_LINK + "/api/admin/partner-categories",
    dashboardactivities: BASE_URL_LINK + "/api/admin/dashboard/activities",
    dashboardrevenue: BASE_URL_LINK + "/api/admin/dashboard/revenue/",
    dashboardmessages: BASE_URL_LINK + "/api/admin/dashboard/messages",
    superadmin: BASE_URL_LINK + "/api/superadmin/",
    roles: BASE_URL_LINK + "/api/admin/me/",
    usercount: BASE_URL_LINK + "/api/admin/dashboard/user-count/",
    dashboardbookings: BASE_URL_LINK + "/api/admin/dashboard/stats/",
    cms: BASE_URL_LINK + "/api/admin/commissions/",
    upload: BASE_URL_LINK + "/api/upload/",
    notification: BASE_URL_LINK + "/api/notifications/",
    bookingHistory: BASE_URL_LINK + "/api/bookings/admin/booking",
  };
};

export default api;
