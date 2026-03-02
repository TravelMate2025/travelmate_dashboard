const api = ({ inProduction }: { inProduction: boolean }) => {
  const BASE_URL_STAGING = "https://travelmate-backend-knvd.onrender.com/api";
  const BASE_URL_PROD = "https://travelmate-backend-1-1lgj.onrender.com/api";

  const BASE_URL_LINK = inProduction ? BASE_URL_PROD : BASE_URL_STAGING;

  return {
    auth: BASE_URL_LINK + "/auth/",
    user: BASE_URL_LINK + "/users",
    bookings: BASE_URL_LINK + "/admin/bookings",
    faq: BASE_URL_LINK + "/admin/faqs",
    ticket: BASE_URL_LINK + "/admin/tickets/",
    messae: BASE_URL_LINK + "/admin/tickets/",
    escalation: BASE_URL_LINK + "/admin/escalation-levels",
    admin: BASE_URL_LINK + "/admin",
    chat: BASE_URL_LINK + "/admin/chats/",
    users: BASE_URL_LINK + "/superuser/",
    privacypolicy: BASE_URL_LINK + "/admin/privacy-policy",
    termsofuse: BASE_URL_LINK + "/admin/terms-of-use",
    aboutus: BASE_URL_LINK + "/admin/about-us",
    partners: BASE_URL_LINK + "/admin/partners",
    partnercategories: BASE_URL_LINK + "/admin/partner-categories",
    dashboardactivities: BASE_URL_LINK + "/admin/dashboard/activities",
    dashboardrevenue: BASE_URL_LINK + "/admin/dashboard/revenue/",
    dashboardmessages: BASE_URL_LINK + "/admin/dashboard/messages",
    superadmin: BASE_URL_LINK + "/superadmin/",
    roles: BASE_URL_LINK + "/admin/me/",
    usercount: BASE_URL_LINK + "/admin/dashboard/user-count/",
    dashboardbookings: BASE_URL_LINK + "/admin/dashboard/stats/",
    cms: BASE_URL_LINK + "/admin/commissions/",
    upload: BASE_URL_LINK + "/upload/",
    notification: BASE_URL_LINK + "/notifications/",
    bookingHistory: BASE_URL_LINK + "/bookings/admin/booking",
  };
};

export default api;
