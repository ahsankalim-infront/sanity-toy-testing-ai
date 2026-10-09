import AdminLayoutClient from "../../components/admin/AdminLayoutClient";

export const metadata = {
  title: "Kidlo Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
