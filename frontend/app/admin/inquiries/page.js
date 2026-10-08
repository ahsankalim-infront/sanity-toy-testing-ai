"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function InquiriesAdmin() {
  return <ResourceManager table="inquiries" title="Messages" columns={["type", "name", "phone", "status"]} blank={{ type: "contact", name: "", email: "", phone: "", message: "", status: "new" }} />;
}
