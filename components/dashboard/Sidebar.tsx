'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserRole } from '../../hooks/useUserRole';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  ListSubheader,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBagOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';

export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const defaultItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Appointments', href: '/dashboard/appointments', icon: <CalendarMonthIcon /> },
  { label: 'Clients', href: '/dashboard/clients', icon: <PeopleIcon /> },
  { label: 'Staff', href: '/dashboard/staff', icon: <GroupIcon /> },
  { label: 'Products', href: '/dashboard/products', icon: <ShoppingBagIcon /> },
  { label: 'Financial Reports', href: '/dashboard/financial', icon: <AssessmentIcon /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <SettingsIcon /> },
];

export default function Sidebar({
  open,
  onClose,
  items = defaultItems,
  width = 260,
}: {
  open: boolean;
  onClose: () => void;
  items?: NavItem[];
  width?: number;
}) {
  const pathname = usePathname();
  const { userRole } = useUserRole();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Filter items based on user role
  const getVisibleItems = () => {
    return items.filter(item => {
      // Boss can see everything
      if (userRole === 'Boss') {
        return true;
      }
      
      // Staff can see everything except Staff page
      if (userRole === 'Staff') {
        return item.href !== '/dashboard/staff';
      }
      
      // Clients can only see Overview (if needed in future)
      return false;
    });
  };

  const visibleItems = getVisibleItems();

  const content = (
    <Box sx={{ width }} role="presentation" onClick={onClose}>
      <Box sx={{ width: '100%', pt: 2, pl: 2, pr: 2, mb: 1.5 }}>
        <Box component="img" src="/images/banner.jpg" alt="Sidebar banner" sx={{ width: '100%', display: 'block', borderRadius: 2, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }} />
      </Box>
      <Divider />
      <List
        subheader={<ListSubheader component="div" sx={{ bgcolor: 'transparent', color: 'text.secondary', fontWeight: 700, fontFamily: 'Manrope, Inter, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Navigation</ListSubheader>}
      >
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          return (
            <ListItemButton 
              key={item.href} 
              component={NextLink} 
              href={item.href}
              sx={{
                backgroundColor: active ? '#670e10' : 'transparent',
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: active ? '#91734a' : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ color: active ? '#ffffff' : 'text.secondary' }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primaryTypographyProps={{ 
                  sx: { 
                    fontFamily: 'Manrope, Inter, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
                    color: active ? '#ffffff' : 'inherit',
                    fontWeight: active ? 600 : 400,
                  } 
                }} 
                primary={item.label} 
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ display: { xs: 'block', md: 'none' } }}
    >
      {content}
    </Drawer>
  );
}
