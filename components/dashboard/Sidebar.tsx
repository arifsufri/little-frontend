'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import ContactPhoneRoundedIcon from '@mui/icons-material/ContactPhoneRounded';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  group: number;
};

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: <DashboardRoundedIcon />, group: 1 },
  { label: 'Appointments', href: '/dashboard/appointments', icon: <EventNoteRoundedIcon />, group: 2 },
  { label: 'Clients', href: '/dashboard/clients', icon: <PeopleAltRoundedIcon />, group: 2 },
  { label: 'Staff', href: '/dashboard/staff', icon: <GroupsRoundedIcon />, group: 3 },
  { label: 'Products', href: '/dashboard/products', icon: <Inventory2RoundedIcon />, group: 3 },
  { label: 'Sales', href: '/dashboard/sales', icon: <PointOfSaleRoundedIcon />, group: 3 },
  { label: 'Financial Reports', href: '/dashboard/financial', icon: <InsightsRoundedIcon />, group: 4 },
  { label: 'Profit & Loss', href: '/dashboard/profit-loss', icon: <TrendingUpRoundedIcon />, group: 4 },
  { label: 'Audit', href: '/dashboard/audit', icon: <RuleRoundedIcon />, group: 4 },
  { label: 'Landing Leads', href: '/dashboard/landing-leads', icon: <ContactPhoneRoundedIcon />, group: 4 },
  { label: 'Settings', href: '/dashboard/settings', icon: <SettingsIcon />, group: 5 },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    const value = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    setRole(value);
  }, []);

  const canSee = (href: string) => {
    if (role === 'Boss') return true;
    if (role === 'Staff') return !['/dashboard/staff', '/dashboard/audit', '/dashboard/profit-loss'].includes(href);
    return true;
  };

  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname?.startsWith(href));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #fff7f7 0%, #fff 35%, #f8fafc 100%)',
        },
      }}
    >
      <Box sx={{ p: 1.5, pt: 1 }}>
        <Box component="img" src="/images/banner.jpg" alt="Sidebar banner" sx={{ width: '100%', borderRadius: 1, display: 'block' }} />
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        {navItems.filter((i) => canSee(i.href)).map((item, index, arr) => (
          <React.Fragment key={item.href}>
            <ListItemButton
              selected={Boolean(isActive(item.href))}
              onClick={() => {
                router.push(item.href);
                onClose();
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.35,
                py: 1,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 160ms ease',
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                  transform: 'translateX(2px)',
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(239, 68, 68, 0.14)',
                  color: '#b91c1c',
                  boxShadow: '0 8px 20px rgba(220, 38, 38, 0.14)',
                },
                '&.Mui-selected::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 7,
                  bottom: 7,
                  width: 4,
                  borderRadius: 4,
                  background: 'linear-gradient(180deg, #ef4444, #b91c1c)',
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.18)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive(item.href) ? '#dc2626' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
            {index < arr.length - 1 && arr[index + 1].group !== item.group && (
              <Divider sx={{ my: 0.6, mx: 1.2 }} />
            )}
          </React.Fragment>
        ))}
      </List>
      <Divider sx={{ mx: 2, my: 1 }} />
      <List sx={{ px: 1 }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Log out" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}

