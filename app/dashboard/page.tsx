'use client';

import * as React from 'react';
import DashboardLayout from '../../components/dashboard/Layout';
import { Grid, Card, CardContent, Typography, Box, Stack, Avatar, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Chip } from '@mui/material';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PendingIcon from '@mui/icons-material/PendingActions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import { apiGet } from '../../src/utils/axios';

interface DashboardStats {
  totalClients: number;
  appointmentsToday: number;
  pendingAppointmentsToday: number;
  totalRevenueToday: number;
}

interface RecentActivity {
  id: number;
  type: 'appointment' | 'client' | 'revenue';
  message: string;
  time: string;
  status?: string;
}

function StatCard({ 
  label, 
  value, 
  icon, 
  loading = false,
  prefix = '',
  color = '#111827'
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  loading?: boolean;
  prefix?: string;
  color?: string;
}) {
  return (
    <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {label}
            </Typography>
            {loading ? (
              <CircularProgress size={24} sx={{ mt: 1 }} />
            ) : (
              <Typography variant="h4" fontWeight={700} color={color}>
                {prefix}{value}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb' }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalClients: 0,
    appointmentsToday: 0,
    pendingAppointmentsToday: 0,
    totalRevenueToday: 0
  });
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch clients
      const clientsResponse = await apiGet<{ success: boolean; data: any[] }>('/clients');
      const totalClients = clientsResponse.success ? clientsResponse.data.length : 0;

      // Fetch appointments
      const appointmentsResponse = await apiGet<{ success: boolean; data: any[] }>('/appointments');
      
      if (appointmentsResponse.success) {
        const appointments = appointmentsResponse.data;
        const today = new Date().toDateString();
        
        // Count all appointments (total count, not just today)
        const appointmentsToday = appointments.length;

        // Count pending appointments today
        const pendingAppointmentsToday = appointments.filter(apt => 
          new Date(apt.createdAt).toDateString() === today && apt.status === 'pending'
        ).length;

        // Calculate total revenue today (completed appointments)
        const totalRevenueToday = appointments
          .filter(apt => 
            apt.status === 'completed' &&
            new Date(apt.updatedAt || apt.createdAt).toDateString() === today
          )
          .reduce((total, apt) => total + (apt.finalPrice || apt.package?.price || 0), 0);

        setStats({
          totalClients,
          appointmentsToday,
          pendingAppointmentsToday,
          totalRevenueToday
        });

        // Generate recent activity
        const activity: RecentActivity[] = appointments
          .slice(0, 5)
          .map((apt, index) => ({
            id: index,
            type: 'appointment' as const,
            message: `${apt.client?.fullName || 'Client'} booked ${apt.package?.name || 'a service'}`,
            time: formatTimeAgo(apt.createdAt),
            status: apt.status
          }));

        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif' }}>
            Dashboard
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            label="Total Clients" 
            value={stats.totalClients} 
            icon={<GroupIcon />} 
            loading={loading}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            label="Total Appointments" 
            value={stats.appointmentsToday} 
            icon={<CalendarMonthIcon />} 
            loading={loading}
            color="#059669"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            label="Today's Pending" 
            value={stats.pendingAppointmentsToday} 
            icon={<PendingIcon />} 
            loading={loading}
            color="#d97706"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            label="Total Revenue Today" 
            value={stats.totalRevenueToday} 
            icon={<AttachMoneyIcon />} 
            loading={loading}
            prefix="RM"
            color="#dc2626"
          />
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Recent Activity
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recentActivity.length > 0 ? (
                <List>
                  {recentActivity.map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      {activity.status && (
                        <Chip 
                          label={activity.status} 
                          size="small" 
                          color={getStatusColor(activity.status) as any}
                          variant="outlined"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No recent activity to display.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Quick Stats
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Today&apos;s Revenue Target
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    RM{Math.max(500, stats.totalRevenueToday)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {stats.appointmentsToday > 0 
                      ? Math.round(((stats.appointmentsToday - stats.pendingAppointmentsToday) / stats.appointmentsToday) * 100)
                      : 0
                    }%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Next Appointment
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {stats.pendingAppointmentsToday > 0 
                      ? `${stats.pendingAppointmentsToday} pending`
                      : 'No pending appointments'
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
