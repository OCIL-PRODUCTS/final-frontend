"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { loggedIn, isAdmin, subscription } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowedRoutesForNone = [
    "/profile/user-courses",
    "/profile/checkout",
    "/profile",
    "/profile/support",
    "/profile/settings",
    "/profile/myprofile",
  ];

  useEffect(() => {
    // 1️⃣ Admins should never see /profile
    if (isAdmin && pathname.startsWith("/profile")) {
      router.push("/admin/opulententrepreneurs/open/dashboard");
      return;
    }

    // 2️⃣ Non-admins should never see the admin dashboard
    if (pathname.startsWith("/admin/opulententrepreneurs/open")) {
      if (!loggedIn) {
        router.push("/login");
        return;
      }
      if (!isAdmin) {
        router.push("/profile");
        return;
      }
    }

    // 3️⃣ Any unauthenticated user on /profile or /admin gets redirected
    if (
      !loggedIn &&
      (pathname.startsWith("/profile") || pathname.startsWith("/admin/opulententrepreneurs/open"))
    ) {
      router.push("/login");
      return;
    }

    // 4️⃣ Restrict non-subscribed users from accessing restricted pages
    if (
      loggedIn &&
      !isAdmin &&
      subscription === "none" &&
      pathname.startsWith("/profile") &&
      !allowedRoutesForNone.includes(pathname)
    ) {
      router.push("/profile");
      return;
    }
  }, [pathname, loggedIn, isAdmin, subscription, router]);

  // Render nothing while redirecting
  const isRedirecting =
    (isAdmin && pathname.startsWith("/profile")) ||
    (!loggedIn && (pathname.startsWith("/profile") || pathname.startsWith("/admin/opulententrepreneurs/open"))) ||
    (pathname.startsWith("/admin/opulententrepreneurs/open/dashboard") && (!loggedIn || !isAdmin)) ||
    (loggedIn &&
      !isAdmin &&
      subscription === "none" &&
      pathname.startsWith("/profile") &&
      !allowedRoutesForNone.includes(pathname));

  if (isRedirecting) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
