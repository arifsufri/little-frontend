// import "./styles.css"; // Temporarily disabled to fix webpack error
import type { ReactNode } from "react";
import Providers from "./providers";
import KeepAliveProvider from "./providers/KeepAliveProvider";

export const metadata = {
  title: "Little Barbershop",
  description: "Little Barbershop frontend",
  icons: {
    icon: "/images/LITTLE-BARBERSHOP-LOGO.svg",
    apple: "/images/LITTLE-BARBERSHOP-LOGO.svg",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Providers>
          <KeepAliveProvider>
            {children}
          </KeepAliveProvider>
        </Providers>
      </body>
    </html>
  );
}
