"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function InquiriesAdmin() {
  return <ResourceManager table="inquiries" title="Messages" description="Follow contact, careers, wholesale, gift-card, and bulk-order enquiries." columns={["type", "phone", "status"]} identity={{ title: "name", subtitle: "message" }} search={["name", "email", "phone", "message", "type"]} filters={[{ key: "status", label: "Status", options: [["all", "All messages"], ["new", "New"], ["replied", "Replied"], ["closed", "Closed"]] }, { key: "type", label: "Type", options: [["all", "All types"], ["contact", "Contact"], ["careers", "Careers"], ["wholesale", "Wholesale"], ["bulk", "Bulk"], ["gift-card", "Gift card"]] }]} blank={{ type: "contact", name: "", email: "", phone: "", message: "", status: "new" }} />;
}
