'use client';

import * as React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export default function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
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
        backgroundColor: '#f8f9facc',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <Toolbar>
        <IconButton onClick={onOpenSidebar} sx={{ display: { md: 'none' }, mr: 1 }} edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif' }}>
          Little Barbershop
        </Typography>
        <Box sx={{ flexGrow: 1 }} />

        <Typography
          variant="subtitle1"
          fontWeight={700}
          noWrap
          component="span"
          sx={{
            maxWidth: { xs: '42vw', sm: 220, md: 320 },
            color: 'text.primary',
            textAlign: 'right',
          }}
        >
          {userName ?? ''}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
