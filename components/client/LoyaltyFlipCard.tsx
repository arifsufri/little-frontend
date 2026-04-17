'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LoyaltyFlipCardProps {
  progress: number;
}

export default function LoyaltyFlipCard({ progress }: LoyaltyFlipCardProps) {
  const [flipped, setFlipped] = React.useState(false);

  return (
    <Box
      onClick={() => setFlipped((prev) => !prev)}
      sx={{
        width: '100%',
        maxWidth: 520,
        mx: 'auto',
        perspective: 1600,
        cursor: 'pointer',
        borderRadius: 3,
        userSelect: 'none'
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', pt: '62.5%' }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              color: '#fff',
              background:
                'radial-gradient(circle at 15% 20%, rgba(255,200,200,0.34) 0%, rgba(255,200,200,0) 28%), radial-gradient(circle at 86% 24%, rgba(255,130,130,0.24) 0%, rgba(255,130,130,0) 34%), linear-gradient(135deg, #120303 0%, #2f0303 42%, #590909 100%)',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.42)',
              backfaceVisibility: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Typography sx={{ letterSpacing: 2, fontSize: { xs: 12, sm: 14 }, opacity: 0.82 }}>
              LITTLE BARBERSHOP
            </Typography>
            <Box>
              <Typography sx={{ fontSize: { xs: 20, sm: 28 }, fontWeight: 800, lineHeight: 1.1 }}>
                LOYALTY CARD
              </Typography>
              <Typography sx={{ mt: 1, fontSize: { xs: 13, sm: 15 }, opacity: 0.9 }}>
                {progress}/6 haircuts completed
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: 11, sm: 12 }, opacity: 0.75 }}>
              Tap to view reward tracker
            </Typography>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              color: '#fff',
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              background:
                'radial-gradient(circle at 88% 80%, rgba(255,120,120,0.3) 0%, rgba(255,120,120,0) 24%), linear-gradient(130deg, #110202 0%, #280404 46%, #510707 100%)',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.42)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, fontWeight: 700 }}>
              Haircut Progress
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: { xs: 1.25, sm: 1.5 },
                py: { xs: 1, sm: 1.25 }
              }}
            >
              {Array.from({ length: 6 }).map((_, idx) => {
                const filled = idx < progress;
                return (
                  <Box
                    key={idx}
                    sx={{
                      height: { xs: 42, sm: 52 },
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: filled ? '#ef4444' : 'rgba(255,255,255,0.75)',
                      bgcolor: filled ? 'rgba(239,68,68,0.88)' : 'rgba(255,255,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: { xs: 13, sm: 15 }
                    }}
                  >
                    {idx + 1}
                  </Box>
                );
              })}
            </Box>
            <Typography sx={{ fontSize: { xs: 12, sm: 13 }, lineHeight: 1.35, opacity: 0.92 }}>
              Complete 6 haircuts and get <strong>RM10 OFF</strong> on your next eligible visit.
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
