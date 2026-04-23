'use client';

import * as React from 'react';
import DashboardLayout from '../../../components/dashboard/Layout';
import { apiGet } from '../../../src/utils/axios';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material';

type LandingLead = {
  id: string;
  source: string;
  submittedAt: string;
  name: string;
  phone: string;
  service: string;
  message: string;
  ipAddress: string;
  createdAt: string;
};

type LandingLeadResponse = {
  ok: boolean;
  leads: LandingLead[];
  error?: string;
};

const formatDateTime = (value: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function LandingLeadsPage() {
  const [leads, setLeads] = React.useState<LandingLead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLeads = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await apiGet<LandingLeadResponse>('/api/landing-leads?limit=100');
      if (!response.ok) {
        setError(response.error || 'Failed to load leads');
        return;
      }
      setLeads(response.leads || []);
    } catch (err) {
      console.error('Failed to fetch landing leads:', err);
      setError('Failed to fetch landing leads');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Landing Leads
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View contact submissions from your landing page webhook.
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary">
                No landing leads yet. Submit your form and they will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {leads.map((lead) => (
              <Grid item xs={12} key={lead.id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="h6">{lead.name}</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={lead.source || 'unknown source'} size="small" />
                      </Stack>
                    </Stack>
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack spacing={0.8}>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {lead.phone || '-'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Service:</strong> {lead.service || '-'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Message:</strong> {lead.message || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Submitted: {formatDateTime(lead.submittedAt)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </DashboardLayout>
  );
}
