'use client';

import * as React from 'react';
import { Box, Toolbar } from '@mui/material';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import SidebarPermanent from './SidebarPermanent';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [openMobile, setOpenMobile] = React.useState(false);
  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppHeader onOpenSidebar={() => setOpenMobile(true)} />
      <Sidebar open={openMobile} onClose={() => setOpenMobile(false)} />
      <SidebarPermanent width={drawerWidth} />

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, ml: { md: `${drawerWidth}px` }, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
