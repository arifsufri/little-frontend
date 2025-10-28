'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { apiGet } from '../src/utils/axios';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await apiGet<{ success: boolean; data: { role: string } }>('/auth/me');
        if (response.success) {
          setUserRole(response.data.role);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', p: 3 }}>
        <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} color="error.main" sx={{ mb: 2 }}>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              You don&apos;t have permission to access this page.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Required role: {allowedRoles.join(' or ')}<br/>
              Your role: {userRole}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}
