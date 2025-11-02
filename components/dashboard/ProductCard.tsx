'use client';

import * as React from 'react';
import { Card, CardContent, Box, Typography, IconButton, Menu, MenuItem, Chip } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { useUserRole } from '../../hooks/useUserRole';

export default function ProductCard({
  title,
  price,
  imageSrc,
  imageAlt,
  isActive = true,
  onClick,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  title: string;
  price: string;
  imageSrc?: string;
  imageAlt?: string;
  isActive?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
}) {
  const { userRole } = useUserRole();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [imageError, setImageError] = React.useState(false);
  const open = Boolean(anchorEl);

  // Reset image error when imageSrc changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageSrc]);


  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit?.();
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onDelete?.();
  };

  const handleToggleStatus = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onToggleStatus?.();
  };
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        borderRadius: 3,
        border: `1px solid ${isActive ? '#d1d5db' : '#ef4444'}`,
        boxShadow: '0 8px 0 #0000000d, 0 12px 24px rgba(0,0,0,0.10)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 150ms ease, transform 150ms ease, outline-color 150ms ease, opacity 150ms ease',
        opacity: isActive ? 1 : 0.7,
        '&:hover': onClick ? { borderColor: '#ef4444' } : undefined,
        '&:focus-visible': onClick ? { outline: '2px solid #ef4444', outlineOffset: 2 } : undefined,
        '&:active': onClick ? { transform: 'translateY(1px)' } : undefined,
      }}
    >
      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 'none',
          backgroundColor: '#fff',
        }}
      >
        <Box sx={{ width: '100%', height: { xs: 120, sm: 160 }, position: 'relative', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
          {imageSrc && !imageError ? (
            <Box 
              component="img" 
              src={imageSrc} 
              alt={imageAlt || title} 
              onError={() => setImageError(true)}
              sx={{ 
                position: 'absolute', 
                inset: 0, 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
          ) : (
            <Box 
              sx={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 3s ease infinite',
                '@keyframes gradientShift': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(220, 38, 38, 0.1) 0%, transparent 50%)',
                  zIndex: 1
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, transparent 70%)',
                  zIndex: 1
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, px: 2 }}>
                <ContentCutIcon 
                  sx={{ 
                    fontSize: { xs: 32, sm: 40 }, 
                    color: 'rgba(255, 255, 255, 0.8)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }} 
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 700,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}
                >
                  {title}
                </Typography>
              </Box>
            </Box>
          )}
          {/* Status Chip */}
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 3,
              backgroundColor: isActive ? 'success.main' : 'error.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />
        </Box>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: { xs: 1.25, sm: 2 }, position: 'relative' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 18 } }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 18 } }}>
              {price}
            </Typography>
            {userRole === 'Boss' && (onEdit || onDelete || onToggleStatus) && (
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{ 
                  ml: 1,
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Menu for Boss actions */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            minWidth: 120
          }
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit} sx={{ gap: 1.5, py: 1 }}>
            <EditIcon fontSize="small" />
            Edit
          </MenuItem>
        )}
        {onToggleStatus && (
          <MenuItem onClick={handleToggleStatus} sx={{ gap: 1.5, py: 1, color: isActive ? 'warning.main' : 'success.main' }}>
            {isActive ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            {isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1, color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
