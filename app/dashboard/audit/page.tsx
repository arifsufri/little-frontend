'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/dashboard/Layout';
import { useUserRole } from '../../../hooks/useUserRole';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { apiGet } from '../../../src/utils/axios';

interface Transaction {
  id: string;
  date: string;
  time: string;
  type: 'appointment' | 'product_sale' | 'expense';
  description: string;
  amount: number;
  status: string;
  clientName?: string;
  barberName?: string;
  linkedTo?: string;
  metadata?: any;
}

interface DailyReconciliation {
  date: string;
  expectedRevenue: number;
  appointmentRevenue: number;
  productRevenue: number;
  expenses: number;
  netRevenue: number;
  actualRevenue?: number;
  difference?: number;
  transactions: Transaction[];
}

export default function AuditPage() {
  const router = useRouter();
  const { userRole } = useUserRole();
  const [selectedDate, setSelectedDate] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reconciliation, setReconciliation] = React.useState<DailyReconciliation | null>(null);
  const [actualRevenue, setActualRevenue] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  // Redirect Staff users away from this page
  React.useEffect(() => {
    if (userRole === 'Staff') {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  // Don't render content for Staff users
  if (userRole === 'Staff') {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography>Redirecting...</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      // Fetch appointments for the date
      const appointmentsRes = await apiGet('/appointments') as any;
      const appointments = (appointmentsRes.data || []).filter((apt: any) => {
        const aptDate = new Date(apt.appointmentDate || apt.createdAt).toISOString().split('T')[0];
        return aptDate === selectedDate && apt.status === 'completed';
      });

      // Fetch product sales for the date
      const productSalesRes = await apiGet('/products/sales/all') as any;
      const productSales = (productSalesRes.data || []).filter((sale: any) => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        return saleDate === selectedDate;
      });

      // Fetch expenses for the date
      const expensesRes = await apiGet('/financial/expenses') as any;
      const expenses = (expensesRes.data || []).filter((exp: any) => {
        const expDate = new Date(exp.date).toISOString().split('T')[0];
        return expDate === selectedDate;
      });

      // Build transaction list
      const transactions: Transaction[] = [];

      // Add appointment transactions
      appointments.forEach((apt: any) => {
        const aptTime = new Date(apt.appointmentDate || apt.createdAt);
        
        // Calculate service-only price (excluding products)
        // If appointment has products linked, use originalPrice (service only)
        // Otherwise use finalPrice
        const hasLinkedProducts = apt.productSales && apt.productSales.length > 0;
        const serviceOnlyPrice = hasLinkedProducts 
          ? (apt.originalPrice || apt.finalPrice || apt.package?.price || 0)
          : (apt.finalPrice || apt.package?.price || 0);
        
        // Service transaction (service only, no products)
        transactions.push({
          id: `apt-${apt.id}`,
          date: selectedDate,
          time: aptTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
          type: 'appointment',
          description: `${apt.package?.name || 'Service'} - ${apt.client?.fullName || 'Unknown'}`,
          amount: serviceOnlyPrice,
          status: apt.status,
          clientName: apt.client?.fullName,
          barberName: apt.barber?.name,
          linkedTo: `Appointment #${apt.id}`,
          metadata: {
            appointmentId: apt.id,
            packageName: apt.package?.name,
            hasDiscount: apt.discountCodeId || apt.multipleDiscountCodes?.length > 0,
            originalPrice: apt.originalPrice,
            hasProducts: hasLinkedProducts
          }
        });

        // Product transactions linked to appointment
        if (hasLinkedProducts) {
          apt.productSales.forEach((sale: any) => {
            transactions.push({
              id: `prod-${sale.id}`,
              date: selectedDate,
              time: aptTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
              type: 'product_sale',
              description: `${sale.product?.name || 'Product'} (x${sale.quantity}) - ${apt.client?.fullName || 'Unknown'}`,
              amount: sale.totalPrice,
              status: 'completed',
              clientName: apt.client?.fullName,
              barberName: apt.barber?.name,
              linkedTo: `Appointment #${apt.id}`,
              metadata: {
                productId: sale.productId,
                quantity: sale.quantity,
                appointmentId: apt.id
              }
            });
          });
        }
      });

      // Add standalone product sales (not linked to appointments)
      productSales
        .filter((sale: any) => !sale.appointmentId)
        .forEach((sale: any) => {
          const saleTime = new Date(sale.createdAt);
          transactions.push({
            id: `prod-${sale.id}`,
            date: selectedDate,
            time: saleTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
            type: 'product_sale',
            description: `${sale.product?.name || 'Product'} (x${sale.quantity}) - Standalone Sale`,
            amount: sale.totalPrice,
            status: 'completed',
            clientName: sale.client?.fullName,
            linkedTo: 'Standalone Product Sale',
            metadata: {
              productId: sale.productId,
              quantity: sale.quantity,
              standalone: true
            }
          });
        });

      // Add expenses
      expenses.forEach((exp: any) => {
        const expTime = new Date(exp.date);
        transactions.push({
          id: `exp-${exp.id}`,
          date: selectedDate,
          time: expTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
          type: 'expense',
          description: `${exp.category} - ${exp.description}`,
          amount: -exp.amount, // Negative for expenses
          status: 'completed',
          linkedTo: `Expense #${exp.id}`,
          metadata: {
            category: exp.category,
            expenseId: exp.id
          }
        });
      });

      // Sort transactions by time
      transactions.sort((a, b) => a.time.localeCompare(b.time));

      // Calculate totals
      const appointmentRevenue = transactions
        .filter(t => t.type === 'appointment')
        .reduce((sum, t) => sum + t.amount, 0);

      const productRevenue = transactions
        .filter(t => t.type === 'product_sale')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = Math.abs(
        transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
      );

      const expectedRevenue = appointmentRevenue + productRevenue;
      const netRevenue = expectedRevenue - totalExpenses;

      setReconciliation({
        date: selectedDate,
        expectedRevenue,
        appointmentRevenue,
        productRevenue,
        expenses: totalExpenses,
        netRevenue,
        transactions
      });

    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAuditData();
  }, [selectedDate]);

  const handleReconcile = () => {
    if (!reconciliation || !actualRevenue) return;
    
    const actual = parseFloat(actualRevenue);
    const difference = actual - reconciliation.expectedRevenue;
    
    setReconciliation({
      ...reconciliation,
      actualRevenue: actual,
      difference
    });
  };

  const exportToCSV = () => {
    if (!reconciliation) return;

    const headers = ['Date', 'Time', 'Type', 'Description', 'Amount', 'Client', 'Barber', 'Linked To', 'Status'];
    const rows = reconciliation.transactions.map(t => [
      t.date,
      t.time,
      t.type,
      t.description,
      t.amount.toFixed(2),
      t.clientName || '-',
      t.barberName || '-',
      t.linkedTo || '-',
      t.status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${selectedDate}.csv`;
    a.click();
  };

  const getStatusIcon = (difference?: number) => {
    if (difference === undefined) return <InfoIcon color="info" />;
    if (Math.abs(difference) < 0.01) return <CheckCircleIcon color="success" />;
    if (Math.abs(difference) < 10) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const getStatusColor = (difference?: number) => {
    if (difference === undefined) return 'info';
    if (Math.abs(difference) < 0.01) return 'success';
    if (Math.abs(difference) < 10) return 'warning';
    return 'error';
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={800}>
            Financial Audit & Reconciliation
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              size="small"
              sx={{ width: 200 }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAuditData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
              disabled={!reconciliation}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Track all financial transactions and reconcile with your bank statements
        </Typography>
      </Box>

      {/* Summary Cards */}
      {reconciliation && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Expected Revenue
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  RM{reconciliation.expectedRevenue.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Appointments: RM{reconciliation.appointmentRevenue.toFixed(2)}
                  <br />
                  Products: RM{reconciliation.productRevenue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Total Expenses
                </Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">
                  RM{reconciliation.expenses.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Net Revenue
                </Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  RM{reconciliation.netRevenue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  {getStatusIcon(reconciliation.difference)}
                  <Typography variant="caption" color="text.secondary">
                    Reconciliation Status
                  </Typography>
                </Stack>
                {reconciliation.difference !== undefined ? (
                  <>
                    <Typography variant="h5" fontWeight={700} color={`${getStatusColor(reconciliation.difference)}.main`}>
                      {reconciliation.difference >= 0 ? '+' : ''}RM{reconciliation.difference.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Actual: RM{reconciliation.actualRevenue?.toFixed(2)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Not reconciled yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Reconciliation Tool */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Bank Reconciliation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the actual amount received in your bank account to compare with system records
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Actual Revenue from Bank"
              type="number"
              value={actualRevenue}
              onChange={(e) => setActualRevenue(e.target.value)}
              size="small"
              sx={{ width: 250 }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>RM</Typography>
              }}
            />
            <Button
              variant="contained"
              onClick={handleReconcile}
              disabled={!actualRevenue || !reconciliation}
            >
              Reconcile
            </Button>
          </Stack>

          {reconciliation?.difference !== undefined && (
            <Alert 
              severity={getStatusColor(reconciliation.difference) as any}
              sx={{ mt: 2 }}
              icon={getStatusIcon(reconciliation.difference)}
            >
              {Math.abs(reconciliation.difference) < 0.01 ? (
                <strong>Perfect Match!</strong>
              ) : reconciliation.difference > 0 ? (
                <>
                  <strong>Bank has MORE than expected:</strong> RM{Math.abs(reconciliation.difference).toFixed(2)} extra. 
                  Check for missing transactions in the system.
                </>
              ) : (
                <>
                  <strong>Bank has LESS than expected:</strong> RM{Math.abs(reconciliation.difference).toFixed(2)} missing. 
                  Check for pending payments or refunds.
                </>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Transaction Log */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Transaction Log ({reconciliation?.transactions.length || 0} transactions)
          </Typography>
          
          {reconciliation && reconciliation.transactions.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Barber</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reconciliation.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.time}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={
                            transaction.type === 'appointment' ? 'primary' :
                            transaction.type === 'product_sale' ? 'success' :
                            'error'
                          }
                        />
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.clientName || '-'}</TableCell>
                      <TableCell>{transaction.barberName || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          fontWeight={600}
                          color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                        >
                          {transaction.amount >= 0 ? '+' : ''}RM{transaction.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={JSON.stringify(transaction.metadata, null, 2)}>
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No transactions found for this date
            </Typography>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
