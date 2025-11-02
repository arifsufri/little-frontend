'use client';

import * as React from 'react';
import DashboardLayout from '../../../components/dashboard/Layout';
import { useUserRole } from '../../../hooks/useUserRole';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GroupIcon from '@mui/icons-material/Group';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { apiGet, apiPost, apiDelete } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';
import { useFinancialData } from '../../../hooks/useFinancialData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FinancialOverview {
  totalRevenue: number;
  totalCommissionPaid: number;
  totalExpenses: number;
  netProfit: number;
  totalCustomers: number;
}

interface BarberPerformance {
  id: number;
  name: string;
  customerCount: number;
  totalSales: number;
  commissionPaid: number;
  commissionRate: number;
  appointmentCount: number;
}

interface ServiceBreakdown {
  name: string;
  count: number;
  totalRevenue: number;
}

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface FinancialData {
  overview: FinancialOverview;
  barberPerformance: BarberPerformance[];
  serviceBreakdown: ServiceBreakdown[];
  expenses: Expense[];
}

interface StaffFinancialData {
  summary: {
    totalCustomers: number;
    totalEarnings: number;
    commissionRate: number;
    totalServices: number;
  };
  serviceBreakdown: {
    name: string;
    count: number;
    totalRevenue: number;
    barberShare: number;
  }[];
  earningsHistory: {
    date: string;
    customers: number;
    totalEarnings: number;
  }[];
  recentAppointments: {
    id: number;
    date: string;
    client: string;
    service: string;
    totalPrice: number;
    earnings: number;
  }[];
}

