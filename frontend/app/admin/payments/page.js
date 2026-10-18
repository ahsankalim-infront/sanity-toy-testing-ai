"use client";

import ResourceManager from "../../../components/admin/ResourceManager";

export default function PaymentsAdmin() {
  return (
    <ResourceManager
      table="payment_accounts"
      title="Payment accounts"
      description="These EasyPaisa, JazzCash, and bank details appear at checkout. Customers pay this account, then upload a receipt so you can confirm the payment."
      columns={["method", "account_number", "enabled"]}
      identity={{ title: "title", subtitle: "account_name" }}
      search={["title", "account_name", "account_number", "bank_name", "iban"]}
      filters={[{ key: "method", label: "Method", options: [["all", "All methods"], ["easypaisa", "EasyPaisa"], ["jazzcash", "JazzCash"], ["bank", "Bank transfer"]] }, { key: "enabled", label: "Status", options: [["all", "All accounts"], ["1", "Live"], ["0", "Hidden"]] }]}
      blank={{ method: "easypaisa", title: "", account_name: "", account_number: "", bank_name: "", iban: "", instructions: "Send the exact order total, then upload the receipt.", enabled: 1, sort_order: 10 }}
    />
  );
}
