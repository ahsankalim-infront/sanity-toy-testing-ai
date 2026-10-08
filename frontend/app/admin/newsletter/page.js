"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function NewsletterAdmin() {
  return <ResourceManager table="newsletter" title="Newsletter" columns={["email", "created_at"]} blank={{ email: "" }} />;
}
