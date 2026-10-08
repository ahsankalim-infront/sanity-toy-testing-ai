import Header from "../../components/Header";
import Footer from "../../components/Footer";
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
  return (
    <>
      {offline ? <div className="topbar">The store API is not running. Start the backend on port 4000. {offline}</div> : null}
      <Header shell={shell} />
      <main>{children}</main>
      <Footer shell={shell} />
    </>
  );
}
