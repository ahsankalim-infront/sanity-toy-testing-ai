"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function NewsletterAdmin() {
  return <ResourceManager table="newsletter" title="Newsletter" description="Review addresses collected from the storefront newsletter form." columns={["created_at"]} identity={{ title: "email", subtitle: "created_at" }} search={["email"]} blank={{ email: "" }} />;
}
