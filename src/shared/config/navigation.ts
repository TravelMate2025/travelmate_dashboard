export type NavigationItem = {
  icon: string;
  label: string;
  href: string;
  iconActive: string;
};

export const navItems: NavigationItem[] = [
  {
    icon: "/assets/icons/side-dashboard.svg",
    label: "Dashboard",
    href: "/Dashboard",
    iconActive: "/assets/icons/a-sidebar-dashboard.svg",
  },
  {
    icon: "/assets/icons/Side-user.svg",
    label: "Users",
    href: "/Dashboard/user",
    iconActive: "/assets/icons/a-sidebar-user.svg",
  },
  {
    icon: "/assets/icons/side-booking.svg",
    label: "Bookings",
    href: "/Dashboard/bookings",
    iconActive: "/assets/icons/a-sidebar-booking.svg",
  },
  {
    icon: "/assets/icons/side-cms.svg",
    label: "CMS",
    href: "/Dashboard/cms",
    iconActive: "/assets/icons/a-sidebar-cms.svg",
  },
  {
    icon: "/assets/icons/side-support.svg",
    label: "Customer Support",
    href: "/Dashboard/support",
    iconActive: "/assets/icons/a-sidebar-support.svg",
  },
  {
    icon: "/assets/icons/BellDark.svg",
    label: "Notifications",
    href: "/Dashboard/notification",
    iconActive: "/assets/icons/BellWhite.svg",
  },
  {
    icon: "/assets/icons/side-report.svg",
    label: "Report & Analytics",
    href: "/Dashboard/reports",
    iconActive: "/assets/icons/a-sidebar-report.svg",
  },
  {
    icon: "/assets/icons/side-roles.svg",
    label: "Admin Roles",
    href: "/Dashboard/admin",
    iconActive: "/assets/icons/a-sidebar-role.svg",
  },
];
