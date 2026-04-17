'use client';

import * as React from 'react';
import { Box, Container, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Button, Chip } from '@mui/material';
import DashboardLayout from '../../../components/dashboard/Layout';
import { apiGet } from '../../../src/utils/axios';
import PeriodProfitLossCard from '../../../components/dashboard/PeriodProfitLossCard';
import { useUserRole } from '../../../hooks/useUserRole';

const formatDateInKualaLumpur = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export default function ProfitLossPage() {
  const { userRole } = useUserRole();
  const [dateFilter, setDateFilter] = React.useState<'today' | 'this_week' | 'current_month' | 'last_month'>('current_month');
  const [dateRange, setDateRange] = React.useState(() => {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: formatDateInKualaLumpur(startOfMonth),
      endDate: formatDateInKualaLumpur(today),
    };
  });
  const [overview, setOverview] = React.useState<any>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<'ALL' | 'CASH' | 'TRANSFER'>('ALL');
  const [loading, setLoading] = React.useState(false);

  const formatCurrency = React.useCallback((amount: number) => {
    const n = Number(amount) || 0;
    return `RM${n.toFixed(2)}`;
  }, []);

  const computeRangeFromPreset = React.useCallback((preset: typeof dateFilter) => {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    let start = new Date(today);
    let end = new Date(today);

    if (preset === 'today') {
      // keep
    } else if (preset === 'this_week') {
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(today.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
    } else if (preset === 'current_month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'last_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    return {
      startDate: formatDateInKualaLumpur(start),
      endDate: formatDateInKualaLumpur(end),
    };
  }, []);

  const fetchOverview = React.useCallback(async (range: { startDate: string; endDate: string }) => {
    setLoading(true);
    try {
      const pmParam = paymentMethodFilter !== 'ALL' ? `&paymentMethod=${paymentMethodFilter}` : '';
      const response = await apiGet(`/financial/overview?startDate=${range.startDate}&endDate=${range.endDate}${pmParam}`) as any;
      if (response?.success) setOverview(response.data.overview);
      else setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [paymentMethodFilter]);

  React.useEffect(() => {
    if (userRole !== 'Boss') return;
    fetchOverview(dateRange);
  }, [userRole, dateRange, fetchOverview]);

  if (userRole !== 'Boss') {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3 } }}>
          <Typography sx={{ py: 4 }}>Only Boss can view Profit &amp; Loss.</Typography>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3 } }}>
        <Box
          sx={{
            mb: { xs: 2, sm: 3 },
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background:
              'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(248,113,113,0.08) 45%, rgba(255,255,255,0.92))',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
          }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            Profit &amp; Loss
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Selected period net profit = total income - product COGS - commissions - recorded expenses.
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#e2e8f0', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)' }}>
          <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="pnl-range">Date range</InputLabel>
              <Select
                labelId="pnl-range"
                label="Date range"
                value={dateFilter}
                onChange={(e) => {
                  const preset = e.target.value as any;
                  setDateFilter(preset);
                  setDateRange(computeRangeFromPreset(preset));
                }}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="this_week">This week</MenuItem>
                <MenuItem value="current_month">Current month</MenuItem>
                <MenuItem value="last_month">Last month</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="pnl-payment">Payment method</InputLabel>
              <Select
                labelId="pnl-payment"
                label="Payment method"
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="TRANSFER">Online Transfer</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flex: 1 }} />

            <Button variant="outlined" onClick={() => fetchOverview(dateRange)} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Box sx={{ width: '100%' }} />
            <Chip size="small" label={`Period: ${dateFilter.replaceAll('_', ' ')}`} sx={{ bgcolor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: 700 }} />
            <Chip size="small" label={`Payment: ${paymentMethodFilter === 'ALL' ? 'All methods' : paymentMethodFilter}`} sx={{ bgcolor: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4', fontWeight: 700 }} />
          </CardContent>
        </Card>

        {overview && (
          <PeriodProfitLossCard overview={overview} formatCurrency={formatCurrency} title="Profit and loss (selected period)" />
        )}
      </Container>
    </DashboardLayout>
  );
}

