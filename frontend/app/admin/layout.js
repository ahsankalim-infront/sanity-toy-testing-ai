"use client";

import { usePathname } from "next/navigation";
import AdminShell from "../../components/admin/AdminShell";

export default function Layout({ children }) {
  const path = usePathname();
  if (path === "/admin/login") return children;
  return <AdminShell>{children}</AdminShell>;
}
