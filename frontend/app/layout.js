import "./globals.css";
import "./extras.css";
import { CartProvider } from "../context/CartContext";

export const metadata = {
  title: "Kidlo Toys – Play. Discover. Grow.",
  description: "Pakistan's most loved kids toy store. Safe toys, fast delivery, and cash on delivery.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
