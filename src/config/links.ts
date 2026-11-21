// Falls back to the real production travelmate_web domain, not localhost —
// NEXT_PUBLIC_WEBBIE_USER_FRONTEND_URL is only set locally (.env.local,
// gitignored) for pointing at a dev server; if it's unset on a deployed
// dashboard (e.g. the env var wasn't configured on the host), registration
// and check-in links should still resolve to somewhere real instead of
// silently generating https://localhost:3000/... links for admins to hand
// out. Same "default to production, allow env override" shape as
// resolveBackendApiBase in src/lib/backend-api.ts.
const DEFAULT_USER_FRONTEND_URL = "https://travelmateglo.com";

const links = ({ inProduction }: { inProduction: boolean }) => {
    return {
       USER_FRONTEND_URL:
         process.env.NEXT_PUBLIC_WEBBIE_USER_FRONTEND_URL || DEFAULT_USER_FRONTEND_URL,
    };
 };

 export default links;
