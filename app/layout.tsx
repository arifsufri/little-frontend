import "../styles/globals.css";
import type { ReactNode } from "react";
import Providers from "./providers";

export const metadata = {
  title: "Little Barbershop",
  description: "Little Barbershop frontend",
  icons: {
    icon: "/images/LITTLE-BARBERSHOP-LOGO.svg",
    apple: "/images/LITTLE-BARBERSHOP-LOGO.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
