"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const Sidebar = () => {
  const { logout, subscription } = useAuth();
  const pathname = usePathname();

  const handleLogout = async (e) => {
    e.preventDefault();
    logout();
  };

  const allMenuItems = [
    { path: "/profile", icon: "icon-grid", title: "Dashboard" },
    { path: "/profile/mytribes", icon: "mdi mdi-account-multiple", title: "Tribes" },
    { path: "/profile/lift-ai", icon: "fa-solid fa-brain", title: "Lift AI (Coming Soon)" },
    { path: "/profile/tools", icon: "mdi mdi-wrench", title: "Growth Toolkit" },
    { path: "/profile/courses", icon: "fa fa-graduation-cap", title: "Courses" },
    { path: "/profile/chat", icon: "ti-comment", title: "Chat" },
    { path: "/profile/mytribers", icon: "ti-link", title: "My Tribers" },
    { path: "/profile/settings", icon: "mdi mdi-account-check", title: "Manage Account" },
    { path: "/profile/support", icon: "mdi mdi-help-circle-outline", title: "Support" },
  ];

  const allowedForNone = [
    "/profile",
    "/profile/settings",
    "/profile/support",
    "/profile/user-courses", // Optional if you want to allow viewing
  ];

  const visibleMenuItems =
    subscription === "none"
      ? allMenuItems.filter((item) => allowedForNone.includes(item.path))
      : allMenuItems;

  return (
    <nav className="sidebar sidebar-offcanvas" id="sidebar">
      <ul className="nav">
        {visibleMenuItems.map((item) => (
          <li
            key={item.path}
            className={`nav-item ${pathname === item.path ? "active" : ""}`}
          >
            {item.path === "/profile/settings" ? (
              <a
                href={item.path}
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = item.path;
                }}
              >
                <i className={`${item.icon} menu-icon`} />
                <span className="menu-title">{item.title}</span>
              </a>
            ) : (
              <Link className="nav-link" href={item.path}>
                <i className={`${item.icon} menu-icon`} />
                <span className="menu-title">{item.title}</span>
              </Link>
            )}
          </li>
        ))}
        <li className="nav-item">
          <Link href="#" className="nav-link" onClick={handleLogout}>
            <i className="ti-power-off menu-icon" />
            <span className="menu-title">Sign Out</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
