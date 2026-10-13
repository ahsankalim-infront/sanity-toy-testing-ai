import { Suspense } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CarCursor from "../../components/CarCursor";
import NavProgress from "../../components/NavProgress";
import { WhatsAppFloat, WhatsAppProvider } from "../../components/WhatsApp";
import { api } from "../../lib/format";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }) {
  let shell = null;
  let offline = "";
  try {
    shell = await api("/api/shell");
  } catch (err) {
    offline = err.message;
  }
  const whatsapp = (shell?.sections || []).find((row) => row.section_key === "whatsapp")?.payload || null;
  return (
    <WhatsAppProvider settings={whatsapp}>
      <Suspense fallback={null}><NavProgress /></Suspense>
      <CarCursor />
      {offline ? <div className="topbar">The store API is not running. Start the backend on port 4000. {offline}</div> : null}
      <Header shell={shell} />
      <main>{children}</main>
      <Footer shell={shell} />
      <WhatsAppFloat />
    </WhatsAppProvider>
  );
}
