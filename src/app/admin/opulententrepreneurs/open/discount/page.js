import Discount from "@/components/Discount";
export const metadata = {
  title: "Discount",
  description: "Discount Page",
  openGraph: {
    title: "Discount - OpEn",
    description: "Discount Page",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};
export default function Admin() {
  return (
    <>
    <Discount/>
    </>
  );
}
