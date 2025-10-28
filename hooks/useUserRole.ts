'use client';

import * as React from 'react';
import { apiGet } from '../src/utils/axios';

export function useUserRole() {
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiGet<{ success: boolean; data: { role: string } }>('/auth/me');
        if (response.success) {
          setUserRole(response.data.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { userRole, loading };
}
