import HomePage from "../../components/HomePage";
import { api } from "../../lib/format";

export const dynamic = "force-dynamic";

export default async function Page() {
  try {
    const data = await api("/api/home");
    return <HomePage data={data} />;
  } catch (err) {
    return <section className="page-body"><div className="empty"><div className="big">🧸</div><h2 className="sec-head">Kidlo is starting up</h2><p className="sec-sub">{err.message}</p></div></section>;
  }
}
