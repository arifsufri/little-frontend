'use client';

import * as React from 'react';
import { Card, CardContent, Typography, TableContainer, Paper, Table, TableBody, TableRow, TableCell } from '@mui/material';

export type FinancialOverviewForPnL = {
  totalRevenue?: number;
  serviceRevenue?: number;
  totalProductRevenue?: number;
  totalProductCOGS?: number;
  contributionAfterProductCOGS?: number;
  totalCommissionPaid?: number;
  totalExpenses?: number;
  inventoryPurchases?: number;
  cashRevenue?: number;
  transferRevenue?: number;
  netProfit?: number;
};

export default function PeriodProfitLossCard({
  overview,
  formatCurrency,
  cardSx,
  title = 'Profit and loss (selected period)',
}: {
  overview: FinancialOverviewForPnL;
  formatCurrency: (amount: number) => string;
  cardSx?: object;
  title?: string;
}) {
  const tr = overview.totalRevenue || 0;
  const serviceRev = overview.serviceRevenue ?? Math.max(0, tr - (overview.totalProductRevenue ?? 0));
  const productRev = overview.totalProductRevenue ?? 0;
  const cashRev = overview.cashRevenue ?? 0;
  const transferRev = overview.transferRevenue ?? 0;
  const cogs = overview.totalProductCOGS ?? 0;
  const afterCogs = overview.contributionAfterProductCOGS ?? tr - cogs;
  const comm = overview.totalCommissionPaid ?? 0;
  const opex = overview.totalExpenses ?? 0;
  const inv = overview.inventoryPurchases ?? 0;
  const net = overview.netProfit ?? 0;
  const cogsPct = tr > 0 ? ((cogs / tr) * 100).toFixed(1) : '0.0';

  return (
    <Card
      sx={{
        mt: 3,
        boxShadow: '0 14px 30px rgba(15, 23, 42, 0.06)',
        border: '1px solid',
        borderColor: '#e2e8f0',
        borderRadius: 3,
        bgcolor: '#fff',
        ...cardSx,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.25 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Track retail COGS, staff commissions, and business expenses. Net profit matches: total income minus product COGS, minus commissions, minus recorded expenses.
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, borderColor: '#e2e8f0' }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Services revenue (completed appointments)</TableCell>
                <TableCell align="right">{formatCurrency(serviceRev)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Product sales revenue (all channels)</TableCell>
                <TableCell align="right">{formatCurrency(productRev)}</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>Total income</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatCurrency(tr)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'success.dark' }}>Cash revenue</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'success.dark' }}>
                  {formatCurrency(cashRev)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'primary.dark' }}>Online transfer revenue</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                  {formatCurrency(transferRev)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 3, color: 'text.secondary' }}>
                  Less: product cost of goods sold (COGS)
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({cogsPct}% of total income)
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                  -{formatCurrency(cogs)}
                </TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: 'rgba(16, 185, 129, 0.10)' }}>
                <TableCell sx={{ fontWeight: 700 }}>Contribution after product COGS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'success.dark' }}>
                  {formatCurrency(afterCogs)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 3, color: 'text.secondary' }}>Less: staff commissions (services and products)</TableCell>
                <TableCell align="right" sx={{ color: 'warning.dark', fontWeight: 600 }}>
                  -{formatCurrency(comm)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ pl: 3, color: 'text.secondary' }}>Less: operating expenses (recorded)</TableCell>
                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                  -{formatCurrency(opex)}
                </TableCell>
              </TableRow>
              {inv > 0 && (
                <TableRow>
                  <TableCell sx={{ pl: 3, color: 'text.secondary' }}>
                    Inventory purchases (auto, for tracking)
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {formatCurrency(inv)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow sx={{ bgcolor: net >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.13)' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '1rem' }}>Net profit</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: net >= 0 ? 'success.dark' : 'error.dark',
                  }}
                >
                  {formatCurrency(net)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

