'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer,
  Box,
  List,
  IconButton,
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
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

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

export default function SidebarPermanent({
  width,
  collapsed,
  onToggleCollapsed,
}: {
  width: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
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
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        flexShrink: 0,
        transition: 'width 220ms ease',
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #fff7f7 0%, #fff 35%, #f8fafc 100%)',
          borderRight: '1px solid #e5e7eb',
          top: 0,
          height: '100%',
          overflowX: 'hidden',
          transition: 'width 220ms ease',
        },
      }}
    >
      <Box sx={{ p: 1, pt: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src="/images/banner.jpg" alt="Sidebar banner" sx={{ width: '100%', borderRadius: 1, display: 'block', minWidth: 0 }} />
          <IconButton
            onClick={onToggleCollapsed}
            size="small"
            sx={{
              flexShrink: 0,
              display: { xs: 'none', md: 'inline-flex' },
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: '#fee2e2', borderColor: '#fecaca', color: '#b91c1c' },
            }}
            aria-label="toggle sidebar"
          >
            {collapsed ? <MenuRoundedIcon fontSize="small" /> : <MenuOpenRoundedIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ overflow: 'auto', flex: 1 }}>
        <List sx={{ px: 1, py: 1 }}>
          {navItems.filter((i) => canSee(i.href)).map((item, index, arr) => (
            <React.Fragment key={item.href}>
              <ListItemButton
                selected={Boolean(isActive(item.href))}
                onClick={() => router.push(item.href)}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.35,
                  py: 1,
                  justifyContent: collapsed ? 'center' : 'initial',
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
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 36,
                    mr: collapsed ? 0 : 0.5,
                    color: isActive(item.href) ? '#dc2626' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItemButton>
              {index < arr.length - 1 && arr[index + 1].group !== item.group && (
                <Divider sx={{ my: 0.6, mx: 1.2 }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
      <Divider sx={{ mx: 2, my: 1 }} />
      <List sx={{ px: 1, pb: 1 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 1, color: 'error.main', justifyContent: collapsed ? 'center' : 'initial' }}
        >
          <ListItemIcon sx={{ color: 'error.main', minWidth: collapsed ? 0 : 36, mr: collapsed ? 0 : 0.5 }}>
            <LogoutIcon />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Log out" />}
        </ListItemButton>
      </List>
    </Drawer>
  );
}

