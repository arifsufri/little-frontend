'use client';

import * as React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

export default function ProductCard({
  title,
  price,
  imageSrc,
  imageAlt,
  onClick,
}: {
  title: string;
  price: string;
  imageSrc?: string;
  imageAlt?: string;
  onClick?: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        borderRadius: 3,
        border: '1px solid #d1d5db',
        boxShadow: '0 8px 0 #0000000d, 0 12px 24px rgba(0,0,0,0.10)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 150ms ease, transform 150ms ease, outline-color 150ms ease',
        '&:hover': onClick ? { borderColor: '#ef4444' } : undefined,
        '&:focus-visible': onClick ? { outline: '2px solid #ef4444', outlineOffset: 2 } : undefined,
        '&:active': onClick ? { transform: 'translateY(1px)' } : undefined,
      }}
    >
      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 'none',
          backgroundColor: '#fff',
        }}
      >
        <Box sx={{ width: '100%', height: { xs: 120, sm: 160 }, position: 'relative', backgroundColor: '#f3f4f6' }}>
          {imageSrc ? (
            <Box component="img" src={imageSrc} alt={imageAlt || title} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
              No image
            </Box>
          )}
        </Box>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: { xs: 1.25, sm: 2 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 18 } }}>
            {title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 18 } }}>
            {price}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
