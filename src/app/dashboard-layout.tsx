"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { navItems } from "@shared/config/navigation";
import { useMyRoles } from "@/hooks/api/roles";
import { NotificationModal } from "@/components/reuseables/Notification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLogout } from "@/hooks/api/auth";
import { useAuthContext } from "@/context/AuthContext";
import {
  useGetAllNotifications,
  useWebSocketService,
} from "@/hooks/api/notification";
import { showInfoToast } from "@/utils/toasters";
import type { AppNotification } from "@/hooks/api/notification";

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { onLogout } = useLogout();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasLoggedOutRef = React.useRef(false);
  const APP_STATE = useAuthContext();
  const isSuperuser = Boolean(APP_STATE?.user?.isSuperuser);
  const visibleNavItems = useMemo(
    () =>
      navItems.filter(
        (item) => !item.requiresSuperuser || isSuperuser
      ),
    [isSuperuser]
  );

  const currentNavItem = visibleNavItems.find(
    (item) =>
      pathname === item.href ||
      (pathname.startsWith(`${item.href}/`) && item.href !== "/Dashboard")
  );

  const handleLinkClick = () => {
    setMobileSidebarOpen(false);
  };

  const requestLogout = () => {
    setMobileSidebarOpen(false);
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
      setLogoutDialogOpen(false);
    }
  };

  useEffect(() => {
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    let logoutDelayTimer: ReturnType<typeof setTimeout> | null = null;

    const clearInactivityTimer = () => {
      if (!inactivityTimer) {
        return;
      }

      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    };

    const startInactivityTimer = () => {
      clearInactivityTimer();

      inactivityTimer = setTimeout(() => {
        if (hasLoggedOutRef.current) {
          return;
        }

        hasLoggedOutRef.current = true;
        showInfoToast({
          message: "Session expired due to inactivity",
          description: "You were inactive for 3 minutes and have been logged out.",
        });

        logoutDelayTimer = setTimeout(() => {
          onLogout();
        }, 1200);
      }, INACTIVITY_TIMEOUT_MS);
    };

    const handleUserActivity = () => {
      if (hasLoggedOutRef.current) {
        return;
      }

      startInactivityTimer();
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    startInactivityTimer();

    return () => {
      clearInactivityTimer();
      if (logoutDelayTimer) {
        clearTimeout(logoutDelayTimer);
      }
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
    };
  }, [onLogout]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="w-64 z-50 bg-[#EBECED] border-r border-gray-200 hidden md:flex flex-col h-screen">
        <div className="p-6">
          <Link href="/" className="text-blue-700 text-xl font-semibold">
            TravelMate
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(`${item.href}/`) &&
                item.href !== "/Dashboard");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center p-[12px] space-x-[12px] rounded-[18px] ${
                  isActive ? "bg-[#CCD8E8]" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`${
                    isActive ? "bg-[#023E8A]" : "bg-[#DEDFE1]"
                  } w-8 h-8 rounded-full flex items-center justify-center`}
                >
                  <img src={isActive ? item.iconActive : item.icon} alt="" />
                </div>
                <div
                  className={`${
                    isActive ? "text-[#023E8A]" : "text-[#181818]"
                  } font-[400] text-[16px]`}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            className="flex items-center px-4 py-3 text-sm text-red-500 hover:bg-gray-100 rounded-lg w-full"
            onClick={requestLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Log Out
          </button>
        </div>
      </div>

      {/* Mobile Sidebar - right positioned */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Sidebar container */}
          <div className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-[#EBECED] shadow-lg flex flex-col">
            {/* Close button at the top right */}
            <div className="flex justify-end p-4">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="Close menu"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto px-4">
              <div className="mb-6 px-2">
                <Link
                  href="/"
                  className="text-blue-700 text-xl font-semibold"
                  onClick={handleLinkClick}
                >
                  TravelMate
                </Link>
              </div>

              <nav className="space-y-2">
                {visibleNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname.startsWith(`${item.href}/`) &&
                      item.href !== "/Dashboard");
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`flex items-center p-3 space-x-3 rounded-xl ${
                        isActive
                          ? "bg-[#CCD8E8]"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div
                        className={`${
                          isActive ? "bg-[#023E8A]" : "bg-[#DEDFE1]"
                        } w-8 h-8 rounded-full flex items-center justify-center`}
                      >
                        <img
                          src={isActive ? item.iconActive : item.icon}
                          alt=""
                        />
                      </div>
                      <div
                        className={`${
                          isActive ? "text-[#023E8A]" : "text-[#181818]"
                        } font-medium text-base`}
                      >
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                className="flex items-center w-full px-4 py-3 text-sm text-red-500 hover:bg-gray-100 rounded-lg  "
                onClick={requestLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto w-full bg-[#f5f5f5] ">
        <Navbar
          pageName={currentNavItem?.label || "Unknown Page"}
          onMenuClick={() => setMobileSidebarOpen(true)}
          onRequestLogout={requestLogout}
        />
        <main className="flex-1 lg:px-[40px] px-2 pb-6  ">{children}</main>
      </div>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-md rounded-[24px] border border-[#e6eaf2] p-0">
          <div className="space-y-6 p-6 sm:p-8">
            <DialogHeader className="space-y-3 text-left">
              <DialogTitle className="text-2xl font-semibold text-[#181818]">
                Log out?
              </DialogTitle>
              <DialogDescription className="text-sm leading-7 text-[#5f6470] sm:text-[15px]">
                You&apos;ll need to sign in again to continue using the TravelMate
                admin dashboard.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-[14px] border border-[#d8dde6] px-5 py-3 text-sm font-semibold text-[#181818] transition hover:bg-[#f8fafc]"
                onClick={() => setLogoutDialogOpen(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-[14px] bg-[#D72638] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#bd2031] disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface NavbarProps {
  pageName: string;
  onMenuClick: () => void;
  onRequestLogout: () => void;
}

const Navbar = ({ pageName, onMenuClick, onRequestLogout }: NavbarProps) => {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { loading, data } = useMyRoles({ modalVisible: true });
  const APP_STATE = useAuthContext();
  const contextUser = APP_STATE?.user as Record<string, unknown> | undefined;
  const roleData = data as { name?: string } | undefined;
  const displayName =
    (typeof contextUser?.name === "string" && contextUser.name) ||
    roleData?.name ||
    "User";
  const accessToken = APP_STATE?.accessToken || "";
  const { notifications: apiNotifications, refetch } = useGetAllNotifications();
  const { messages: wsMessages } = useWebSocketService(accessToken || null);
  const [navbarNotifications, setNavbarNotifications] = useState<
    AppNotification[]
  >([]);

  useEffect(() => {
    if (Array.isArray(apiNotifications)) {
      setNavbarNotifications(apiNotifications);
    }
  }, [apiNotifications]);

  useEffect(() => {
    if (!wsMessages?.length) return;

    const latest = wsMessages[wsMessages.length - 1];
    if (!latest?.id) return;

    setNavbarNotifications((prev) => {
      if (prev.some((notification) => notification?.id === latest.id)) {
        return prev;
      }
      return [latest, ...prev];
    });
  }, [wsMessages]);

  const unreadCount = useMemo(
    () =>
      navbarNotifications.filter((notification) => !notification?.is_read)
        .length,
    [navbarNotifications]
  );

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const toggleModal = () => setIsModalVisible((prev) => !prev);
  const handleMarkAllReadInNavbar = () => {
    setNavbarNotifications((prev) =>
      prev.map((notification) => ({ ...notification, is_read: true }))
    );
  };

  const handleCloseNotificationModal = () => {
    setIsModalVisible(false);
    refetch();
  };

  return (
    <div className="p-4 md:p-6 relative">
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="hidden lg:block">
          <h1 className="text-[28px] font-[600] text-[#181818]">
            {pageName === "CMS" ? "Content Management System" : pageName}
          </h1>
        </div>
        <div className="flex space-x-6 relative">
          <div className="relative hidden md:block ">
            <div
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center bg-[#fff] cursor-pointer"
              onClick={toggleModal}
            >
              {unreadCount > 0 && (
                <div className="bg-[#D72638] absolute rounded-full min-w-[20px] h-[20px] px-1 flex items-center justify-center text-white text-xs font-bold top-0 right-0">
                  {badgeLabel}
                </div>
              )}
              <img
                src="/assets/icons/notifications.svg"
                alt="Notifications"
                className=""
              />
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2 bg-[#fff] lg:bg-[#fff] p-[10px] rounded-[200px]">
            <div className="relative cursor-pointer">
              {loading ? (
                <div className="flex space-x-2 items-center ">
                  <div className="h-5 w-5 rounded-full bg-gray-300"></div>
                  <div className="w-[100px] h-[20px] rounded-[8px] bg-gray-300 animate-pulse"></div>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full w-[auto] outline-none focus:outline-none "
                    >
                      <div>
                        <Image
                          src="/assets/images/nav-user.svg"
                          alt="User avatar"
                          width={40}
                          height={40}
                          className="object-cover rounded-full"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-[16px] text-[#181818] leading-[100%]">
                          {displayName}
                        </span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onSelect={() => router.push("/Dashboard/user")}
                    >
                      View Users
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={onRequestLogout}
                      className="text-[#D72638]"
                    >
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="relative md:hidden">
            <div
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center bg-[#fff] cursor-pointer"
              onClick={toggleModal}
            >
              {unreadCount > 0 && (
                <div className="bg-[#D72638] absolute rounded-full min-w-[20px] h-[20px] px-1 flex items-center justify-center text-white text-xs font-bold top-0 right-0">
                  {badgeLabel}
                </div>
              )}
              <img
                src="/assets/icons/notifications.svg"
                alt="Notifications"
                className=""
              />
            </div>
          </div>

          {isModalVisible && (
            <NotificationModal
              onClose={handleCloseNotificationModal}
              accessToken={accessToken}
              onMarkAllRead={handleMarkAllReadInNavbar}
            />
          )}

          {/* Menu Button */}
          <div className="flex space-x-3 items-center md:hidden">
            <div
              className="w-10 h-10 bg-[#f5f5f5] rounded-full flex justify-center items-center cursor-pointer"
              onClick={onMenuClick}
            >
              <img src="/assets/icons/Menu.svg" alt="Menu" />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
