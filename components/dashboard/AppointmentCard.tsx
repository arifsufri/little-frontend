'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Stack,
  Divider,
  Tooltip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface Appointment {
  id: number;
  clientId: number;
  packageId: number;
  status: string;
  appointmentDate: string | null;
  notes: string | null;
  createdAt: string;
  additionalPackages?: number[];
  customPackages?: any[];
  finalPrice?: number;
  hasDiscount?: boolean;
  productSales?: Array<{
    id: number;
    product: {
      id: number;
      name: string;
      price: number;
    };
    quantity: number;
    totalPrice: number;
  }>;
  client: {
    clientId: string;
    fullName: string;
    phoneNumber: string;
  };
  package: {
    name: string;
    description: string;
    price: number;
    duration: number;
    barber: string | null;
    imageUrl: string | null;
  };
  barber?: {
    id: number;
    name: string;
    role: string;
    commissionRate: number;
  } | null;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onMenuClick: (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onMenuClick
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total price including products
  const calculateTotalPrice = () => {
    let total = appointment.finalPrice || appointment.package.price;
    
    // Add product sales if any
    if (appointment.productSales && appointment.productSales.length > 0) {
      const productTotal = appointment.productSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      total += productTotal;
    }
    
    return total;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon fontSize="small" />;
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'cancelled':
        return <CancelIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  return (
    <Card elevation={1}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
              {appointment.client.fullName.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {appointment.client.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {appointment.client.clientId}
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={getStatusIcon(appointment.status)}
            label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            color={getStatusColor(appointment.status) as any}
            size="small"
            variant="filled"
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {appointment.package.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Barber: {appointment.barber?.name || appointment.package.barber || 'Not assigned'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={700} color="success.main">
              RM{calculateTotalPrice().toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {appointment.package.duration} mins
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ minWidth: 0 }}>
            <Chip
              size="small"
              variant="outlined"
              label={appointment.appointmentDate ? formatDate(appointment.appointmentDate) : formatDate(appointment.createdAt)}
            />
            {appointment.hasDiscount && (
              <Chip
                icon={<LocalOfferIcon />}
                label="Discount"
                color="success"
                size="small"
              />
            )}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
              <Tooltip title="Complete">
                <IconButton
                  size="small"
                  onClick={(e) => onMenuClick(e, appointment)}
                >
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {appointment.status !== 'cancelled' && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={(e) => onMenuClick(e, appointment)}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="More actions">
              <IconButton
                size="small"
                onClick={(e) => onMenuClick(e, appointment)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {appointment.notes && (
          <Box sx={{ mt: 1.25, p: 1.25, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Notes
            </Typography>
            <Typography variant="body2">
              {appointment.notes}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
