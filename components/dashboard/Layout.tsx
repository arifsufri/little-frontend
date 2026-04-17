'use client';

import * as React from 'react';
import { Box, Toolbar } from '@mui/material';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import SidebarPermanent from './SidebarPermanent';

const SIDEBAR_COLLAPSED_KEY = 'littleBarbershop.dashboardSidebarCollapsed';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [openMobile, setOpenMobile] = React.useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapsed = React.useCallback(() => {
    setDesktopSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  }, []);

  const drawerWidth = desktopSidebarCollapsed ? 84 : 240;

  return (
    <Box sx={{ 
      display: 'flex',
      width: '100%',
      maxWidth: '100vw',
      minWidth: 0,
      overflow: 'hidden',
      overflowX: 'hidden'
    }}>
      <AppHeader
        onOpenSidebar={() => setOpenMobile(true)}
        drawerWidth={drawerWidth}
      />
      <Sidebar open={openMobile} onClose={() => setOpenMobile(false)} />
      <SidebarPermanent
        width={drawerWidth}
        collapsed={desktopSidebarCollapsed}
        onToggleCollapsed={handleToggleCollapsed}
      />

      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: { xs: 2, md: 3 }, 
        ml: { md: `${drawerWidth}px` }, 
        transition: 'margin-left 220ms ease',
        backgroundColor: '#f8f9fa', 
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        minWidth: 0,
        overflow: 'hidden',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
