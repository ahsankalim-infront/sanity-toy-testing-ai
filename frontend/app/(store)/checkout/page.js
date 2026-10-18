"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, pkr } from "../../../lib/format";
import { useCart } from "../../../context/CartContext";
import { CityField, PhoneField } from "../../../components/PlaceFields";
import ProductMedia from "../../../components/ProductMedia";

const EMPTY = { customer_name: "", email: "", phone: "", address: "", city: "Lahore", country_code: "PK", payment_method: "cod", coupon_code: "", notes: "", payment_account_id: 0, payment_txn: "", payment_proof_url: "" };
const PROOF_METHODS = new Set(["easypaisa", "jazzcash", "bank"]);

const PAYMENTS = [
  { id: "cod", title: "Cash on delivery", text: "Pay the rider when the parcel arrives", icon: "💵" },
  { id: "card", title: "Card", text: "Visa or Mastercard", icon: "💳" },
  { id: "easypaisa", title: "EasyPaisa", text: "Pay to Kidlo EasyPaisa, then upload the receipt", icon: "📱" },
  { id: "jazzcash", title: "JazzCash", text: "Pay to Kidlo JazzCash, then upload the receipt", icon: "📲" },
  { id: "bank", title: "Bank transfer", text: "Pay to the Kidlo bank account, then upload the receipt", icon: "🏦" },
];

const FALLBACK_ACCOUNTS = [
  { id: 1, method: "easypaisa", title: "Kidlo EasyPaisa", account_name: "Kidlo Toys", account_number: "03001234567", bank_name: "EasyPaisa", iban: "", instructions: "Send the exact order total to this EasyPaisa wallet, then upload the payment screenshot and the transaction ID." },
  { id: 2, method: "jazzcash", title: "Kidlo JazzCash", account_name: "Kidlo Toys", account_number: "03001234567", bank_name: "JazzCash", iban: "", instructions: "Send the exact order total to this JazzCash wallet, then upload the payment screenshot and the transaction ID." },
  { id: 3, method: "bank", title: "Meezan Bank transfer", account_name: "Kidlo Toys (Pvt) Ltd", account_number: "01234567890123", bank_name: "Meezan Bank", iban: "PK36MEZN0001234567890123", instructions: "Transfer the exact order total. Use your order name as the reference, then upload the bank receipt." },
];

const FIELD_IDS = { customer_name: "name", phone: "phone", email: "email", address: "address", city: "city", notes: "notes", coupon_code: "coupon", payment_account_id: "payment-account", payment_txn: "payment-txn", payment_proof_url: "payment-proof" };

