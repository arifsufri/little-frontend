'use client';

import * as React from 'react';
import { Button, ButtonProps } from '@mui/material';

type GradientVariant = 'pink' | 'blue' | 'teal' | 'red' | 'green';

type GradientButtonProps = Omit<ButtonProps, 'variant'> & {
  variant?: GradientVariant;
  animated?: boolean;
};

const variants: Record<GradientVariant, { bg: string; hover: string; textColor?: string }> = {
  pink: {
    bg: 'linear-gradient(90deg,#ff7ac3,#ff3ea5)',
    hover: 'linear-gradient(90deg,#ff6ab9,#ff2d98)',
  },
  blue: {
    bg: 'linear-gradient(90deg,#5b7cfa,#3575ff)',
    hover: 'linear-gradient(90deg,#4b6df0,#2b69ff)',
  },
  teal: {
    bg: 'linear-gradient(90deg,#18ead7,#12d6c3)',
    hover: 'linear-gradient(90deg,#14dccb,#0fcbb9)',
  },
  red: {
    bg: 'linear-gradient(90deg,#7f1d1d,#991b1b,#b91c1c,#7f1d1d)',
    hover: 'linear-gradient(90deg,#6b1515,#891616,#a61717,#6b1515)',
    textColor: '#fff',
  },
  green: {
    bg: 'linear-gradient(90deg,#006400,#008000,#228B22,#006400)',
    hover: 'linear-gradient(90deg,#004d00,#006600,#1e7d1e,#004d00)',
    textColor: '#fff',
  },
};

export default function GradientButton({ variant = 'blue', animated = false, sx, children, ...props }: GradientButtonProps) {
  const colors = variants[variant];
  return (
    <Button
      {...props}
      sx={{
        borderRadius: 9999,
        px: 3,
        py: 1.2,
        color: colors.textColor || '#fff',
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: 'uppercase',
        background: colors.bg,
        backgroundSize: animated ? '300% 300%' : undefined,
        animation: animated ? 'gbgshift 4s linear infinite' : undefined,
        boxShadow: '0 8px 0 #000000, 0 16px 32px rgba(0,0,0,0.45)',
        '&:hover': {
          background: colors.hover,
          backgroundSize: animated ? '300% 300%' : undefined,
          boxShadow: '0 8px 0 #000000, 0 20px 36px rgba(0,0,0,0.50)',
        },
        '&:active': {
          transform: 'translateY(1px)',
          boxShadow: '0 7px 0 #000000, 0 12px 24px rgba(0,0,0,0.40)',
        },
        '@keyframes gbgshift': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}
