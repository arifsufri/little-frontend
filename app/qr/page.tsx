'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

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

      {/* Loading UI */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          gap: 3
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{
            color: '#fff',
            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))'
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            fontWeight: 500,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            letterSpacing: '0.5px'
          }}
        >
          Loading...
        </Typography>
      </Box>

      <style jsx>{`
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
      `}</style>
    </main>
  );
}
