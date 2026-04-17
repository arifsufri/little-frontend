'use client';

import * as React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { motion } from 'framer-motion';

export default function AppHeader({
  onOpenSidebar,
  drawerWidth,
}: {
  onOpenSidebar: () => void;
  drawerWidth: number;
}) {
  const [userName, setUserName] = React.useState<string | null>(null);

  const fetchUserProfile = React.useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const response = await res.json();
        if (response.success && response.data?.name) {
          setUserName(response.data.name);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  React.useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchUserProfile]);

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{
        background:
          'linear-gradient(120deg, rgba(255,255,255,0.88), rgba(254,242,242,0.9) 40%, rgba(239,246,255,0.84))',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.95)',
        ml: { md: `${drawerWidth}px` },
        width: { md: `calc(100% - ${drawerWidth}px)` },
        transition: 'margin-left 220ms ease, width 220ms ease',
        overflow: 'hidden',
      }}
    >
      <Box
        component={motion.div}
        initial={{ x: '-12%' }}
        animate={{ x: ['-12%', '12%', '-12%'] }}
        transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity }}
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.18), rgba(239, 68, 68, 0.14), rgba(59, 130, 246, 0.06), transparent)',
          pointerEvents: 'none',
        }}
      />
      <Toolbar>
        <IconButton onClick={onOpenSidebar} sx={{ display: { md: 'none' }, mr: 1 }} edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />

        <Box
          component={motion.div}
          whileHover={{ y: -1.5, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          sx={{
            maxWidth: { xs: '52vw', sm: 240, md: 320 },
            textAlign: 'right',
            px: 1.2,
            py: 0.45,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'rgba(203, 213, 225, 0.7)',
            bgcolor: 'rgba(255,255,255,0.78)',
            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            noWrap
            component="span"
            sx={{
              color: '#111827',
            }}
          >
            {userName ?? ''}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
