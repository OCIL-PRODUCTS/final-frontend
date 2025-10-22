import Signup from "@/components/Signup";
import Script from "next/script";
export default function Admin() {
  return (
    <>
    <Script
          src="https://js.stripe.com/v3"
          strategy="afterInteractive"
        />
    <Signup/>
    </>
  );
}
