'use client';

import * as React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem, ListItemText, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from 'next/navigation';

export default function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [user, setUser] = React.useState<{ name?: string; email?: string; avatar?: string; role?: string } | null>(null);

  const open = Boolean(anchorEl);
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    handleClose();
    router.replace('/login');
  };

  const handleSettings = () => {
    handleClose();
    router.push('/dashboard/settings');
  };

  const fetchUserProfile = React.useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const response = await res.json();
        if (response.success) {
          const userData = response.data;
          const avatarUrl = userData.avatar ? `${baseUrl}${userData.avatar}` : '';
          setUser({
            name: userData.name,
            email: userData.email,
            avatar: avatarUrl,
            role: userData.role
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Listen for profile updates
  React.useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchUserProfile]);

  const initials = (user?.name || 'User')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: '#ffffffcc',
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

        <IconButton onClick={handleOpen} aria-label="account menu" aria-haspopup="true" aria-controls={open ? 'account-menu' : undefined} aria-expanded={open ? 'true' : undefined}>
          <Avatar 
            src={user?.avatar} 
            sx={{ bgcolor: '#111827', width: 34, height: 34, fontSize: 14 }}
          >
            {initials}
          </Avatar>
        </IconButton>
        <Menu id="account-menu" anchorEl={anchorEl} open={open} onClose={handleClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <MenuItem disableRipple sx={{ cursor: 'default' }}>
            <ListItemText
              primary={
                <Typography variant="body1" fontWeight={700}>
                  {user?.name || 'User'}
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {user?.role || 'Staff'}
                </Typography>
              }
            />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSettings}>Setting</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
