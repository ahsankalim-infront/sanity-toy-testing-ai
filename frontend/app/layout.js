import "./globals.css";
import "./extras.css";
import { CartProvider } from "../context/CartContext";

export const metadata = {
  title: {
    default: "Kidlo Toys – Play. Discover. Grow.",
    template: "%s",
  },
  description: "Pakistan's most loved kids toy store. Safe toys, fast delivery, and cash on delivery.",
  applicationName: "Kidlo Toys",
  category: "shopping",
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
