import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Fab,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  CompareArrows as CompareIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import {
  getCompareList,
  removeFromComparison,
  clearComparison,
  getCompareCount
} from '../../services/comparison';

// 間取りラベル
const getRoomTypeLabel = (roomType) => {
  const labels = {
    'studio': 'ワンルーム',
    '1K': '1K',
    '1DK': '1DK',
    '1LDK': '1LDK',
    '2K': '2K',
    '2DK': '2DK',
    '2LDK': '2LDK',
    '3K': '3K',
    '3DK': '3DK',
    '3LDK': '3LDK',
    'other': 'その他'
  };
  return labels[roomType] || roomType || '-';
};

// 建物種別ラベル
const getBuildingTypeLabel = (buildingType) => {
  const labels = {
    'apartment': 'アパート',
    'mansion': 'マンション',
    'house': '一戸建て',
    'office': 'オフィス'
  };
  return labels[buildingType] || buildingType || '-';
};

// 金額フォーマット
const formatCurrency = (value) => {
  if (!value) return '-';
  return `${value.toLocaleString()}円`;
};

// 比較行の定義
const COMPARE_ROWS = [
  { key: 'rent', label: '賃料', format: formatCurrency, highlight: true },
  { key: 'managementFee', label: '管理費', format: formatCurrency },
  { key: 'deposit', label: '敷金', format: formatCurrency },
  { key: 'keyMoney', label: '礼金', format: formatCurrency },
  { key: 'roomType', label: '間取り', format: getRoomTypeLabel },
  { key: 'area', label: '面積', format: (v) => v ? `${v}m²` : '-' },
  { key: 'floor', label: '階数', format: (v) => v ? `${v}階` : '-' },
  { key: 'builtYear', label: '築年', format: (v) => v ? `${v}年` : '-' },
  { key: 'buildingType', label: '建物種別', format: getBuildingTypeLabel },
  { key: 'structure', label: '構造', format: (v) => v || '-' },
  { key: 'address', label: '所在地', format: (v) => v || '-' }
];

export default function PropertyCompareDrawer() {
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const updateList = () => {
      setProperties(getCompareList());
    };

    updateList();

    window.addEventListener('comparison-updated', updateList);
    return () => window.removeEventListener('comparison-updated', updateList);
  }, []);

  const handleRemove = (publicationId) => {
    removeFromComparison(publicationId);
  };

  const handleClear = () => {
    clearComparison();
    setOpen(false);
  };

  const handleOpenProperty = (publicationId) => {
    window.open(`/p/${publicationId}`, '_blank');
  };

  const count = getCompareCount();

  return (
    <>
      {/* Floating Action Button */}
      {count > 0 && (
        <Tooltip title="物件を比較する">
          <Fab
            color="primary"
            onClick={() => setOpen(true)}
            aria-label={`${count}件の物件を比較`}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
              '@media print': { display: 'none' }
            }}
          >
            <Badge badgeContent={count} color="error" max={4}>
              <CompareIcon />
            </Badge>
          </Fab>
        </Tooltip>
      )}

      {/* Comparison Drawer */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              物件比較（{properties.length}件）
            </Typography>
            <Box>
              {properties.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleClear}
                  sx={{ mr: 1 }}
                >
                  すべて削除
                </Button>
              )}
              <IconButton onClick={() => setOpen(false)} aria-label="閉じる">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {properties.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CompareIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                比較する物件がありません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                物件ページで「比較する」ボタンを押して物件を追加してください
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: isMobile ? 600 : 800 }}>
                <TableBody>
                  {/* Property Headers with Images */}
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'grey.100',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        minWidth: 100
                      }}
                    >
                      物件名
                    </TableCell>
                    {properties.map((property) => (
                      <TableCell
                        key={property.publicationId}
                        sx={{ minWidth: 180, maxWidth: 250 }}
                      >
                        <Paper variant="outlined" sx={{ p: 1 }}>
                          {property.thumbnailUrl && (
                            <Box
                              component="img"
                              src={property.thumbnailUrl}
                              alt={property.title}
                              sx={{
                                width: '100%',
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: 1,
                                mb: 1
                              }}
                            />
                          )}
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {property.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenProperty(property.publicationId)}
                              aria-label="物件ページを開く"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemove(property.publicationId)}
                              aria-label="比較から削除"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Comparison Rows */}
                  {COMPARE_ROWS.map((row, index) => (
                    <TableRow key={row.key} sx={{ bgcolor: index % 2 === 0 ? 'grey.50' : 'white' }}>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: 'grey.100',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1
                        }}
                      >
                        {row.label}
                      </TableCell>
                      {properties.map((property) => {
                        const value = property[row.key];
                        const formatted = row.format(value);
                        const isHighlight = row.highlight && value;

                        return (
                          <TableCell
                            key={property.publicationId}
                            sx={{
                              color: isHighlight ? 'primary.main' : 'inherit',
                              fontWeight: isHighlight ? 'bold' : 'normal',
                              fontSize: isHighlight ? '1.1rem' : 'inherit'
                            }}
                          >
                            {formatted}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}

                  {/* Total Cost Row (calculated) */}
                  <TableRow sx={{ bgcolor: 'primary.lighter' }}>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'primary.main',
                        color: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1
                      }}
                    >
                      初期費用合計
                    </TableCell>
                    {properties.map((property) => {
                      const rent = property.rent || 0;
                      const deposit = property.deposit || 0;
                      const keyMoney = property.keyMoney || 0;
                      const total = rent + deposit + keyMoney;

                      return (
                        <TableCell
                          key={property.publicationId}
                          sx={{
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            color: 'primary.main'
                          }}
                        >
                          {total > 0 ? formatCurrency(total) : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}
