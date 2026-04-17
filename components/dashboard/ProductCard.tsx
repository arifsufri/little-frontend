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
  retailMeta,
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
  /** Extra line for retail (e.g. margin / unit profit) */
  retailMeta?: string;
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
        border: '1px solid',
        borderColor: isActive ? '#e2e8f0' : '#fecaca',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 150ms ease, transform 150ms ease, outline-color 150ms ease, opacity 150ms ease',
        opacity: isActive ? 1 : 0.9,
        '&:hover': onClick ? { borderColor: '#fca5a5', transform: 'translateY(-2px)' } : undefined,
        '&:focus-visible': onClick ? { outline: '2px solid #ef4444', outlineOffset: 2 } : undefined,
        '&:active': onClick ? { transform: 'translateY(0px)' } : undefined,
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
                objectFit: 'cover',
                transition: 'transform 220ms ease',
                '.MuiBox-root:hover &': { transform: 'scale(1.04)' },
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
              backgroundColor: isActive ? '#ecfdf5' : '#fef2f2',
              color: isActive ? '#047857' : '#b91c1c',
              border: '1px solid',
              borderColor: isActive ? '#6ee7b7' : '#fca5a5',
              fontWeight: 700,
              fontSize: '0.72rem',
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />
        </Box>
        <CardContent sx={{ display: 'flex', flexDirection: retailMeta ? 'column' : 'row', alignItems: retailMeta ? 'stretch': 'center', justifyContent: 'space-between', gap: retailMeta ? 0.8 : 2, py: { xs: 1.4, sm: 2 }, px: { xs: 1.2, sm: 2 }, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 1, sm: 2 }, width: '100%', minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: 13, sm: 18 },
                lineHeight: 1.2,
                minWidth: 0,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={title}
            >
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: 13, sm: 18 }, color: '#b91c1c', whiteSpace: 'nowrap' }}>
                {price}
              </Typography>
              {userRole === 'Boss' && (onEdit || onDelete || onToggleStatus) && (
                <IconButton
                  size="small"
                  onClick={handleMenuClick}
                  sx={{ 
                    ml: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    width: { xs: 26, sm: 28 },
                    height: { xs: 26, sm: 28 },
                    '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.08)' }
                  }}
                >
                  <MoreVertIcon sx={{ fontSize: { xs: 16, sm: 17 } }} />
                </IconButton>
              )}
            </Box>
          </Box>
          {retailMeta ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                pr: userRole === 'Boss' ? 4 : 0,
                p: 1,
                borderRadius: 1.5,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              {retailMeta}
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      {/* Menu for Boss actions */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 14px 30px rgba(15, 23, 42, 0.14)',
            minWidth: 140,
            p: 0.5,
          }
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit} sx={{ gap: 1.5, py: 1, borderRadius: 1.5 }}>
            <EditIcon fontSize="small" />
            Edit
          </MenuItem>
        )}
        {onToggleStatus && (
          <MenuItem onClick={handleToggleStatus} sx={{ gap: 1.5, py: 1, color: isActive ? 'warning.main' : 'success.main', borderRadius: 1.5 }}>
            {isActive ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            {isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1, color: 'error.main', borderRadius: 1.5 }}>
            <DeleteIcon fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
