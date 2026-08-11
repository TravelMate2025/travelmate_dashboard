import { NotificationModule } from "@/components/molecues/notification/NotificationModule";
import { getCookies } from "@/context/Auth-Cookies";

const page = async () => {
  const { accessToken } = await getCookies();
  return <NotificationModule accessToken={accessToken ?? ""} />;
};

export default page;