function checkoutProblems(form, countries) {
  const errors = {};
  const name = form.customer_name.trim();
  const email = form.email.trim();
  const address = form.address.trim();
  const city = form.city.trim();
  const country = countries.find((row) => row.code === form.country_code);
  if (name.length < 2 || !/\p{L}/u.test(name)) errors.customer_name = "Enter the full name for delivery";
  else if (name.length > 80) errors.customer_name = "Name must be 80 characters or less";
  if (!country || String(form.phone || "").length !== Number(country.digits)) {
    errors.phone = country ? `Enter a ${country.digits}-digit ${country.name} mobile number` : "Choose a country and enter the mobile number";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email address, such as you@email.com";
  else if (email.length > 120) errors.email = "Email must be 120 characters or less";
  if (address.length < 8) errors.address = "Enter the house number, street, and area";
  else if (address.length > 180) errors.address = "Address must be 180 characters or less";
  if (city.length < 2) errors.city = "Enter a city";
  else if (city.length > 60) errors.city = "City must be 60 characters or less";
  if (!PAYMENTS.some((method) => method.id === form.payment_method)) errors.payment_method = "Choose a payment method";
  if (form.notes.trim().length > 240) errors.notes = "Gift note must be 240 characters or less";
  if (form.coupon_code.trim() && !/^[A-Z0-9]{3,20}$/.test(form.coupon_code.trim())) errors.coupon_code = "Promo codes use 3 to 20 letters or numbers";
  if (PROOF_METHODS.has(form.payment_method)) {
    if (!Number(form.payment_account_id)) errors.payment_account_id = "Choose the Kidlo account you paid to";
    if (!form.payment_proof_url) errors.payment_proof_url = "Upload a screenshot or receipt of the payment";
    if (form.payment_txn.trim() && !/^[A-Za-z0-9-]{4,32}$/.test(form.payment_txn.trim())) errors.payment_txn = "Enter the transaction ID from your receipt";
  }
  return errors;
}


export default function CheckoutPage() {
  const { cart, subtotal, clear, ready } = useCart();
  const [form, setForm] = useState(EMPTY);
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const [order, setOrder] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [rules, setRules] = useState({ free_shipping_over: 2000, shipping_fee: 199, cod_note: "" });
  const [places, setPlaces] = useState({ countries: [], cities: [] });
  const [wallet, setWallet] = useState(null);
  const [useCoins, setUseCoins] = useState(false);
  const [errors, setErrors] = useState({});
  const [accounts, setAccounts] = useState(FALLBACK_ACCOUNTS);
  const [uploading, setUploading] = useState(false);
  const payable = Math.max(0, subtotal - discount);
  const freeOver = Number(rules.free_shipping_over) || 2000;
  const shipping = subtotal === 0 || payable >= freeOver ? 0 : Number(rules.shipping_fee);
  const coinValue = Number(wallet?.rules.coin_value_pkr) || 0;
  const coinCap = coinValue ? Math.floor(Math.floor((payable * Number(wallet.rules.max_redeem_percent || 0)) / 100) / coinValue) : 0;
  const usableCoins = wallet ? Math.min(Number(wallet.coins) || 0, coinCap) : 0;
  const coinsEligible = Boolean(wallet?.rules.enabled) && usableCoins > 0 && usableCoins >= Number(wallet.rules.min_redeem_coins || 0);
  const coinDiscount = useCoins && coinsEligible ? Math.round(usableCoins * coinValue) : 0;
  const total = payable - coinDiscount + shipping;
  const untilFree = Math.max(0, freeOver - payable);
  const methodAccounts = accounts.filter((row) => row.method === form.payment_method);

  useEffect(() => {
    if (!PROOF_METHODS.has(form.payment_method) || !methodAccounts.length) return;
    if (!methodAccounts.some((row) => Number(row.id) === Number(form.payment_account_id))) {
      set("payment_account_id", methodAccounts[0].id);
    }
  }, [form.payment_method, accounts]);

  useEffect(() => {
    api("/api/places").then(setPlaces).catch(() => {});
    function useAccounts(list) {
      if (Array.isArray(list)) setAccounts(list.length ? list : FALLBACK_ACCOUNTS);
    }
    api("/api/payments").then((data) => useAccounts(data.accounts)).catch(() => {});
    api("/api/shell").then((shell) => {
      const commerce = (shell.sections || []).find((row) => row.section_key === "commerce");
      if (commerce?.payload) setRules(commerce.payload);
      if (shell.payment_accounts) useAccounts(shell.payment_accounts);
    }).catch(() => {});
    try {
      const saved = JSON.parse(localStorage.getItem("kidlo_customer_profile") || "null");
      if (saved) {
        setForm((current) => ({
          ...current,
          customer_name: saved.name || current.customer_name,
          email: saved.email || current.email,
          phone: saved.phone || current.phone,
        }));
      }
    } catch { /* guest checkout */ }
    const token = localStorage.getItem("kidlo_customer");
    if (token) {
      api("/api/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((me) => setWallet({ coins: me.customer.coins, rules: me.rules }))
        .catch(() => {});
    }
  }, []);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function applyCode() {
    setMessage("");
    try {
      const result = await api("/api/coupons/validate", { method: "POST", body: { code: form.coupon_code, subtotal } });
      setDiscount(result.discount);
      setMessageOk(true);
      setMessage(result.description);
    } catch (err) {
      setDiscount(0);
      setMessageOk(false);
      setMessage(err.message);
    }
  }

  async function place(event) {
    event.preventDefault();
    const problems = checkoutProblems(form, places.countries);
    if (form.coupon_code.trim() && !problems.coupon_code && !discount) {
      problems.coupon_code = "Apply the promo code so the discount is included, or clear it";
    }
    if (Object.keys(problems).length) {
      setErrors(problems);
      setMessageOk(false);
      setMessage(Object.values(problems)[0]);
      const field = FIELD_IDS[Object.keys(problems)[0]];
      document.getElementById(field)?.focus();
      return;
    }
    setPlacing(true);
    setMessage("");
    try {
      const token = localStorage.getItem("kidlo_customer");
      const result = await api("/api/orders", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: {
          ...form,
          customer_name: form.customer_name.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          notes: form.notes.trim(),
          coupon_code: discount ? form.coupon_code.trim() : "",
          payment_txn: form.payment_txn.trim(),
          country_code: form.country_code,
          use_coins: coinDiscount ? usableCoins : 0,
          items: cart.map((item) => ({ product_id: item.id, qty: item.qty })),
        },
      });
      setOrder(result.order);
      clear();
    } catch (err) {
      setMessageOk(false);
      setMessage(err.message);
      if (err.fields) setErrors(err.fields);
      setPlacing(false);
    }
  }

  if (order) return <OrderPlaced order={order} />;
  if (!ready) {
    return (
      <div className="page-body">
        <div className="checkout-grid">
          <div className="skeleton" style={{ height: 520 }} />
          <div className="skeleton" style={{ height: 360 }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero checkout-hero">
        <div className="crumb"><Link href="/">Home</Link> / <Link href="/cart">Cart</Link> / Checkout</div>
        <h1>Checkout</h1>
        <p className="sec-sub">Delivery across Pakistan. Cash on delivery, cards, and mobile wallets.</p>
        <ol className="checkout-steps">
          <li className="done"><Link href="/cart">Cart</Link></li>
          <li className="current">Delivery & payment</li>
          <li>Confirmation</li>
        </ol>
      </div>
      <div className="page-body">
        {!cart.length ? (
          <div className="checkout-empty form-card">
            <div className="big">🛍️</div>
            <h2 className="sec-head">Your cart is empty</h2>
            <p className="sec-sub">Add a toy first, then come back to enter the delivery address.</p>
            <Link className="btn btn-orange" href="/shop/sale">See today's deals</Link>
          </div>
        ) : (
          <form className="checkout-grid" onSubmit={place} noValidate>
            <div className="checkout-main">
              <section className="form-card">
                <header className="checkout-block-head">
                  <span>1</span>
                  <div>
                    <h2>Delivery details</h2>
                    <p>We call this number before the rider leaves.</p>
                  </div>
                </header>
                <div className="form-grid">
                  <div className={`field ${errors.customer_name ? "invalid" : ""}`}>
                    <label htmlFor="name">Full name</label>
                    <input id="name" required autoComplete="name" maxLength={80} aria-invalid={errors.customer_name ? "true" : "false"} value={form.customer_name} onChange={(event) => set("customer_name", event.target.value)} placeholder="Ayesha Malik" />
                    {errors.customer_name ? <small className="field-error">{errors.customer_name}</small> : null}
                  </div>
                  <PhoneField
                    countries={places.countries}
                    countryCode={form.country_code}
                    phone={form.phone}
                    error={errors.phone}
                    onCountry={(code) => { setForm((current) => ({ ...current, country_code: code, phone: "", city: "" })); setErrors((current) => ({ ...current, phone: "", city: "" })); }}
                    onPhone={(phone) => set("phone", phone)}
                  />
                </div>
                <div className={`field ${errors.email ? "invalid" : ""}`}>
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" required autoComplete="email" maxLength={120} aria-invalid={errors.email ? "true" : "false"} value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="you@email.com" />
                  {errors.email ? <small className="field-error">{errors.email}</small> : <small className="field-hint">We send the receipt and order updates here.</small>}
                </div>
                <div className={`field ${errors.address ? "invalid" : ""}`}>
                  <label htmlFor="address">Street address</label>
                  <input id="address" required autoComplete="street-address" maxLength={180} aria-invalid={errors.address ? "true" : "false"} value={form.address} onChange={(event) => set("address", event.target.value)} placeholder="House, street, area" />
                  {errors.address ? <small className="field-error">{errors.address}</small> : <small className="field-hint">Include the house number, street, and area.</small>}
                </div>
                <CityField cities={places.cities} countryCode={form.country_code} city={form.city} error={errors.city} onCity={(city) => set("city", city)} />
              </section>

              <section className="form-card">
                <header className="checkout-block-head">
                  <span>2</span>
                  <div>
                    <h2>Payment</h2>
                    <p>{rules.cod_note || "Cash on delivery is available across Pakistan."}</p>
                  </div>
                </header>
                <div className="pay-grid">
                  {PAYMENTS.map((method) => (
                    <label key={method.id} className={`pay-card ${form.payment_method === method.id ? "on" : ""}`}>
                      <input type="radio" name="payment" value={method.id} checked={form.payment_method === method.id} onChange={() => setForm((current) => ({ ...current, payment_method: method.id, payment_account_id: 0, payment_txn: "", payment_proof_url: "" }))} />
                      <span className="pay-icon" aria-hidden>{method.icon}</span>
                      <span>
                        <strong>{method.title}</strong>
                        <small>{method.text}</small>
                      </span>
                    </label>
                  ))}
                </div>
                {PROOF_METHODS.has(form.payment_method) ? (
                  <PaymentProof
                    method={form.payment_method}
                    accounts={methodAccounts}
                    form={form}
                    errors={errors}
                    uploading={uploading}
                    onPick={(id) => set("payment_account_id", Number(id))}
                    onTxn={(value) => set("payment_txn", value)}
                    onUpload={async (file) => {
                      setUploading(true);
                      try {
                        const data = new FormData();
                        data.append("file", file);
                        const result = await api("/api/checkout/payment-proof", { method: "POST", body: data });
                        set("payment_proof_url", result.url);
                      } catch (err) {
                        setErrors((current) => ({ ...current, payment_proof_url: err.message }));
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                ) : null}
              </section>

              <section className="form-card">
                <header className="checkout-block-head">
                  <span>3</span>
                  <div>
                    <h2>Gift note</h2>
                    <p>Free wrapping on orders over PKR {Number(rules.gift_wrap_over || 3000).toLocaleString("en-PK")}.</p>
                  </div>
                </header>
                <div className={`field ${errors.notes ? "invalid" : ""}`} style={{ marginBottom: 0 }}>
                  <label htmlFor="notes">Message for the parcel <em>optional</em></label>
                  <textarea id="notes" rows={3} maxLength={240} aria-invalid={errors.notes ? "true" : "false"} value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Happy birthday, Zara" />
                  {errors.notes ? <small className="field-error">{errors.notes}</small> : null}
                </div>
              </section>
            </div>

            <aside className="form-card checkout-summary">
              <h2>Your order</h2>
              <ul className="checkout-items">
                {cart.map((item) => (
                  <li key={item.id}>
                    <span className="checkout-emoji" style={{ background: item.gradient || "#FFF3E0" }}><ProductMedia product={item} /></span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>Qty {item.qty}</small>
                    </span>
                    <b>{pkr(item.price * item.qty)}</b>
                  </li>
                ))}
              </ul>
              <Link className="checkout-edit" href="/cart">Edit cart</Link>

              <div className="ship-meter">
                <div className="ship-meter-bar"><div style={{ width: `${Math.min(100, (payable / freeOver) * 100)}%` }} /></div>
                <p>{untilFree > 0 ? `Add ${pkr(untilFree)} more for free delivery` : "Free delivery is unlocked"}</p>
              </div>

              <div className="coupon-row">
                <input id="coupon" value={form.coupon_code} maxLength={20} aria-invalid={errors.coupon_code ? "true" : "false"} onChange={(event) => { set("coupon_code", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setDiscount(0); }} placeholder="Promo code" aria-label="Promo code" />
                <button type="button" className="btn btn-outline" onClick={applyCode}>Apply</button>
              </div>
              {errors.coupon_code ? <p className="field-error">{errors.coupon_code}</p> : null}
              {message ? <p className={messageOk ? "checkout-note good" : "checkout-note bad"}>{message}</p> : null}

              {wallet?.rules.enabled ? (
                <div className={`coin-redeem ${coinsEligible ? "" : "off"}`}>
                  <label>
                    <input type="checkbox" checked={useCoins && coinsEligible} disabled={!coinsEligible} onChange={(event) => setUseCoins(event.target.checked)} />
                    <span>
                      <strong>🪙 Use {coinsEligible ? usableCoins : 0} Kidlo Coins</strong>
                      <small>
                        {coinsEligible
                          ? `Save ${pkr(Math.round(usableCoins * coinValue))}. You have ${wallet.coins} coins.`
                          : `You have ${wallet.coins} coins. Minimum ${wallet.rules.min_redeem_coins} coins, up to ${wallet.rules.max_redeem_percent}% of the order.`}
                      </small>
                    </span>
                  </label>
                  <Link href="/games">Win more</Link>
                </div>
              ) : null}

              <div className="checkout-totals">
                <div className="summary-line"><span>Subtotal</span><span>{pkr(subtotal)}</span></div>
                <div className="summary-line"><span>Discount</span><span>{discount ? `-${pkr(discount)}` : pkr(0)}</span></div>
                {coinDiscount ? <div className="summary-line"><span>Kidlo Coins</span><span>-{pkr(coinDiscount)}</span></div> : null}
                <div className="summary-line"><span>Delivery</span><span>{shipping ? pkr(shipping) : "Free"}</span></div>
                <div className="summary-line total"><span>Total</span><span>{pkr(total)}</span></div>
              </div>

              <button className="btn btn-orange checkout-place" type="submit" disabled={placing}>
                {placing ? "Placing order…" : `Place order · ${pkr(total)}`}
              </button>
              <ul className="checkout-trust">
                <li>Cash on delivery</li>
                <li>2–5 day delivery</li>
                <li>30-day returns</li>
              </ul>
            </aside>
          </form>
        )}
      </div>
    </>
  );
}

function PaymentProof({ method, accounts, form, errors, uploading, onPick, onTxn, onUpload }) {
  const title = { easypaisa: "EasyPaisa", jazzcash: "JazzCash", bank: "bank" }[method];
  const numberLabel = method === "bank" ? "Account number" : `${{ easypaisa: "EasyPaisa", jazzcash: "JazzCash" }[method]} number`;
  return (
    <div className="pay-proof" id="payment-account">
      <h3>Pay to this Kidlo {title} account</h3>
      <p className="muted">Send the exact order total to the account below, then upload your receipt.</p>
      {!accounts.length ? <p className="field-error">Account details did not load. Refresh the page, or choose another way to pay.</p> : null}
      {accounts.map((row) => (
        <article key={row.id} className={`pay-account ${Number(form.payment_account_id) === Number(row.id) ? "on" : ""}`}>
          {accounts.length > 1 ? (
            <label className="pay-account-pick">
              <input type="radio" name="payment-account" checked={Number(form.payment_account_id) === Number(row.id)} onChange={() => onPick(row.id)} />
              Use this account
            </label>
          ) : null}
          <dl className="pay-account-info">
            <div><dt>Account title</dt><dd>{row.title}</dd></div>
            <div><dt>Account name</dt><dd>{row.account_name}</dd></div>
            <div>
              <dt>{numberLabel}</dt>
              <dd>
                <b>{row.account_number}</b>
                <CopyValue value={row.account_number} />
              </dd>
            </div>
            {row.bank_name ? <div><dt>{method === "bank" ? "Bank" : "Wallet"}</dt><dd>{row.bank_name}</dd></div> : null}
            {row.iban ? (
              <div>
                <dt>IBAN</dt>
                <dd>
                  <b>{row.iban}</b>
                  <CopyValue value={row.iban} />
                </dd>
              </div>
            ) : null}
            {row.instructions ? <div className="wide"><dt>How to pay</dt><dd>{row.instructions}</dd></div> : null}
          </dl>
        </article>
      ))}
      {errors.payment_account_id ? <small className="field-error">{errors.payment_account_id}</small> : null}
      <div className={`field ${errors.payment_txn ? "invalid" : ""}`}>
        <label htmlFor="payment-txn">Transaction ID <em>if your receipt has one</em></label>
        <input id="payment-txn" value={form.payment_txn} maxLength={32} onChange={(event) => onTxn(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} placeholder="e.g. JC12345678" />
        {errors.payment_txn ? <small className="field-error">{errors.payment_txn}</small> : null}
      </div>
      <div className={`field ${errors.payment_proof_url ? "invalid" : ""}`}>
        <label htmlFor="payment-proof">Payment screenshot or receipt</label>
        <input id="payment-proof" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); }} />
        {uploading ? <small className="field-hint">Uploading receipt…</small> : null}
        {form.payment_proof_url ? <img className="pay-proof-preview" src={form.payment_proof_url} alt="Payment receipt preview" /> : null}
        {errors.payment_proof_url ? <small className="field-error">{errors.payment_proof_url}</small> : <small className="field-hint">JPG, PNG, WebP, or GIF, up to 5 MB.</small>}
      </div>
    </div>
  );
}

function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      className="pay-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard blocked */ }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function OrderPlaced({ order }) {
  const method = PAYMENTS.find((item) => item.id === order.payment_method);
  return (
    <div className="page-body">
      <div className="checkout-success form-card">
        <div className="checkout-success-mark">✓</div>
        <p className="checkout-kicker">Order confirmed</p>
        <h1 className="sec-head">{order.order_no}</h1>
        <p className="sec-sub">
          Thank you, {order.customer_name}. {order.payment_status === "submitted"
            ? `We received your ${method?.title || "payment"} receipt and will confirm it before packing.`
            : `We will call ${order.phone} before delivery in ${order.city}.`}
        </p>
        <div className="checkout-success-grid">
          <div><span>To pay</span><strong>{pkr(order.total)}</strong></div>
          <div><span>Payment</span><strong>{method?.title || order.payment_method}</strong></div>
          <div><span>Deliver to</span><strong>{order.city}</strong></div>
        </div>
        <div className="row-actions" style={{ justifyContent: "center" }}>
          <Link className="btn btn-orange" href={`/track`}>Track this order</Link>
          <Link className="btn btn-outline" href="/">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
