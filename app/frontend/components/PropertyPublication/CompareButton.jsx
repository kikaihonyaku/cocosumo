import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Button,
  Tooltip,
  Snackbar,
  Alert,
  Badge
} from '@mui/material';
import {
  CompareArrows as CompareIcon
} from '@mui/icons-material';
import {
  isInComparison,
  toggleComparison,
  getCompareCount,
  getMaxCompareCount
} from '../../services/comparison';
import { trackEvent } from '../../services/analytics';

export default function CompareButton({
  publicationId,
  title,
  catchCopy,
  thumbnailUrl,
  address,
  rent,
  managementFee,
  deposit,
  keyMoney,
  roomType,
  area,
  floor,
  builtYear,
  buildingType,
  structure,
  facilities,
  size = 'medium',
  variant = 'icon', // 'icon' or 'button'
  showBadge = false,
  sx = {}
}) {
  const [inComparison, setInComparison] = useState(false);
  const [compareCount, setCompareCount] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const maxCount = getMaxCompareCount();

  useEffect(() => {
    setInComparison(isInComparison(publicationId));
    setCompareCount(getCompareCount());

    // Listen for comparison updates from other components
    const handleUpdate = () => {
      setInComparison(isInComparison(publicationId));
      setCompareCount(getCompareCount());
    };

    window.addEventListener('comparison-updated', handleUpdate);
    return () => window.removeEventListener('comparison-updated', handleUpdate);
  }, [publicationId]);

  const handleToggle = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const property = {
      publicationId,
      title,
      catchCopy,
      thumbnailUrl,
      address,
      rent,
      managementFee,
      deposit,
      keyMoney,
      roomType,
      area,
      floor,
      builtYear,
      buildingType,
      structure,
      facilities
    };

    const result = toggleComparison(property);

    if (result.success) {
      setInComparison(result.inList);
      setCompareCount(getCompareCount());

      // Track analytics
      trackEvent(result.inList ? 'add_to_comparison' : 'remove_from_comparison', {
        publication_id: publicationId
      });

      setSnackbarMessage(result.inList ? '比較リストに追加しました' : '比較リストから削除しました');
      setSnackbarSeverity('success');
    } else {
      setSnackbarMessage(result.message || 'エラーが発生しました');
      setSnackbarSeverity('warning');
    }
    setSnackbarOpen(true);
  }, [
    publicationId, title, catchCopy, thumbnailUrl, address,
    rent, managementFee, deposit, keyMoney, roomType, area,
    floor, builtYear, buildingType, structure, facilities
  ]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const tooltipTitle = inComparison
    ? '比較リストから削除'
    : compareCount >= maxCount
    ? `比較リストは最大${maxCount}件までです`
    : '比較リストに追加';

  const isDisabled = !inComparison && compareCount >= maxCount;

  const buttonContent = (
    <>
      {showBadge && compareCount > 0 ? (
        <Badge badgeContent={compareCount} color="primary" max={maxCount}>
          <CompareIcon fontSize={size} />
        </Badge>
      ) : (
        <CompareIcon fontSize={size} />
      )}
    </>
  );

  return (
    <>
      <Tooltip title={tooltipTitle}>
        {variant === 'button' ? (
          <Button
            onClick={handleToggle}
            disabled={isDisabled}
            variant={inComparison ? 'contained' : 'outlined'}
            color={inComparison ? 'primary' : 'inherit'}
            startIcon={buttonContent}
            size={size}
            aria-label={tooltipTitle}
            aria-pressed={inComparison}
            sx={{
              '@media print': { display: 'none' },
              ...sx
            }}
          >
            {inComparison ? '比較中' : '比較する'}
          </Button>
        ) : (
          <IconButton
            onClick={handleToggle}
            disabled={isDisabled}
            size={size}
            aria-label={tooltipTitle}
            aria-pressed={inComparison}
            sx={{
              color: inComparison ? 'primary.main' : 'action.active',
              bgcolor: inComparison ? 'primary.lighter' : 'transparent',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'primary.lighter'
              },
              transition: 'all 0.2s ease',
              '@media print': { display: 'none' },
              ...sx
            }}
          >
            {buttonContent}
          </IconButton>
        )}
      </Tooltip>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
