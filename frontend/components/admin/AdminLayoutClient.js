"use client";

import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

export default function AdminLayoutClient({ children }) {
  const path = usePathname();
  if (path === "/admin/login") return children;
  return <AdminShell>{children}</AdminShell>;
}
