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
  useTheme,
  useMediaQuery
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface Appointment {
  id: number;
  status: string;
  appointmentDate: string | null;
  notes: string | null;
  createdAt: string;
  additionalPackages?: number[];
  customPackages?: any[];
  finalPrice?: number;
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
}

interface AppointmentCardProps {
  appointment: Appointment;
  onMenuClick: (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => void;
  onViewDetails: (appointment: Appointment) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onMenuClick,
  onViewDetails
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <Card 
      sx={{ 
        boxShadow: 'none', 
        border: '1px solid #e5e7eb', 
        borderRadius: 3, 
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)'
        }
      }}
      onClick={() => onViewDetails(appointment)}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with client info and menu */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48, 
                bgcolor: 'primary.main',
                fontSize: '1.2rem',
                fontWeight: 600
              }}
            >
              {appointment.client.fullName.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                sx={{ 
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {appointment.client.fullName}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  fontSize: '0.875rem'
                }}
              >
                <PersonIcon fontSize="small" />
                {appointment.client.clientId}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(e, appointment);
            }}
            sx={{ 
              bgcolor: 'grey.50',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Status chip */}
        <Box sx={{ mb: 2 }}>
          <Chip 
            icon={getStatusIcon(appointment.status)}
            label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            color={getStatusColor(appointment.status) as any}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Service info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: 'text.primary' }}>
            {appointment.package.name}
          </Typography>
          {appointment.package.barber && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Barber: {appointment.package.barber}
            </Typography>
          )}
        </Box>

        {/* Details grid */}
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              Phone:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {appointment.client.phoneNumber}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoneyIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              Price:
            </Typography>
            <Box>
              <Typography variant="body2" fontWeight={600} color="success.main">
                RM{appointment.finalPrice || appointment.package.price}
              </Typography>
              {appointment.finalPrice && appointment.finalPrice !== appointment.package.price && (
                <Typography variant="caption" color="text.secondary">
                  Base: RM{appointment.package.price}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              Duration:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {appointment.package.duration} mins
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              Booked:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatDate(appointment.createdAt)}
            </Typography>
          </Box>

          {appointment.notes && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                Notes:
              </Typography>
              <Typography variant="body2" color="text.primary">
                {appointment.notes}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
