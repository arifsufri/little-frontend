'use client';

import * as React from 'react';
import { Box, Container, Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import DashboardLayout from '../../../components/dashboard/Layout';
import { apiGet } from '../../../src/utils/axios';
import PeriodProfitLossCard from '../../../components/dashboard/PeriodProfitLossCard';
import { useUserRole } from '../../../hooks/useUserRole';

export default function ProfitLossPage() {
  const { userRole } = useUserRole();
  const [dateFilter, setDateFilter] = React.useState<'today' | 'this_week' | 'current_month' | 'last_month'>('current_month');
  const [dateRange, setDateRange] = React.useState(() => {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  });
  const [overview, setOverview] = React.useState<any>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<'ALL' | 'CASH' | 'TRANSFER'>('ALL');
  const [transactions, setTransactions] = React.useState<any[]>([]);
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
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
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

  const fetchTransactions = React.useCallback(async (range: { startDate: string; endDate: string }) => {
    try {
      const pmParam = paymentMethodFilter !== 'ALL' ? `&paymentMethod=${paymentMethodFilter}` : '';
      const response = await apiGet(`/financial/transactions?startDate=${range.startDate}&endDate=${range.endDate}${pmParam}`) as any;
      if (response?.success) setTransactions(response.data.transactions || []);
      else setTransactions([]);
    } catch {
      setTransactions([]);
    }
  }, [paymentMethodFilter]);

  React.useEffect(() => {
    if (userRole !== 'Boss') return;
    fetchOverview(dateRange);
    fetchTransactions(dateRange);
  }, [userRole, dateRange, fetchOverview, fetchTransactions]);

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
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: { xs: '1.75rem', sm: '3rem' },
              color: '#000000',
              lineHeight: 1.2,
            }}
          >
            Profit &amp; Loss
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selected period net profit = total income − product COGS − commissions − recorded expenses.
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
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
          </CardContent>
        </Card>

        {overview && (
          <PeriodProfitLossCard overview={overview} formatCurrency={formatCurrency} title="Profit and loss (selected period)" />
        )}

        <Card sx={{ mt: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6" fontWeight={700}>
                Transactions (Cash vs Transfer)
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const payload = {
                    period: dateRange,
                    paymentMethod: paymentMethodFilter,
                    generatedAt: new Date().toISOString(),
                    transactions,
                  };
                  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `transactions_${dateRange.startDate}_to_${dateRange.endDate}_${paymentMethodFilter}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={!transactions || transactions.length === 0}
              >
                Export JSON
              </Button>
            </Box>

            {transactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No transactions found for the selected period / payment method.
              </Typography>
            ) : (
              <pre
                style={{
                  margin: 0,
                  maxHeight: 340,
                  overflow: 'auto',
                  padding: 12,
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 12,
                }}
              >
                {JSON.stringify(transactions, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </Container>
    </DashboardLayout>
  );
}

