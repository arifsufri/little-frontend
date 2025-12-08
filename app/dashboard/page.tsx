'use client';

import * as React from 'react';
import DashboardLayout from '../../components/dashboard/Layout';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Stack, 
  Avatar, 
  CircularProgress, 
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Paper,
  Divider
} from '@mui/material';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PendingIcon from '@mui/icons-material/PendingActions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import { apiGet } from '../../src/utils/axios';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

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

interface RevenueData {
  date: string;
  revenue: number;
}

interface StaffPerformance {
  name: string;
  appointments: number;
  revenue: number;
}

interface ServiceBreakdown {
  name: string;
  count: number;
  revenue: number;
}

interface PeakHourData {
  hour: string;
  appointments: number;
}

function HeroStatCard({ 
  label, 
  value, 
  icon, 
  loading = false,
  prefix = '',
  gradient,
  subtitle
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  loading?: boolean;
  prefix?: string;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <Card 
      sx={{ 
        background: gradient,
        borderRadius: { xs: 3, sm: 4 },
        overflow: 'hidden',
        position: 'relative',
        height: { xs: 160, sm: 180 },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-8px)' },
          boxShadow: { xs: 'none', sm: '0 20px 40px rgba(139, 69, 19, 0.3)' },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          pointerEvents: 'none'
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: { xs: 1, sm: 1.5 } }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              fontSize: { xs: '0.7rem', sm: '0.875rem' },
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              lineHeight: 1.2
            }}
          >
            {label}
          </Typography>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              width: { xs: 36, sm: 48 },
              height: { xs: 36, sm: 48 },
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { fontSize: { xs: 20, sm: 24 } } 
            })}
          </Avatar>
        </Stack>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', mt: { xs: 0.5, sm: 1 } }}>
          {loading ? (
            <CircularProgress size={32} sx={{ color: 'white', alignSelf: 'flex-start' }} />
          ) : (
            <>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: 'white',
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', sm: '2.5rem' },
                  lineHeight: 1,
                  mb: { xs: 0.25, sm: 0.5 }
                }}
              >
                {prefix}{value}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    fontWeight: 500
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: RecentActivity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <ContentCutIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />;
      case 'client':
        return <PersonIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />;
      default:
        return <StarIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: { xs: 1, sm: 1.5 },
        borderRadius: { xs: 3, sm: 4 },
        border: 'none',
        background: '#ffffff',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-4px)' },
          boxShadow: { xs: '0 2px 12px rgba(0, 0, 0, 0.06)', sm: '0 8px 24px rgba(0, 0, 0, 0.12)' },
        }
      }}
    >
      <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: 'linear-gradient(135deg, #8B4513 0%, #A52A2A 100%)',
            width: { xs: 36, sm: 40 }, 
            height: { xs: 36, sm: 40 },
            boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)'
          }}
        >
          {getActivityIcon(activity.type)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              color: '#2d3748',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            {activity.message}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#718096',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
            <AccessTimeIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />
            {activity.time}
          </Typography>
        </Box>
        {activity.status && (
          <Chip 
            label={activity.status} 
            size="small" 
            sx={{
              bgcolor: activity.status === 'completed' ? 'rgba(139, 69, 19, 0.1)' : 'rgba(165, 42, 42, 0.1)',
              color: activity.status === 'completed' ? '#8B4513' : '#A52A2A',
              fontWeight: 600,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
        )}
      </Stack>
    </Paper>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [stats, setStats] = React.useState<DashboardStats>({
    totalClients: 0,
    appointmentsToday: 0,
    pendingAppointmentsToday: 0,
    totalRevenueToday: 0
  });
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([]);
  const [revenueData, setRevenueData] = React.useState<RevenueData[]>([]);
  const [staffPerformance, setStaffPerformance] = React.useState<StaffPerformance[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = React.useState<ServiceBreakdown[]>([]);
  const [peakHours, setPeakHours] = React.useState<PeakHourData[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const clientsResponse = await apiGet<{ success: boolean; data: any[] }>('/clients');
      const totalClients = clientsResponse.success ? clientsResponse.data.length : 0;

      const appointmentsResponse = await apiGet<{ success: boolean; data: any[] }>('/appointments');
      const staffResponse = await apiGet<{ success: boolean; data: any[] }>('/staff');
      
      if (appointmentsResponse.success) {
        const appointments = appointmentsResponse.data;
        const today = new Date().toDateString();
        
        const appointmentsToday = appointments.length;
        const pendingAppointmentsToday = appointments.filter(apt => 
          new Date(apt.createdAt).toDateString() === today && apt.status === 'pending'
        ).length;

        const totalRevenueToday = appointments
          .filter(apt => 
            apt.status === 'completed' &&
            new Date(apt.updatedAt || apt.createdAt).toDateString() === today
          )
          .reduce((total, apt) => {
            // Calculate appointment price
            let appointmentPrice = apt.finalPrice || apt.package?.price || 0;
            
            // Add product sales if any
            if (apt.productSales && Array.isArray(apt.productSales)) {
              const productTotal = apt.productSales.reduce((sum: number, sale: any) => sum + (sale.totalPrice || 0), 0);
              appointmentPrice += productTotal;
            }
            
            return total + appointmentPrice;
          }, 0);

        setStats({
          totalClients,
          appointmentsToday,
          pendingAppointmentsToday,
          totalRevenueToday
        });

        const activity: RecentActivity[] = appointments
          .slice(0, 6)
          .map((apt, index) => ({
            id: index,
            type: 'appointment' as const,
            message: `${apt.client?.fullName || 'Client'} booked ${apt.package?.name || 'a service'}`,
            time: formatTimeAgo(apt.createdAt),
            status: apt.status
          }));

        setRecentActivity(activity);

        // Revenue trend
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date;
        });

        const revenueTrend = last7Days.map(date => {
          const dateStr = date.toDateString();
          const dayRevenue = appointments
            .filter(apt => 
              apt.status === 'completed' &&
              new Date(apt.appointmentDate || apt.createdAt).toDateString() === dateStr
            )
            .reduce((total, apt) => total + (apt.finalPrice || apt.package?.price || 0), 0);
          
          return {
            date: date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' }),
            revenue: dayRevenue
          };
        });
        setRevenueData(revenueTrend);

        // Staff performance
        if (staffResponse.success) {
          const staffPerf = staffResponse.data
            .map(staff => {
              const staffAppointments = appointments.filter(apt => 
                apt.status === 'completed' && apt.staffId === staff.id
              );
              const staffRevenue = staffAppointments.reduce(
                (total, apt) => total + (apt.finalPrice || apt.package?.price || 0), 
                0
              );
              return {
                name: staff.name,
                appointments: staffAppointments.length,
                revenue: staffRevenue
              };
            })
            .filter(s => s.appointments > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
          setStaffPerformance(staffPerf);
        }

        // Service breakdown
        const serviceMap = new Map<string, { count: number; revenue: number }>();
        appointments
          .filter(apt => apt.status === 'completed')
          .forEach(apt => {
            const serviceName = apt.package?.name || 'Unknown';
            const existing = serviceMap.get(serviceName) || { count: 0, revenue: 0 };
            serviceMap.set(serviceName, {
              count: existing.count + 1,
              revenue: existing.revenue + (apt.finalPrice || apt.package?.price || 0)
            });
          });
        
        const services = Array.from(serviceMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        setServiceBreakdown(services);

        // Peak hours
        const hourMap = new Map<number, number>();
        appointments.forEach(apt => {
          const hour = new Date(apt.appointmentDate || apt.createdAt).getHours();
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        });

        const peakHoursData = Array.from({ length: 12 }, (_, i) => {
          const hour = i + 9;
          return {
            hour: `${hour}:00`,
            appointments: hourMap.get(hour) || 0
          };
        });
        setPeakHours(peakHoursData);
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

  const completionRate = stats.appointmentsToday > 0 
    ? Math.round(((stats.appointmentsToday - stats.pendingAppointmentsToday) / stats.appointmentsToday) * 100)
    : 0;

  return (
    <DashboardLayout>
      {/* Hero Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Box>
          <Typography 
            variant="h3" 
            fontWeight={900} 
            sx={{ 
              fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: { xs: '1.75rem', sm: '3rem' },
              mb: { xs: 0.5, sm: 1 },
              color: '#000000',
              lineHeight: 1.2
            }}
          >
            Dashboard
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#666666',
              fontWeight: 400,
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
              lineHeight: 1.3
            }}
          >
            Welcome back, Boss! Here&apos;s your barbershop overview
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Hero Stats Cards */}
        <Grid item xs={6} sm={6} md={3}>
          <HeroStatCard 
            label="Total Clients" 
            value={stats.totalClients} 
            icon={<GroupIcon />} 
            loading={loading}
            gradient="linear-gradient(135deg, #8B4513 0%, #A0522D 100%)"
            subtitle="Active customers"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <HeroStatCard 
            label="Total Appointments" 
            value={stats.appointmentsToday} 
            icon={<CalendarMonthIcon />} 
            loading={loading}
            gradient="linear-gradient(135deg, #A52A2A 0%, #B22222 100%)"
            subtitle="All bookings"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <HeroStatCard 
            label="Today's Pending" 
            value={stats.pendingAppointmentsToday} 
            icon={<PendingIcon />} 
            loading={loading}
            gradient="linear-gradient(135deg, #CD853F 0%, #D2691E 100%)"
            subtitle={stats.pendingAppointmentsToday > 0 ? "Needs attention" : "All clear"}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <HeroStatCard 
            label="Today's Revenue" 
            value={stats.totalRevenueToday} 
            icon={<AttachMoneyIcon />} 
            loading={loading}
            prefix="RM"
            gradient="linear-gradient(135deg, #800000 0%, #8B0000 100%)"
            subtitle="Today's earnings"
          />
        </Grid>

        {/* Revenue Trend Chart - MOST IMPORTANT */}
        <Grid item xs={12} lg={8}>
          <Card 
            sx={{ 
              borderRadius: { xs: 4, sm: 5 },
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              minHeight: { xs: 320, sm: 400 },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-8px)' },
                boxShadow: { xs: '0 4px 20px rgba(0, 0, 0, 0.08)', sm: '0 12px 40px rgba(0, 0, 0, 0.15)' }
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 }
                  }}
                >
                  <ShowChartIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      color: '#2d3748',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Revenue Trend
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#718096',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Last 7 days performance
                  </Typography>
                </Box>
              </Stack>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#059669' }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 69, 19, 0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#718096"
                      style={{ fontSize: isMobile ? '10px' : '12px' }}
                    />
                    <YAxis 
                      stroke="#718096"
                      style={{ fontSize: isMobile ? '10px' : '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid rgba(139, 69, 19, 0.2)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => [`RM${value}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#059669" 
                      strokeWidth={3}
                      dot={{ fill: '#059669', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Overview */}
        <Grid item xs={12} lg={4}>
          <Card 
            sx={{ 
              borderRadius: { xs: 4, sm: 5 },
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              minHeight: { xs: 320, sm: 400 },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-8px)' },
                boxShadow: { xs: '0 4px 20px rgba(0, 0, 0, 0.08)', sm: '0 12px 40px rgba(0, 0, 0, 0.15)' }
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #8B4513 0%, #A52A2A 100%)',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 }
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      color: '#2d3748',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Performance Metrics
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#718096',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Today&apos;s key indicators
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#4a5568' }}>
                      Completion Rate
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#8B4513' }}>
                      {completionRate}%
                    </Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={completionRate} 
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(139, 69, 19, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #8B4513 0%, #A52A2A 100%)',
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>

                <Divider sx={{ borderColor: 'rgba(139, 69, 19, 0.1)' }} />

                <Box>
                  <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                    Revenue Target Progress
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="h5" fontWeight={700} sx={{ color: '#8B4513' }}>
                      RM{stats.totalRevenueToday}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096' }}>
                      / RM500 target
                    </Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((stats.totalRevenueToday / 500) * 100, 100)} 
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(165, 42, 42, 0.1)',
                      mt: 1,
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #A52A2A 0%, #800000 100%)',
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>

                <Divider sx={{ borderColor: 'rgba(139, 69, 19, 0.1)' }} />

                <Box>
                  <Typography variant="body2" sx={{ color: '#718096', mb: 2 }}>
                    Quick Stats
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: '#4a5568' }}>
                        Average Service Time
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#8B4513' }}>
                        45 mins
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: '#4a5568' }}>
                        Customer Satisfaction
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <StarIcon sx={{ fontSize: 16, color: '#FFD700' }} />
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#8B4513' }}>
                          4.8/5
                        </Typography>
                      </Stack>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: '#4a5568' }}>
                        Next Appointment
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#A52A2A' }}>
                        {stats.pendingAppointmentsToday > 0 
                          ? `${stats.pendingAppointmentsToday} pending`
                          : 'All clear'
                        }
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performing Barbers */}
        <Grid item xs={12} lg={6}>
          <Card 
            sx={{ 
              borderRadius: { xs: 4, sm: 5 },
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              minHeight: { xs: 320, sm: 400 },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-8px)' },
                boxShadow: { xs: '0 4px 20px rgba(0, 0, 0, 0.08)', sm: '0 12px 40px rgba(0, 0, 0, 0.15)' }
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 }
                  }}
                >
                  <BarChartIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      color: '#2d3748',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Top Performing Barbers
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#718096',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    By total revenue generated
                  </Typography>
                </Box>
              </Stack>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#2563eb' }} />
                </Box>
              ) : staffPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={staffPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 69, 19, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#718096"
                      style={{ fontSize: isMobile ? '10px' : '12px' }}
                    />
                    <YAxis 
                      stroke="#718096"
                      style={{ fontSize: isMobile ? '10px' : '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid rgba(139, 69, 19, 0.2)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'revenue') return [`RM${value}`, 'Revenue'];
                        return [value, 'Appointments'];
                      }}
                    />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No staff performance data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Peak Hours Analysis */}
        <Grid item xs={12} lg={6}>
          <Card 
            sx={{ 
              borderRadius: { xs: 4, sm: 5 },
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              minHeight: { xs: 320, sm: 400 },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-8px)' },
                boxShadow: { xs: '0 4px 20px rgba(0, 0, 0, 0.08)', sm: '0 12px 40px rgba(0, 0, 0, 0.15)' }
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 }
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      color: '#2d3748',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Peak Hours
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#718096',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Busiest times of the day
                  </Typography>
                </Box>
              </Stack>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#dc2626' }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 69, 19, 0.1)" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#718096"
                      style={{ fontSize: isMobile ? '10px' : '12px' }}
                    />
                    <YAxis 
                      stroke="#718096"
                      style={{ fontSize: isMobile ? '10px' : '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid rgba(139, 69, 19, 0.2)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => [value, 'Appointments']}
                    />
                    <Bar 
                      dataKey="appointments" 
                      fill="#dc2626" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Popular Services */}
        <Grid item xs={12} lg={6}>
          <Card 
            sx={{ 
              borderRadius: { xs: 4, sm: 5 },
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              minHeight: { xs: 320, sm: 400 },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-8px)' },
                boxShadow: { xs: '0 4px 20px rgba(0, 0, 0, 0.08)', sm: '0 12px 40px rgba(0, 0, 0, 0.15)' }
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 }
                  }}
                >
                  <PieChartIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      color: '#2d3748',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Popular Services
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#718096',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Most booked services
                  </Typography>
                </Box>
              </Stack>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#d97706' }} />
                </Box>
              ) : serviceBreakdown.length > 0 ? (
                <Box>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={serviceBreakdown as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {serviceBreakdown.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={['#8B4513', '#A52A2A', '#CD853F', '#D2691E', '#B8860B'][index % 5]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: '#fff', 
                          border: '1px solid rgba(139, 69, 19, 0.2)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: string, props: any) => [
                          `${value} bookings (RM${props.payload.revenue})`,
                          props.payload.name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {serviceBreakdown.map((service, index) => (
                      <Stack 
                        key={service.name} 
                        direction="row" 
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 2,
                          background: 'rgba(139, 69, 19, 0.03)',
                          border: '1px solid rgba(139, 69, 19, 0.1)'
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%',
                              background: ['#8B4513', '#A52A2A', '#CD853F', '#D2691E', '#B8860B'][index % 5]
                            }} 
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {service.name}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                          <Typography variant="body2" color="text.secondary">
                            {service.count} bookings
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="#059669">
                            RM{service.revenue}
                          </Typography>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No service data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card 
            sx={{ 
              borderRadius: { xs: 4, sm: 5 },
              background: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              minHeight: { xs: 320, sm: 400 },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-8px)' },
                boxShadow: { xs: '0 4px 20px rgba(0, 0, 0, 0.08)', sm: '0 12px 40px rgba(0, 0, 0, 0.15)' }
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #A52A2A 0%, #800000 100%)',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 }
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      color: '#2d3748',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Recent Activity
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#718096',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Latest appointments and bookings
                  </Typography>
                </Box>
              </Stack>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#8B4513' }} />
                </Box>
              ) : recentActivity.length > 0 ? (
                <Box sx={{ 
                  maxHeight: { xs: 240, sm: 320 }, 
                  overflow: 'auto', 
                  pr: { xs: 0.5, sm: 1 },
                  '&::-webkit-scrollbar': {
                    width: { xs: 4, sm: 6 }
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(139, 69, 19, 0.1)',
                    borderRadius: 3
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'linear-gradient(135deg, #8B4513 0%, #A52A2A 100%)',
                    borderRadius: 3
                  }
                }}>
                  {recentActivity.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.02) 0%, rgba(165, 42, 42, 0.02) 100%)',
                    borderRadius: 3,
                    border: '1px dashed rgba(139, 69, 19, 0.2)'
                  }}
                >
                  <ContentCutIcon sx={{ fontSize: 48, color: 'rgba(139, 69, 19, 0.3)', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#4a5568', mb: 1 }}>
                    No Recent Activity
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    Your recent appointments and bookings will appear here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