// Modern Financial Card Component
function FinancialCard({ 
  title, 
  value, 
  icon, 
  color, 
  bgColor, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subtitle?: string;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card 
      sx={{ 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 2, sm: 3, md: 4 },
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: { xs: 120, sm: 140, md: 160 },
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-4px)' },
          boxShadow: { xs: '0 4px 20px rgba(0, 0, 0, 0.08)', sm: '0 12px 40px rgba(0, 0, 0, 0.15)' },
          '& .card-icon': {
            transform: 'scale(1.1)',
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
        }
      }}
    >
      <CardContent sx={{ 
        p: { xs: 1.5, sm: 2.5, md: 3 }, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                lineHeight: 1.2,
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.disabled',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: 'block'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Box 
            className="card-icon"
            sx={{ 
              width: { xs: 40, sm: 48, md: 56 },
              height: { xs: 40, sm: 48, md: 56 },
              borderRadius: { xs: '12px', sm: '14px', md: '16px' },
              background: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
              boxShadow: `0 8px 24px ${color}20`
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { 
                fontSize: { xs: 20, sm: 24, md: 28 }, 
                color: color 
              } 
            })}
          </Box>
        </Box>

        {/* Value */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' },
              lineHeight: 1,
              color: 'text.primary',
              letterSpacing: '-0.02em'
            }}
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function FinancialPage() {
  const { userRole } = useUserRole();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { financialData: hookFinancialData, loading: hookLoading, lastUpdated, refreshFinancialData } = useFinancialData();
  
  const [tabValue, setTabValue] = React.useState(0);
  const [financialData, setFinancialData] = React.useState<FinancialData | null>(null);
  const [staffData, setStaffData] = React.useState<StaffFinancialData | null>(null);
  const [todaysAppointments, setTodaysAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dateRange, setDateRange] = React.useState(() => {
    // Initialize with Malaysia timezone
    const malaysiaToday = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
    const startOfMonth = new Date(malaysiaToday.getFullYear(), malaysiaToday.getMonth(), 1);
    const startOfMonthMalaysia = new Date(startOfMonth.toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
    
    return {
      startDate: startOfMonthMalaysia.toISOString().split('T')[0],
      endDate: malaysiaToday.toISOString().split('T')[0]
    };
  });
  const [dateFilter, setDateFilter] = React.useState('current_month');
  
  // Expense management state
  const [expenseDialogOpen, setExpenseDialogOpen] = React.useState(false);
  const [newExpense, setNewExpense] = React.useState({
    category: '',
    description: '',
    amount: '',
    date: new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"})).toISOString().split('T')[0]
  });
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [closeDailyOpen, setCloseDailyOpen] = React.useState(false);
  const [isClosingDaily, setIsClosingDaily] = React.useState(false);
  const [monthlyTarget, setMonthlyTarget] = React.useState(() => {
    // Load monthly target from localStorage or default to 5000
    try {
      const stored = localStorage.getItem('monthlyTarget');
      return stored ? parseFloat(stored) : 5000;
    } catch {
      return 5000;
    }
  });
  const [targetDialogOpen, setTargetDialogOpen] = React.useState(false);
  const [newTarget, setNewTarget] = React.useState('');
  
  // Boss-specific state
  const [bossCloseDailyOpen, setBossCloseDailyOpen] = React.useState(false);
  const [isBossClosingDaily, setIsBossClosingDaily] = React.useState(false);
  const [resetMonthlyOpen, setResetMonthlyOpen] = React.useState(false);
  const [isResettingMonthly, setIsResettingMonthly] = React.useState(false);

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Get current date in Malaysia timezone
  const getMalaysiaDate = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
  };

  // Get today's date string in Malaysia timezone (YYYY-MM-DD format)
  const getTodayMalaysiaString = () => {
    const malaysiaDate = getMalaysiaDate();
    return malaysiaDate.toISOString().split('T')[0];
  };

  // Handle preset date filter changes
  const handleDateFilterChange = (filterType: string) => {
    setDateFilter(filterType);
    const today = getMalaysiaDate();
    let startDate: Date;
    let endDate: Date = new Date(today);

    switch (filterType) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'yesterday':
        startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'this_week':
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
        startDate = new Date(today.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
        endDate = new Date(today);
        break;
      case 'last_week':
        const lastWeekEnd = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        const lastWeekStart = new Date(lastWeekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate = lastWeekStart;
        endDate = lastWeekEnd;
        break;
      case 'current_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last_3_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        endDate = new Date(today);
        break;
      case 'this_year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
      case 'custom':
        // Don't change dates for custom filter
        return;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
    }

    // Convert to Malaysia timezone and format as YYYY-MM-DD
    const formatMalaysiaDate = (date: Date) => {
      const malaysiaDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
      return malaysiaDate.toISOString().split('T')[0];
    };

    setDateRange({
      startDate: formatMalaysiaDate(startDate),
      endDate: formatMalaysiaDate(endDate)
    });
  };

  const handleCloseDailyAccount = async () => {
    setIsClosingDaily(true);
    try {
      const today = getTodayMalaysiaString();
      const todayData = staffData?.earningsHistory.find(day => day.date === today);
      
      if (!todayData || todayData.totalEarnings === 0) {
        showNotification('No earnings to close for today', 'warning');
        return;
      }

      // Store the earnings before reset for notification
      const closedEarnings = todayData.totalEarnings;
      const closedCustomers = todayData.customers;

      // Here you would typically call an API to close the daily account
      // For now, we'll simulate the action and use localStorage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store the closed day in localStorage
      addClosedDay(today);
      
      // Store the closed earnings data for historical reference
      try {
        const closedEarningsData = {
          date: today,
          earnings: closedEarnings,
          customers: closedCustomers,
          timestamp: new Date().toISOString()
        };
        
        const existingClosed = localStorage.getItem('closedEarningsHistory');
        const closedHistory = existingClosed ? JSON.parse(existingClosed) : [];
        closedHistory.push(closedEarningsData);
        localStorage.setItem('closedEarningsHistory', JSON.stringify(closedHistory));
      } catch (error) {
        console.error('Failed to save closed earnings history:', error);
      }
      
      showNotification(
        `Daily account closed! Finalized earnings: ${formatCurrency(closedEarnings)} from ${closedCustomers} customers. Daily counter reset for tomorrow.`,
        'success'
      );
      
      setCloseDailyOpen(false);
      // Refresh the financial data to reflect the closed state
      fetchFinancialData();
    } catch (error) {
      showNotification('Failed to close daily account. Please try again.', 'error');
    } finally {
      setIsClosingDaily(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleUpdateTarget = () => {
    const targetAmount = parseFloat(newTarget);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      showNotification('Please enter a valid target amount', 'error');
      return;
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('monthlyTarget', targetAmount.toString());
    } catch (error) {
      console.error('Failed to save monthly target:', error);
    }
    
    setMonthlyTarget(targetAmount);
    setTargetDialogOpen(false);
    setNewTarget('');
    showNotification(`Monthly target updated to ${formatCurrency(targetAmount)}`, 'success');
  };

  // localStorage helpers for daily closures
  const getClosedDays = (): string[] => {
    try {
      const stored = localStorage.getItem('closedDailyAccounts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addClosedDay = (date: string) => {
    try {
      const closedDays = getClosedDays();
      if (!closedDays.includes(date)) {
        closedDays.push(date);
        localStorage.setItem('closedDailyAccounts', JSON.stringify(closedDays));
      }
    } catch (error) {
      console.error('Failed to save closed day:', error);
    }
  };

  const isDateClosed = (date: string): boolean => {
    return getClosedDays().includes(date);
  };

  // Helper function to get current earnings for a date (0 if closed)
  const getCurrentEarnings = (date: string, originalEarnings: number): number => {
    return isDateClosed(date) ? 0 : originalEarnings;
  };

  const getCurrentCustomers = (date: string, originalCustomers: number): number => {
    return isDateClosed(date) ? 0 : originalCustomers;
  };

  // Boss-specific localStorage helpers
  const getBossClosedDays = (): string[] => {
    try {
      const stored = localStorage.getItem('bossClosedDailyAccounts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addBossClosedDay = (date: string) => {
    try {
      const closedDays = getBossClosedDays();
      if (!closedDays.includes(date)) {
        closedDays.push(date);
        localStorage.setItem('bossClosedDailyAccounts', JSON.stringify(closedDays));
      }
    } catch (error) {
      console.error('Failed to save boss closed day:', error);
    }
  };

  const isBossDateClosed = (date: string): boolean => {
    return getBossClosedDays().includes(date);
  };

  const getBossCurrentRevenue = (date: string, originalRevenue: number): number => {
    return isBossDateClosed(date) ? 0 : originalRevenue;
  };

  const getBossCurrentCustomers = (date: string, originalCustomers: number): number => {
    return isBossDateClosed(date) ? 0 : originalCustomers;
  };

  const getBossCurrentExpenses = (date: string, originalExpenses: number): number => {
    return isBossDateClosed(date) ? 0 : originalExpenses;
  };

  // Boss close daily account handler
  const handleBossCloseDailyAccount = async () => {
    setIsBossClosingDaily(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Add today to closed days
      addBossClosedDay(today);
      
      // Show success notification
      showNotification('Daily business account closed successfully!', 'success');
      
      // Close the modal
      setBossCloseDailyOpen(false);
      
      // Refresh financial data to reflect changes
      fetchFinancialData();
    } catch (error) {
      showNotification('Failed to close daily business account. Please try again.', 'error');
    } finally {
      setIsBossClosingDaily(false);
    }
  };

  // Reset monthly summary handler
  const handleResetMonthlySummary = async () => {
    setIsResettingMonthly(true);
    try {
      const response = await apiPost('/financial/reset-monthly', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }) as any;
      
      if (response.success) {
        // Show success notification
        showNotification('Monthly summary has been reset successfully!', 'success');
        
        // Close the modal
        setResetMonthlyOpen(false);
        
        // Refresh financial data to reflect changes
        fetchFinancialData();
      } else {
        showNotification(response.message || 'Failed to reset monthly summary', 'error');
      }
    } catch (error: any) {
      console.error('Error resetting monthly summary:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reset monthly summary. Please try again.';
      showNotification(errorMessage, 'error');
    } finally {
      setIsResettingMonthly(false);
    }
  };

  const fetchTodaysAppointments = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/appointments');
      
      // Use the same logic as appointments page for "today" filter
      const today = new Date();
      const filterDate = new Date(today);
      filterDate.setHours(0, 0, 0, 0);
      const todayEnd = new Date(filterDate);
      todayEnd.setHours(23, 59, 59, 999);
      
      const todaysCompleted = response.data.filter(apt => {
        if (apt.status !== 'completed') return false;
        if (!apt.appointmentDate) return false;
        
        const appointmentDate = new Date(apt.appointmentDate);
        return appointmentDate >= filterDate && appointmentDate <= todayEnd;
      });
      
      setTodaysAppointments(todaysCompleted);
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      setTodaysAppointments([]);
    }
  };

  // Calculate actual today's revenue from completed appointments
  const calculateTodaysRevenue = () => {
    const today = getTodayMalaysiaString();
    const actualRevenue = todaysAppointments.reduce((sum, apt) => sum + (apt.finalPrice || apt.package?.price || 0), 0);
    return getBossCurrentRevenue(today, actualRevenue);
  };

  // Calculate actual today's customers from completed appointments
  const calculateTodaysCustomers = () => {
    const today = getTodayMalaysiaString();
    const uniqueCustomers = new Set(todaysAppointments.map(apt => apt.clientId)).size;
    return getBossCurrentCustomers(today, uniqueCustomers);
  };

  // PDF Generation Function for Daily Summary
  const generateDailySummaryPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Get current date in Malaysia timezone
      const currentDate = new Date().toLocaleDateString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Little Barbershop', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.text('Daily Summary Report', pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(currentDate, pageWidth / 2, 40, { align: 'center' });
      
      // Line separator
      pdf.setLineWidth(0.5);
      pdf.line(20, 45, pageWidth - 20, 45);
      
      let yPosition = 55;
      
      // Today's Summary Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Today\'s Summary', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      // Summary metrics
      const todaysRevenue = calculateTodaysRevenue();
      const todaysCustomers = calculateTodaysCustomers();
      const todaysExpenses = (() => {
        const today = getTodayMalaysiaString();
        const dailyExpenses = financialData?.expenses?.filter(expense => expense.date === today) || [];
        const totalExpenses = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        return getBossCurrentExpenses(today, totalExpenses);
      })();
      
      pdf.text(`• Today's Revenue: RM${todaysRevenue.toFixed(2)}`, 25, yPosition);
      yPosition += 7;
      pdf.text(`• Today's Customers: ${todaysCustomers}`, 25, yPosition);
      yPosition += 7;
      pdf.text(`• Today's Expenses: RM${todaysExpenses.toFixed(2)}`, 25, yPosition);
      yPosition += 7;
      pdf.text(`• Net Profit: RM${(todaysRevenue - todaysExpenses).toFixed(2)}`, 25, yPosition);
      yPosition += 15;
      
      // Service Breakdown Section
      if (financialData?.serviceBreakdown && financialData.serviceBreakdown.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Service Breakdown', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        // Table headers
        pdf.setFont('helvetica', 'bold');
        pdf.text('Service', 25, yPosition);
        pdf.text('Quantity', 80, yPosition);
        pdf.text('Revenue', 120, yPosition);
        pdf.text('Commission', 160, yPosition);
        yPosition += 5;
        
        // Line under headers
        pdf.setLineWidth(0.3);
        pdf.line(25, yPosition, pageWidth - 20, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        
        financialData.serviceBreakdown.forEach((service) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const commission = service.totalRevenue * 0.75; // Assuming 75% commission rate
          
          pdf.text(service.name, 25, yPosition);
          pdf.text(service.count.toString(), 80, yPosition);
          pdf.text(`RM${service.totalRevenue.toFixed(2)}`, 120, yPosition);
          pdf.text(`RM${commission.toFixed(2)}`, 160, yPosition);
          yPosition += 7;
        });
        
        yPosition += 10;
      }
      
      // Appointments Details Section
      if (todaysAppointments.length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Today\'s Appointments', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('#', 25, yPosition);
        pdf.text('Client', 35, yPosition);
        pdf.text('Service', 80, yPosition);
        pdf.text('Barber', 120, yPosition);
        pdf.text('Price', 150, yPosition);
        pdf.text('Time', 175, yPosition);
        yPosition += 5;
        
        pdf.setLineWidth(0.3);
        pdf.line(25, yPosition, pageWidth - 20, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        
        todaysAppointments.forEach((appointment, index) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const appointmentTime = new Date(appointment.appointmentDate).toLocaleTimeString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          pdf.text((index + 1).toString(), 25, yPosition);
          pdf.text(appointment.client?.fullName || 'N/A', 35, yPosition);
          pdf.text(appointment.package?.name || 'N/A', 80, yPosition);
          pdf.text(appointment.barber?.fullName || 'N/A', 120, yPosition);
          pdf.text(`RM${(appointment.finalPrice || appointment.package?.price || 0).toFixed(2)}`, 150, yPosition);
          pdf.text(appointmentTime, 175, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      // Expenses Section
      if (todaysExpenses > 0) {
        const todayExpensesList = financialData?.expenses?.filter(expense => expense.date === getTodayMalaysiaString()) || [];
        
        if (todayExpensesList.length > 0) {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Today\'s Expenses', 20, yPosition);
          yPosition += 10;
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Category', 25, yPosition);
          pdf.text('Description', 80, yPosition);
          pdf.text('Amount', 150, yPosition);
          yPosition += 5;
          
          pdf.setLineWidth(0.3);
          pdf.line(25, yPosition, pageWidth - 20, yPosition);
          yPosition += 7;
          
          pdf.setFont('helvetica', 'normal');
          
          todayExpensesList.forEach((expense) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            
            pdf.text(expense.category, 25, yPosition);
            pdf.text(expense.description, 80, yPosition);
            pdf.text(`RM${expense.amount.toFixed(2)}`, 150, yPosition);
            yPosition += 6;
          });
        }
      }
      
      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}`, 20, pageHeight - 10);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10);
      }
      
      // Save the PDF
      const fileName = `Daily_Summary_${getTodayMalaysiaString()}.pdf`;
      pdf.save(fileName);
      
      showNotification('Daily summary PDF generated successfully!', 'success');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('Failed to generate PDF. Please try again.', 'error');
    }
  };

  React.useEffect(() => {
    fetchFinancialData();
    fetchTodaysAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, userRole]);

  // Auto-fetch when preset filter changes (but not for custom)
  React.useEffect(() => {
    if (dateFilter !== 'custom') {
      fetchFinancialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      if (userRole === 'Boss') {
        console.log('User is Boss, fetching financial data for date range:', dateRange);
        console.log('API URL:', `/financial/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
        const response = await apiGet(`/financial/overview?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`) as any;
        console.log('Financial data response:', response);
        if (response.success) {
          setFinancialData(response.data);
          console.log('Financial data set:', response.data);
          console.log('Barber performance data:', response.data?.barberPerformance);
        } else {
          console.error('Failed to fetch financial data:', response.message || response.error);
          console.error('Full response:', response);
          showNotification(response.message || response.error || 'Failed to fetch financial data', 'error');
        }
      } else if (userRole === 'Staff') {
        // Use hook data if available, otherwise fetch manually
        if (hookFinancialData) {
          setStaffData(hookFinancialData);
        } else {
          const response = await apiGet(`/financial/staff-report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`) as any;
          if (response.success) {
            setStaffData(response.data);
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        showNotification('Authentication failed. Please log in again.', 'error');
      } else {
        showNotification('Failed to fetch financial data. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      const response = await apiPost('/financial/expenses', {
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      }) as any;
      
      if (response.success) {
        setExpenseDialogOpen(false);
        setNewExpense({
          category: '',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchFinancialData();
        showNotification('Expense added successfully!', 'success');
      } else {
        showNotification(response.message || 'Failed to add expense', 'error');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('Failed to add expense', 'error');
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await apiDelete(`/financial/expenses/${expenseId}`) as any;
        if (response.success) {
          fetchFinancialData();
          showNotification('Expense deleted successfully!', 'success');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        showNotification('Failed to delete expense', 'error');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return `RM${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kuala_Lumpur'
    });
  };

  // Access control
  if (!['Boss', 'Staff'].includes(userRole || '')) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Only Boss and Staff can access financial reports.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>Financial Reports</Typography>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Loading financial data...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ 
        width: '100%',
        maxWidth: '100vw',
        minWidth: 0,
        overflow: 'hidden',
        overflowX: 'hidden',
        px: { xs: 0, sm: 0 },
        boxSizing: 'border-box'
      }}>
      {/* Modern Header Section */}
      <Box sx={{ 
        mb: { xs: 3, sm: 4 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 3, sm: 2 },
          pb: 3,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          {/* Title Section */}
          <Box>
          <Typography 
              variant="h3" 
              component="h1" 
            sx={{ 
                fontWeight: 700,
              fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif',
                fontSize: { xs: '2rem', sm: '2.5rem' },
                color: 'text.primary',
                lineHeight: 1.2,
                mb: 0.5
            }}
          >
            Financial Reports
          </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '0.95rem', sm: '1rem' },
                fontWeight: 400
              }}
            >
              Track your business performance and financial insights
            </Typography>
          </Box>
          
          {/* Action Button */}
          {userRole === 'Boss' && (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              width: { xs: '100%', sm: 'auto' }
            }}>
            <GradientButton
              variant="red"
              animated
              startIcon={<AddIcon />}
              onClick={() => setExpenseDialogOpen(true)}
              sx={{ 
                  px: { xs: 3, sm: 4 }, 
                  py: { xs: 1.5, sm: 1.8 }, 
                  fontSize: { xs: '0.9rem', sm: '0.95rem' },
                  fontWeight: 600,
                width: { xs: '100%', sm: 'auto' },
                  borderRadius: 3,
                  textTransform: 'none',
                  minWidth: { sm: 160 },
                  boxShadow: '0 4px 12px rgba(139, 14, 16, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(139, 14, 16, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease-in-out'
              }}
            >
              Add Expense
            </GradientButton>
            </Box>
          )}
        </Box>

        {/* Compact Date Filter */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 },
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 3,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          {/* Period Selector */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Filter Period</InputLabel>
            <Select
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              label="Filter Period"
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="this_week">This Week</MenuItem>
              <MenuItem value="last_week">Last Week</MenuItem>
              <MenuItem value="current_month">Current Month</MenuItem>
              <MenuItem value="last_month">Last Month</MenuItem>
              <MenuItem value="last_3_months">Last 3 Months</MenuItem>
              <MenuItem value="this_year">This Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Date Fields */}
          {dateFilter === 'custom' && (
            <>
          <TextField
            label="Start Date"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            size="small"
                sx={{ 
                  minWidth: { xs: '100%', sm: 150 },
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': { bgcolor: 'white' }
                }}
          />
          <TextField
            label="End Date"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            size="small"
                sx={{ 
                  minWidth: { xs: '100%', sm: 150 },
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': { bgcolor: 'white' }
                }}
              />
            </>
          )}

          {/* Clickable Date Range Display */}
          <Box 
            onClick={() => {
              if (dateFilter !== 'custom') {
                setDateFilter('custom');
              }
            }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 1.5,
              py: 0.5,
              bgcolor: 'white',
              borderRadius: 1,
              border: '1px solid',
              borderColor: dateFilter === 'custom' ? 'primary.main' : 'grey.300',
              minWidth: 'fit-content',
              flex: 1,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)'
              }
            }}
          >
            <CalendarTodayIcon 
              fontSize="small" 
              color={dateFilter === 'custom' ? 'primary' : 'action'} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.8rem', 
                color: dateFilter === 'custom' ? 'primary.main' : 'text.secondary',
                fontWeight: dateFilter === 'custom' ? 600 : 400
              }}
            >
              {new Date(dateRange.startDate + 'T00:00:00').toLocaleDateString('en-MY', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                timeZone: 'Asia/Kuala_Lumpur'
              })} - {new Date(dateRange.endDate + 'T00:00:00').toLocaleDateString('en-MY', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                timeZone: 'Asia/Kuala_Lumpur'
              })}
            </Typography>
            {dateFilter !== 'custom' && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.7rem', 
                  color: 'text.disabled',
                  ml: 0.5,
                  fontStyle: 'italic'
                }}
              >
                (click to edit)
              </Typography>
            )}
          </Box>

          {/* Apply Filter Button */}
          <Button
            variant="contained"
            onClick={fetchFinancialData}
            size="small"
            sx={{ 
              minWidth: { xs: '100%', sm: 100 },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Apply
          </Button>
        </Box>
      </Box>

      {userRole === 'Boss' ? (
        // Boss View
        <Box>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              mb: 3, 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              }
            }}
          >
            <Tab label="Overview" />
            <Tab label="Barber Performance" />
            {/* <Tab label="Service Analysis" /> */}
            <Tab label="Expenses" />
            <Tab label="Monthly Summary" />
          </Tabs>

          {tabValue === 0 && financialData && (
            // Overview Tab
            <Box>
              {/* Daily Overview Section */}
              <Box sx={{ 
                mb: 4, 
                p: 3, 
                borderRadius: 2, 
                bgcolor: 'background.paper',
                border: '2px solid #8B0000',
                position: 'relative'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Today&apos;s Business Summary
                        </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date().toLocaleDateString('en-MY', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      timeZone: 'Asia/Kuala_Lumpur'
                    })}
                        </Typography>
                      </Box>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        TODAY&apos;S REVENUE
                        </Typography>
                      <Typography variant="h5" fontWeight={700} color="text.primary">
                        {formatCurrency(calculateTodaysRevenue())}
                        </Typography>
                      </Box>
              </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        TODAY&apos;S CUSTOMERS
                        </Typography>
                      <Typography variant="h5" fontWeight={700} color="text.primary">
                        {calculateTodaysCustomers()}
                        </Typography>
                      </Box>
              </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        TODAY&apos;S EXPENSES
                        </Typography>
                      <Typography variant="h5" fontWeight={700} color="text.primary">
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          // Use a portion of total expenses as today's estimate (for demo purposes)
                          const estimatedDailyExpenses = Math.round(financialData.overview.totalExpenses * 0.08);
                          return formatCurrency(getBossCurrentExpenses(today, estimatedDailyExpenses));
                        })()}
                        </Typography>
                      </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        STATUS
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color={(() => {
                        const today = new Date().toISOString().split('T')[0];
                        return isBossDateClosed(today) ? 'text.secondary' : '#10b981';
                      })()}>
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          return isBossDateClosed(today) ? 'CLOSED' : 'ACTIVE';
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
              </Grid>

                {/* Action Buttons */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 16,
                  display: 'flex',
                  gap: 1
                }}>
                  {/* Print PDF Button */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={generateDailySummaryPDF}
                    startIcon={<DownloadIcon />}
                    sx={{
                      textTransform: 'none',
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      fontSize: '0.8rem',
                      px: 1.5,
                      py: 0.5,
                      '&:hover': {
                        borderColor: '#1565c0',
                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    Print PDF
                  </Button>
                  
                  {/* Close Daily Account Button */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setBossCloseDailyOpen(true)}
                    disabled={calculateTodaysRevenue() === 0}
                    sx={{
                      textTransform: 'none',
                      borderColor: '#8B0000',
                      color: '#8B0000',
                      fontSize: '0.8rem',
                      px: 1.5,
                      py: 0.5,
                      '&:hover': {
                        borderColor: '#8B0000',
                        bgcolor: 'rgba(139,0,0,0.1)'
                      },
                      '&:disabled': {
                        borderColor: '#ccc',
                        color: '#999'
                      }
                    }}
                  >
                    Close Daily Account
                  </Button>
                </Box>
                      </Box>

              {/* Period Overview Cards */}
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Financial Overview Cards */}
                <Grid item xs={6} sm={6} md={2.4}>
                  <FinancialCard
                    title="Total Revenue"
                    value={formatCurrency(financialData.overview.totalRevenue)}
                    icon={<MonetizationOnIcon />}
                    color="#10b981"
                    bgColor="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                    subtitle="All income"
                  />
              </Grid>

                <Grid item xs={6} sm={6} md={2.4}>
                  <FinancialCard
                    title="Commission Paid"
                    value={formatCurrency(financialData.overview.totalCommissionPaid)}
                    icon={<PaymentsIcon />}
                    color="#f59e0b"
                    bgColor="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                    subtitle="Staff earnings"
                  />
            </Grid>

                <Grid item xs={6} sm={6} md={2.4}>
                  <FinancialCard
                    title="Expenses"
                    value={formatCurrency(financialData.overview.totalExpenses)}
                    icon={<ReceiptIcon />}
                    color="#ef4444"
                    bgColor="linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
                    subtitle="Business costs"
                  />
                </Grid>

                <Grid item xs={6} sm={6} md={2.4}>
                  <FinancialCard
                    title="Net Profit"
                    value={formatCurrency(financialData.overview.netProfit)}
                    icon={<MonetizationOnIcon />}
                    color={financialData.overview.netProfit >= 0 ? '#10b981' : '#ef4444'}
                    bgColor={financialData.overview.netProfit >= 0 ? 
                      'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 
                      'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                    }
                    subtitle="Final profit"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                  <FinancialCard
                    title="Customers"
                    value={financialData.overview.totalCustomers.toString()}
                    icon={<PeopleIcon />}
                    color="#3b82f6"
                    bgColor="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
                    subtitle="Total served"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 1 && financialData && (
            // Barber Performance Tab
            <Card sx={{ 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
              border: 'none', 
              borderRadius: { xs: 4, sm: 5 }, 
              backgroundColor: '#fff'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  sx={{ 
                    mb: { xs: 2, sm: 3 },
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  Barber Performance
                </Typography>
                
                {isMobile ? (
                  // Mobile Card Layout
                  <Grid container spacing={2}>
                    {financialData.barberPerformance.map((barber) => (
                      <Grid item xs={12} key={barber.id}>
                        <Card sx={{ 
                          border: '1px solid #e0e0e0',
                          borderRadius: 3,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            outline: '2px solid #8B0000',
                            outlineOffset: '-2px'
                          }
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                                {barber.name.charAt(0)}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={600}>
                                  {barber.name}
                                </Typography>
                                <Chip 
                                  label={`${barber.commissionRate}% Commission`}
                                  color="primary"
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Customers
                                </Typography>
                                <Typography variant="h6" fontWeight={600}>
                                  {barber.customerCount}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Appointments
                                </Typography>
                                <Typography variant="h6" fontWeight={600}>
                                  {barber.appointmentCount}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Total Sales
                                </Typography>
                                <Typography variant="h6" fontWeight={600} color="primary.main">
                                  {formatCurrency(barber.totalSales)}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Commission Earned
                                </Typography>
                                <Typography variant="h6" fontWeight={600} color="success.main">
                                  {formatCurrency(barber.commissionPaid)}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  // Desktop Table Layout
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Barber</strong></TableCell>
                        <TableCell><strong>Customers</strong></TableCell>
                        <TableCell><strong>Appointments</strong></TableCell>
                        <TableCell><strong>Total Sales</strong></TableCell>
                        <TableCell><strong>Commission Rate</strong></TableCell>
                        <TableCell><strong>Commission Paid</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {financialData.barberPerformance.map((barber) => (
                        <TableRow key={barber.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {barber.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {barber.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{barber.customerCount}</TableCell>
                          <TableCell>{barber.appointmentCount}</TableCell>
                          <TableCell>{formatCurrency(barber.totalSales)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${barber.commissionRate}%`}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} color="success.main">
                              {formatCurrency(barber.commissionPaid)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </CardContent>
            </Card>
          )}

          {tabValue === 2 && financialData && (
            // Service Analysis Tab
            <Card sx={{ 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
              border: 'none', 
              borderRadius: { xs: 4, sm: 5 }, 
              backgroundColor: '#fff'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  sx={{ 
                    mb: { xs: 2, sm: 3 },
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  Service Breakdown
                </Typography>
                
                <Grid container spacing={2}>
                  {financialData.serviceBreakdown.map((service, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 3,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          outline: '2px solid #8B0000',
                          outlineOffset: '-2px'
                        }
                      }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {service.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {service.count} services
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                            {formatCurrency(service.totalRevenue)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {tabValue === 2 && financialData && (
            // Expenses Tab
            <Card sx={{ 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
              border: 'none', 
              borderRadius: { xs: 4, sm: 5 }, 
              backgroundColor: '#fff'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  sx={{ 
                    mb: { xs: 2, sm: 3 },
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  Expenses
                </Typography>
                
                {isMobile ? (
                  // Mobile Card Layout
                  <Grid container spacing={2}>
                    {financialData.expenses.map((expense) => (
                      <Grid item xs={12} key={expense.id}>
                        <Card sx={{ 
                          border: '1px solid #e0e0e0',
                          borderRadius: 3,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            outline: '2px solid #8B0000',
                            outlineOffset: '-2px'
                          }
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={600} color="error.main">
                                  {formatCurrency(expense.amount)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(expense.date)}
                                </Typography>
                              </Box>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                            
                            <Box sx={{ mb: 1 }}>
                              <Chip 
                                label={expense.category}
                                color="secondary"
                                size="small"
                                variant="outlined"
                                sx={{ mb: 1 }}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.primary">
                              {expense.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  // Desktop Table Layout
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell><strong>Amount</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {financialData.expenses.map((expense) => (
                        <TableRow key={expense.id} hover>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={expense.category}
                              color="secondary"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} color="error.main">
                              {formatCurrency(expense.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </CardContent>
            </Card>
          )}

          {tabValue === 3 && (
            // Monthly Summary Tab
            <Box>

              {!financialData ? (
                <Card sx={{ 
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
                  border: 'none', 
                  borderRadius: { xs: 4, sm: 5 }, 
                  backgroundColor: '#fff',
                  mb: 3
                }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Data Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {loading ? 'Loading financial data...' : 'No financial data found for the selected period. Try adjusting your date range or ensure there are completed appointments.'}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Monthly Payroll Summary */}
                  <Card sx={{ 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
                    border: 'none', 
                    borderRadius: { xs: 4, sm: 5 }, 
                    backgroundColor: '#fff',
                    mb: 3
                  }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: { xs: 2, sm: 3 }
                  }}>
                      <Typography 
                      variant="h6" 
                      fontWeight={600} 
                        sx={{ 
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                      }}
                    >
                      Monthly Payroll Summary
                      </Typography>
                    <GradientButton
                      variant="red"
                      animated
                      startIcon={<RestartAltIcon />}
                      onClick={() => setResetMonthlyOpen(true)}
                        sx={{ 
                        px: { xs: 2, sm: 3 }, 
                        py: { xs: 0.8, sm: 1 }, 
                        fontSize: { xs: 12, sm: 13 }
                        }}
                      >
                      Reset Monthly
                    </GradientButton>
                    </Box>

                  {/* Date Range Display */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Report Period
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {formatDateTime(new Date().toISOString())}
                    </Typography>
                  </Box>

                  {/* Summary Cards */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        border: '2px solid #10b981',
                        borderRadius: 3
                      }}>
                        <Typography variant="h4" fontWeight={700} color="#10b981">
                          {formatCurrency(financialData.overview.totalCommissionPaid)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Staff Earnings
                        </Typography>
              </Card>
            </Grid>
                    <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        border: '2px solid #3b82f6',
                        borderRadius: 3
                      }}>
                        <Typography variant="h4" fontWeight={700} color="#3b82f6">
                          {financialData.barberPerformance.length}
                      </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Staff
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        border: '2px solid #f59e0b',
                        borderRadius: 3
                      }}>
                        <Typography variant="h4" fontWeight={700} color="#f59e0b">
                          {formatCurrency(financialData.overview.totalRevenue)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Revenue
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        border: '2px solid #8b5cf6',
                        borderRadius: 3
                      }}>
                        <Typography variant="h4" fontWeight={700} color="#8b5cf6">
                          {((financialData.overview.totalCommissionPaid / financialData.overview.totalRevenue) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Payroll Percentage
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Staff Payroll Table */}
                      <Typography 
                    variant="h6" 
                    fontWeight={600} 
                    sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.1rem' } }}
                  >
                    Staff Payroll Breakdown
                      </Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                          <TableCell><strong>Staff Member</strong></TableCell>
                          <TableCell><strong>Commission Rate</strong></TableCell>
                          <TableCell><strong>Total Sales</strong></TableCell>
                          <TableCell><strong>Earnings</strong></TableCell>
                          <TableCell><strong>Customers</strong></TableCell>
                          <TableCell><strong>Services</strong></TableCell>
                          <TableCell><strong>Avg per Service</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {financialData.barberPerformance && financialData.barberPerformance.length > 0 ? (
                          financialData.barberPerformance.map((barber) => (
                            <TableRow key={barber.id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    {barber.name.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={500}>
                                    {barber.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${barber.commissionRate || 0}%`}
                                  color="primary"
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatCurrency(barber.totalSales)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600} color="success.main">
                                  {formatCurrency(barber.commissionPaid)}
                                </Typography>
                              </TableCell>
                              <TableCell>{barber.customerCount}</TableCell>
                              <TableCell>{barber.appointmentCount}</TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {barber.appointmentCount > 0 
                                    ? formatCurrency(barber.commissionPaid / barber.appointmentCount)
                                    : formatCurrency(0)
                                  }
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                No staff data available for the selected period
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {/* Total Row */}
                        {financialData.barberPerformance && financialData.barberPerformance.length > 0 && (
                          <TableRow sx={{ bgcolor: '#f8f9fa', fontWeight: 600 }}>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <Typography variant="body2" fontWeight={600}>
                                TOTAL
                              </Typography>
                            </TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {formatCurrency(financialData.barberPerformance.reduce((sum, b) => sum + b.totalSales, 0))}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} color="success.main">
                                {formatCurrency(financialData.overview.totalCommissionPaid)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {financialData.barberPerformance.reduce((sum, b) => sum + b.customerCount, 0)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {financialData.barberPerformance.reduce((sum, b) => sum + b.appointmentCount, 0)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} color="text.secondary">
                                {(() => {
                                  const totalServices = financialData.barberPerformance.reduce((sum, b) => sum + b.appointmentCount, 0);
                                  return totalServices > 0 
                                    ? formatCurrency(financialData.overview.totalCommissionPaid / totalServices)
                                    : formatCurrency(0);
                                })()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Business Profitability Analysis */}
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
                border: 'none', 
                borderRadius: { xs: 4, sm: 5 }, 
                backgroundColor: '#fff'
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                    variant="h6" 
                    fontWeight={600} 
                        sx={{ 
                      mb: { xs: 2, sm: 3 },
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Business Profitability Analysis
                      </Typography>

                  <Grid container spacing={3}>
                    {/* Revenue Breakdown */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 3, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 3,
                        height: '100%'
                      }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom color="success.main">
                          Revenue Breakdown
                        </Typography>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Total Revenue:</Typography>
                            <Typography variant="body1" fontWeight={600} color="success.main">
                              {formatCurrency(financialData.overview.totalRevenue)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Staff Commissions:</Typography>
                            <Typography variant="body1" fontWeight={600} color="warning.main">
                              -{formatCurrency(financialData.overview.totalCommissionPaid)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Business Expenses:</Typography>
                            <Typography variant="body1" fontWeight={600} color="error.main">
                              -{formatCurrency(financialData.overview.totalExpenses)}
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            pt: 1,
                            borderTop: '2px solid #e0e0e0'
                          }}>
                            <Typography variant="h6" fontWeight={600}>Net Profit:</Typography>
                      <Typography 
                              variant="h6" 
                              fontWeight={700} 
                              color={financialData.overview.netProfit >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(financialData.overview.netProfit)}
                      </Typography>
                    </Box>
                        </Stack>
                      </Box>
                    </Grid>

                    {/* Key Metrics */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 3, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 3,
                        height: '100%'
                      }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">
                          Key Business Metrics
                        </Typography>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Profit Margin:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {((financialData.overview.netProfit / financialData.overview.totalRevenue) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Staff Cost Ratio:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {((financialData.overview.totalCommissionPaid / financialData.overview.totalRevenue) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Expense Ratio:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {((financialData.overview.totalExpenses / financialData.overview.totalRevenue) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Revenue per Customer:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {formatCurrency(financialData.overview.totalRevenue / financialData.overview.totalCustomers)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Avg Staff Earnings:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {formatCurrency(financialData.overview.totalCommissionPaid / financialData.barberPerformance.length)}
                            </Typography>
                          </Box>
                  </Stack>
                      </Box>
                    </Grid>
                  </Grid>
                  </CardContent>
                  </Card>
                </>
              )}
            </Box>
          )}
        </Box>
      ) : (
        // Staff View
        <Box>
          {/* Staff Header with Real-time Updates */}
          {lastUpdated && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
              justifyContent: 'flex-end',
            mb: 3,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
            </Box>
          )}

          {staffData && (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Staff Summary Cards */}
            <Grid item xs={6} sm={6} md={3}>
                <FinancialCard
                  title="Total Earnings"
                  value={formatCurrency(staffData.summary.totalEarnings)}
                  icon={<AccountBalanceWalletIcon />}
                  color="#10b981"
                  bgColor="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                  subtitle="Your commission"
                />
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
                <FinancialCard
                  title="Customers Served"
                  value={staffData.summary.totalCustomers.toString()}
                  icon={<PeopleIcon />}
                  color="#3b82f6"
                  bgColor="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
                  subtitle="Happy clients"
                />
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
                <FinancialCard
                  title="Commission Rate"
                  value={`${staffData.summary.commissionRate}%`}
                  icon={<PaymentsIcon />}
                  color="#f59e0b"
                  bgColor="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                  subtitle="Your rate"
                />
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
                <FinancialCard
                  title="Total Services"
                  value={staffData.summary.totalServices.toString()}
                  icon={<CalendarTodayIcon />}
                  color="#8b5cf6"
                  bgColor="linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)"
                  subtitle="Completed"
                />
            </Grid>

            {/* Daily Earnings & Monthly Projection */}
            <Grid item xs={12}>
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
                border: 'none', 
                borderRadius: { xs: 4, sm: 5 }, 
                backgroundColor: '#fff'
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                    variant="h6" 
                    fontWeight={600} 
                        sx={{ 
                      mb: { xs: 2, sm: 3 },
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Daily Earnings & Monthly Projection
                      </Typography>

                  {/* Monthly Summary Cards */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '2px solid #8B0000',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" color="black" fontWeight={600}>
                          DAYS WORKED
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="black">
                          {staffData.earningsHistory.filter(day => day.totalEarnings > 0).length}
                      </Typography>
                    </Box>
            </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '2px solid #8B0000',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" color="black" fontWeight={600}>
                          AVG DAILY
                      </Typography>
                        <Typography variant="h6" fontWeight={700} color="black">
                          {formatCurrency(
                            staffData.earningsHistory.filter(day => day.totalEarnings > 0).length > 0
                              ? staffData.summary.totalEarnings / staffData.earningsHistory.filter(day => day.totalEarnings > 0).length
                              : 0
                          )}
                      </Typography>
                    </Box>
            </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '2px solid #8B0000',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" color="black" fontWeight={600}>
                          TO REACH TARGET
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="black">
                          {formatCurrency(Math.max(0, monthlyTarget - staffData.summary.totalEarnings))}
                        </Typography>
                      </Box>
            </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '2px solid #8B0000',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        <Typography variant="caption" color="black" fontWeight={600}>
                          MY TARGET MONTHLY
                      </Typography>
                        <Typography variant="h6" fontWeight={700} color="black">
                          {formatCurrency(monthlyTarget)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setNewTarget(monthlyTarget.toString());
                            setTargetDialogOpen(true);
                          }}
                        sx={{ 
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 20,
                            height: 20,
                            bgcolor: 'rgba(139,0,0,0.1)',
                            color: '#8B0000',
                            '&:hover': {
                              bgcolor: 'rgba(139,0,0,0.2)'
                            }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 12, color: '#8B0000' }} />
                        </IconButton>
                    </Box>
                    </Grid>
            </Grid>

                  {/* Today&apos;s Summary & Close Daily Account */}
                  <Box sx={{ 
                    mb: 3, 
                    p: 3, 
                    borderRadius: 2, 
                    bgcolor: 'background.paper',
                    border: '1px solid #e0e0e0',
                    position: 'relative'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        Today&apos;s Account Summary
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date().toLocaleDateString('en-MY', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          timeZone: 'Asia/Kuala_Lumpur'
                        })}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            TODAY&apos;S CUSTOMERS
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="text.primary">
                            {(() => {
                              const today = new Date().toISOString().split('T')[0];
                              const todayData = staffData.earningsHistory.find(day => day.date === today);
                              return todayData ? getCurrentCustomers(today, todayData.customers) : 0;
                            })()}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            TODAY&apos;S EARNINGS
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="text.primary">
                            {(() => {
                              const today = new Date().toISOString().split('T')[0];
                              const todayData = staffData.earningsHistory.find(day => day.date === today);
                              return formatCurrency(todayData ? getCurrentEarnings(today, todayData.totalEarnings) : 0);
                            })()}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            STATUS
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="text.secondary">
                            {(() => {
                              const today = new Date().toISOString().split('T')[0];
                              const todayData = staffData.earningsHistory.find(day => day.date === today);
                              const currentEarnings = todayData ? getCurrentEarnings(today, todayData.totalEarnings) : 0;
                              return currentEarnings > 0 ? 'ACTIVE' : 'NO WORK';
                            })()}
                          </Typography>
                        </Box>
                      </Grid>
            </Grid>

                    {/* Close Daily Account Button - Bottom Right */}
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 16, 
                      right: 16 
                    }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCloseDailyOpen(true)}
                        disabled={(() => {
                          const today = new Date().toISOString().split('T')[0];
                          const todayData = staffData.earningsHistory.find(day => day.date === today);
                          const currentEarnings = todayData ? getCurrentEarnings(today, todayData.totalEarnings) : 0;
                          return currentEarnings === 0;
                        })()}
                        sx={{ 
                          px: 2, 
                          py: 0.5, 
                          fontSize: 12,
                          fontWeight: 500,
                          borderRadius: 1,
                          textTransform: 'none'
                        }}
                      >
                        Close Daily
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Service Breakdown */}
            <Grid item xs={12}>
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
                border: 'none', 
                borderRadius: { xs: 4, sm: 5 }, 
                backgroundColor: '#fff'
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600} 
                    sx={{ 
                      mb: { xs: 2, sm: 3 },
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Service Breakdown
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Service</strong></TableCell>
                          <TableCell><strong>Quantity</strong></TableCell>
                          <TableCell><strong>Total Revenue</strong></TableCell>
                          <TableCell><strong>Your Earnings</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {staffData.serviceBreakdown.map((service, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{service.name}</TableCell>
                            <TableCell>{service.count}</TableCell>
                            <TableCell>{formatCurrency(service.totalRevenue)}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500} color="success.main">
                                {formatCurrency(service.barberShare)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Earnings History */}
            <Grid item xs={12}>
              <Card sx={{ 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
                border: 'none', 
                borderRadius: { xs: 4, sm: 5 }, 
                backgroundColor: '#fff'
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600} 
                    sx={{ 
                      mb: { xs: 2, sm: 3 },
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Earnings History
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Customers</strong></TableCell>
                          <TableCell><strong>Total Earnings</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {staffData.earningsHistory.slice(0, 10).map((day, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{formatDate(day.date)}</TableCell>
                            <TableCell>{day.customers}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500} color="success.main">
                                {formatCurrency(day.totalEarnings)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          )}
        </Box>
      )}

      {/* Add Expense Dialog */}
      <Dialog 
        open={expenseDialogOpen} 
        onClose={() => setExpenseDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            borderRadius: { xs: 2, sm: 2 },
            maxHeight: { xs: '90vh', sm: 'none' }
          }
        }}
      >
        <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="h6" 
            fontWeight={600}
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            Add New Expense
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                label="Category"
              >
                <MenuItem value="Rent">Rent</MenuItem>
                <MenuItem value="Utilities">Utilities</MenuItem>
                <MenuItem value="Supplies">Supplies</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Equipment">Equipment</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              fullWidth
              required
              multiline
              rows={2}
            />
            
            <TextField
              label="Amount"
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">RM</InputAdornment>,
              }}
            />
            
            <TextField
              label="Date"
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1.5, sm: 2 },
          flexDirection: 'row'
        }}>
          <GradientButton
            variant="blue"
            animated
            onClick={() => setExpenseDialogOpen(false)}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Cancel
          </GradientButton>
          <GradientButton
            variant="red"
            animated
            onClick={handleAddExpense}
            disabled={!newExpense.category || !newExpense.description || !newExpense.amount}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Add
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Close Daily Account Dialog */}
      <Dialog 
        open={closeDailyOpen} 
        onClose={() => setCloseDailyOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 2, sm: 3 },
            margin: { xs: 1, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          fontWeight: 600
        }}>
          Close Daily Account
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mb: 1 }}>
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayData = staffData?.earningsHistory.find(day => day.date === today);
                return formatCurrency(todayData ? getCurrentEarnings(today, todayData.totalEarnings) : 0);
              })()}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Today&apos;s Total Earnings
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: '#f5f5f5',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const todayData = staffData?.earningsHistory.find(day => day.date === today);
                      return todayData ? getCurrentCustomers(today, todayData.customers) : 0;
                    })()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Customers Served
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: '#f5f5f5',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight={600} color="warning.main">
                    {staffData?.summary.commissionRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Commission Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Closing your daily account will finalize today&apos;s earnings and prepare the system for tomorrow&apos;s transactions.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1.5, sm: 2 },
          flexDirection: 'row'
        }}>
          <GradientButton
            variant="blue"
            animated
            onClick={() => setCloseDailyOpen(false)}
            disabled={isClosingDaily}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Cancel
          </GradientButton>
          <GradientButton
            variant="red"
            animated
            onClick={handleCloseDailyAccount}
            disabled={isClosingDaily}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            {isClosingDaily ? 'Closing...' : 'Close Account'}
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Boss Close Daily Account Dialog */}
      <Dialog 
        open={bossCloseDailyOpen} 
        onClose={() => setBossCloseDailyOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 2, sm: 3 },
            margin: { xs: 1, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          fontWeight: 600
        }}>
          Close Daily Business Account
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mb: 1 }}>
              {formatCurrency(calculateTodaysRevenue())}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Today&apos;s Total Revenue
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: '#f5f5f5',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const estimatedDailyCustomers = Math.round((financialData?.overview.totalCustomers || 0) * 0.15);
                      return getBossCurrentCustomers(today, estimatedDailyCustomers);
                    })()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Customers Served
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: '#f5f5f5',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight={600} color="error.main">
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const estimatedDailyExpenses = Math.round((financialData?.overview.totalExpenses || 0) * 0.08);
                      return formatCurrency(getBossCurrentExpenses(today, estimatedDailyExpenses));
                    })()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Daily Expenses
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: '#f5f5f5',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" fontWeight={600} color="success.main">
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const estimatedDailyExpenses = Math.round((financialData?.overview.totalExpenses || 0) * 0.08);
                      const netProfit = calculateTodaysRevenue() - getBossCurrentExpenses(today, estimatedDailyExpenses);
                      return formatCurrency(netProfit);
                    })()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Net Profit
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Closing your daily business account will finalize today&apos;s revenue and prepare the system for tomorrow&apos;s operations.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1.5, sm: 2 },
          flexDirection: 'row'
        }}>
          <GradientButton
            variant="blue"
            animated
            onClick={() => setBossCloseDailyOpen(false)}
            disabled={isBossClosingDaily}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Cancel
          </GradientButton>
          <GradientButton
            variant="red"
            animated
            onClick={handleBossCloseDailyAccount}
            disabled={isBossClosingDaily}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            {isBossClosingDaily ? 'Closing...' : 'Close Account'}
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Edit Monthly Target Dialog */}
      <Dialog 
        open={targetDialogOpen} 
        onClose={() => setTargetDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 2, sm: 3 },
            margin: { xs: 1, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          fontWeight: 600
        }}>
          Set Monthly Target
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set your monthly earnings target to track your progress and stay motivated.
          </Typography>
          <TextField
            autoFocus
            label="Monthly Target (RM)"
            type="number"
            fullWidth
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="e.g., 5000"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>RM</Typography>,
            }}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Current progress: {formatCurrency(staffData?.summary.totalEarnings || 0)} / {formatCurrency(monthlyTarget)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1.5, sm: 2 },
          flexDirection: 'row'
        }}>
          <GradientButton
            variant="blue"
            animated
            onClick={() => setTargetDialogOpen(false)}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Cancel
          </GradientButton>
          <GradientButton
            variant="red"
            animated
            onClick={handleUpdateTarget}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Update Target
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Reset Monthly Summary Dialog */}
      <Dialog 
        open={resetMonthlyOpen} 
        onClose={() => setResetMonthlyOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: { xs: 2, sm: 3 },
            margin: { xs: 1, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          fontWeight: 600
        }}>
          Reset Monthly Summary
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <RestartAltIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Are you sure you want to reset the monthly summary?
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This action will clear all financial data for the selected date range:
            </Typography>
            
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: '#fff3cd',
              border: '1px solid #ffeaa7',
              mb: 3
            }}>
              <Typography variant="body2" fontWeight={500} color="#856404">
                Date Range: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: '#f8d7da',
              border: '1px solid #f5c6cb',
              mb: 2
            }}>
              <Typography variant="body2" fontWeight={500} color="#721c24" gutterBottom>
                ⚠️ This will reset:
              </Typography>
              <Typography variant="body2" color="#721c24" sx={{ textAlign: 'left' }}>
                • All appointment statuses to &quot;pending&quot;<br/>
                • All staff earnings and commission data<br/>
                • All expense records for this period<br/>
                • All financial calculations and reports
              </Typography>
            </Box>
            
            <Typography variant="body2" color="error.main" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
              This action cannot be undone!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1.5, sm: 2 },
          flexDirection: 'row'
        }}>
          <GradientButton
            variant="blue"
            animated
            onClick={() => setResetMonthlyOpen(false)}
            disabled={isResettingMonthly}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Cancel
          </GradientButton>
          <GradientButton
            variant="red"
            animated
            onClick={handleResetMonthlySummary}
            disabled={isResettingMonthly}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            {isResettingMonthly ? 'Resetting...' : 'Reset Monthly Summary'}
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </DashboardLayout>
  );
}
