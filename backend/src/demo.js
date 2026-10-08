const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Sialkot"];
const NAMES = ["Ayesha Malik", "Bilal Ahmed", "Sana Tariq", "Usman Khan", "Hira Shah", "Fahad Iqbal", "Mariam Raza", "Zain Abbas", "Noor Fatima", "Hamza Ali", "Iqra Javed", "Saad Butt"];
const PAYMENTS = ["cod", "cod", "cod", "cod", "card", "easypaisa", "jazzcash", "bank"];
const STATUSES = ["Delivered", "Delivered", "Delivered", "Shipped", "Shipped", "Processing", "Placed", "Cancelled"];

function rng(seed) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

function demoOrders({ products, orders, orderItems, rules, days = 60, count = 90 }) {
  const random = rng(20261008);
  const pick = (list) => list[Math.floor(random() * list.length)];
  let orderId = orders.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
  let itemId = orderItems.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
  let seq = orders.reduce((max, row) => Math.max(max, Number(String(row.order_no).replace(/\D/g, "")) || 1000), 1000);
  const newOrders = [];
  const newItems = [];
  for (let index = 0; index < count; index += 1) {
    const daysAgo = Math.floor(Math.pow(random(), 1.4) * days);
    const created = new Date(Date.now() - daysAgo * 86400000 - Math.floor(random() * 86400000));
    const lineCount = 1 + Math.floor(random() * 3);
    const lines = [];
    for (let line = 0; line < lineCount; line += 1) {
      const product = pick(products);
      if (lines.some((row) => row.product.id === product.id)) continue;
      lines.push({ product, qty: 1 + Math.floor(random() * 2) });
    }
    const subtotal = lines.reduce((sum, row) => sum + row.product.price * row.qty, 0);
    const discount = subtotal >= 2000 && random() < 0.25 ? Math.round(subtotal * 0.1) : 0;
    const shipping = subtotal - discount >= Number(rules.free_shipping_over || 2000) ? 0 : Number(rules.shipping_fee || 199);
    const name = pick(NAMES);
    orderId += 1;
    seq += 1;
    newOrders.push({
      id: orderId,
      order_no: `KD${seq}`,
      customer_name: name,
      email: `${name.split(" ")[0].toLowerCase()}@example.com`,
      phone: `030${String(10000000 + Math.floor(random() * 89999999))}`,
      address: "Demo address",
      city: pick(CITIES),
      payment_method: pick(PAYMENTS),
      status: daysAgo < 2 ? "Placed" : pick(STATUSES),
      subtotal,
      shipping,
      discount,
      total: subtotal - discount + shipping,
      coupon_code: discount ? "KIDLO50" : "",
      notes: "Demo order for dashboard reports",
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
    });
    for (const line of lines) {
      itemId += 1;
      newItems.push({ id: itemId, order_id: orderId, product_id: line.product.id, name: line.product.name, emoji: line.product.emoji, price: line.product.price, qty: line.qty });
    }
  }
  return { orders: newOrders, items: newItems };
}

module.exports = { demoOrders };
