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
  clientId: number;
  packageId: number;
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
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
        border: 'none', 
        borderRadius: { xs: 4, sm: 5 }, 
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
               '&:hover': {
                 outline: '2px solid #8B0000',
                 outlineOffset: '-2px'
               }
      }}
      onClick={() => onViewDetails(appointment)}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header with client info and menu */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between', 
          mb: { xs: 1.5, sm: 2 },
          gap: { xs: 1, sm: 2 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, flex: 1, minWidth: 0 }}>
            <Avatar 
              sx={{ 
                width: { xs: 40, sm: 48 }, 
                height: { xs: 40, sm: 48 }, 
                bgcolor: 'primary.main',
                fontSize: { xs: '1rem', sm: '1.2rem' },
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
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.2,
                  mb: { xs: 0.25, sm: 0.5 },
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
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
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
              '&:hover': { bgcolor: 'grey.100' },
              width: { xs: 32, sm: 36 },
              height: { xs: 32, sm: 36 }
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Status chip */}
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Chip 
            icon={getStatusIcon(appointment.status)}
            label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            color={getStatusColor(appointment.status) as any}
            size="small"
            variant="outlined"
            sx={{ 
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.8125rem' }
            }}
          />
        </Box>

        <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

        {/* Service info */}
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Typography 
            variant="subtitle1" 
            fontWeight={600} 
            sx={{ 
              mb: { xs: 0.5, sm: 1 }, 
              color: 'text.primary',
              fontSize: { xs: '0.95rem', sm: '1rem' },
              lineHeight: 1.3
            }}
          >
            {appointment.package.name}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            Barber: {appointment.barber?.name || appointment.package.barber || 'Not assigned'}
          </Typography>
        </Box>

        {/* Details grid */}
        <Stack spacing={{ xs: 1, sm: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                minWidth: { xs: 50, sm: 60 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Phone:
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={500}
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {appointment.client.phoneNumber}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
            <AttachMoneyIcon fontSize="small" color="action" />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                minWidth: { xs: 50, sm: 60 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Price:
            </Typography>
            <Box>
              <Typography 
                variant="body2" 
                fontWeight={600} 
                color="success.main"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                RM{appointment.finalPrice || appointment.package.price}
              </Typography>
              {appointment.finalPrice && appointment.finalPrice !== appointment.package.price && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  Base: RM{appointment.package.price}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                minWidth: { xs: 50, sm: 60 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Duration:
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={500}
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {appointment.package.duration} mins
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                minWidth: { xs: 50, sm: 60 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Booked:
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={500}
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {formatDate(appointment.createdAt)}
            </Typography>
          </Box>

          {appointment.notes && (
            <Box sx={{ 
              mt: { xs: 1, sm: 1 }, 
              p: { xs: 1.5, sm: 2 }, 
              bgcolor: 'grey.50', 
              borderRadius: { xs: 1.5, sm: 2 } 
            }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 0.5, 
                  fontWeight: 500,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Notes:
              </Typography>
              <Typography 
                variant="body2" 
                color="text.primary"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  lineHeight: 1.4
                }}
              >
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
