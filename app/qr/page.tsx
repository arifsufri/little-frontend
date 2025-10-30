'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QRLandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to onboarding after a short delay
    const timer = setTimeout(() => {
      router.push('/client/onboarding');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main 
      className="auth-page select-none"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.8) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.6) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(185, 28, 28, 0.4) 0%, transparent 50%),
          linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #dc2626 50%, #991b1b 75%, #000000 100%)
        `,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }}
    >
      {/* Grain PNG overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/images/Grain%20Overlay.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
          mixBlendMode: "multiply" as const,
        }}
        aria-hidden
      />

      {/* Content */}
      <div 
        style={{ 
          position: "absolute", 
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          zIndex: 10
        }}
      >
        <img 
          src="/images/LITTLE-BARBERSHOP-LOGO.svg" 
          alt="Little Barbershop" 
          style={{ 
            width: "150px",
            height: "auto",
            filter: "brightness(0) invert(1)",
            animation: "spin 2s linear infinite",
            background: "transparent !important",
            border: "none",
            outline: "none",
            mixBlendMode: "screen"
          }} 
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .auth-page {
          min-height: 100vh;
          position: relative;
        }
        
        img {
          background: transparent !important;
        }
        
        svg {
          background: transparent !important;
        }
      `}</style>
    </main>
  );
}
