import AdminBody from "@/components/AdminBody";
import Script from "next/script";
export const metadata = {
  title: "Dashboard",
  description: "Dashboard",
  openGraph: {
    title: "Dashboard - OpEn",
    description: "Dashboard",
    type: "website",
  },
};
export default function Admin() {
  return (
    <>
    <AdminBody/>
    </>
  );
}
