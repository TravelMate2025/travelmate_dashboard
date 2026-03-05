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
import { useLogout } from "@/hooks/api/auth";
import { useAuthContext } from "@/context/AuthContext";
import {
  useGetAllNotifications,
  useWebSocketService,
} from "@/hooks/api/notification";
import type { AppNotification } from "@/hooks/api/notification";
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { onLogout } = useLogout();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const currentNavItem = navItems.find(
    (item) =>
      pathname === item.href ||
      (pathname.startsWith(`${item.href}/`) && item.href !== "/Dashboard")
  );

  const handleLinkClick = () => {
    setMobileSidebarOpen(false);
  };

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
          {navItems.map((item) => {
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
            onClick={onLogout}
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
                {navItems.map((item) => {
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
                onClick={onLogout}
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
        />
        <main className="flex-1 lg:px-[40px] px-2 pb-6  ">{children}</main>
      </div>
    </div>
  );
}

interface NavbarProps {
  pageName: string;
  onMenuClick: () => void;
}

const Navbar = ({ pageName, onMenuClick }: NavbarProps) => {
  const router = useRouter();
  const { onLogout } = useLogout();
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
                      onSelect={onLogout}
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
