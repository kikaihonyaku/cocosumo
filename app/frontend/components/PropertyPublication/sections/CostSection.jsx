import React from 'react';
import { Box, Typography, Table, TableBody, TableRow, TableCell } from '@mui/material';

const formatCost = (value) => {
  if (value === 0) return 'なし';
  if (value == null) return null;
  return `${value.toLocaleString()}円`;
};

export default function CostSection({ data, visibleFields, colors }) {
  if (!visibleFields.cost_section) return null;

  const room = data.room;
  if (!room) return null;

  const items = [
    { label: '賃料', value: room.rent, highlight: true, visible: visibleFields.rent },
    { label: '管理費・共益費', value: room.management_fee, visible: visibleFields.management_fee },
    { label: '敷金', value: room.deposit, visible: visibleFields.deposit },
    { label: '礼金', value: room.key_money, visible: visibleFields.key_money },
    { label: '更新料', value: room.renewal_fee, visible: true },
    { label: '駐車場料金', value: room.parking_fee, visible: true },
  ].filter(item => item.visible && item.value != null);

  if (items.length === 0) return null;

  return (
    <Box id="cost" sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary, borderBottom: `2px solid ${colors.primary}`, pb: 1, mb: 2 }}>
        賃料・初期費用
      </Typography>
      <Table size="small">
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={item.label} sx={{ bgcolor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '40%', borderBottom: '1px solid #e0e0e0' }}>
                {item.label}
              </TableCell>
              <TableCell sx={{
                borderBottom: '1px solid #e0e0e0',
                ...(item.highlight && { color: colors.primary, fontWeight: 'bold', fontSize: '1.1rem' }),
              }}>
                {formatCost(item.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
