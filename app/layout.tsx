// import "./styles.css"; // Temporarily disabled to fix webpack error
import type { ReactNode } from "react";
import Providers from "./providers";
import KeepAliveProvider from "./providers/KeepAliveProvider";

export const metadata = {
  title: "Little Barbershop",
  description: "Professional barbershop management system",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/LITTLE-BARBERSHOP-LOGO.svg", type: "image/svg+xml" },
      { url: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/images/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    shortcut: "/images/icon-192.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Little Barbershop"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: "website",
    siteName: "Little Barbershop",
    title: "Little Barbershop",
    description: "Professional barbershop management system"
  },
  robots: {
    index: true,
    follow: true
  }
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
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
