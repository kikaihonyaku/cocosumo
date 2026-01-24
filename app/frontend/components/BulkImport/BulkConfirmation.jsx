import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Home as HomeIcon,
  MeetingRoom as RoomIcon,
  Add as AddIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

export default function BulkConfirmation({ historyData }) {
  const items = historyData?.items?.filter(item => item.status === 'analyzed') || [];

  // Group by action type
  const newBuildings = items.filter(item => !item.selected_building_id);
  const existingBuildings = items.filter(item => item.selected_building_id);

  // Format price
  const formatPrice = (price) => {
    if (!price) return '-';
    return `¥${Number(price).toLocaleString()}`;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        登録内容の確認
      </Typography>

      {/* Summary */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {items.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                登録予定件数
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {newBuildings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                新規建物
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">
                {existingBuildings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                既存建物に追加
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="secondary.main">
                {items.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                新規部屋
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* New buildings */}
      {newBuildings.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'success.50', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="success" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              新規建物として登録 ({newBuildings.length}件)
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ファイル名</TableCell>
                  <TableCell>建物名</TableCell>
                  <TableCell>住所</TableCell>
                  <TableCell>部屋番号</TableCell>
                  <TableCell>間取り</TableCell>
                  <TableCell align="right">賃料</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newBuildings.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {item.original_filename}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.edited_data?.building?.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {item.edited_data?.building?.address || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.edited_data?.room?.room_number || '-'}</TableCell>
                    <TableCell>{item.edited_data?.room?.room_type || '-'}</TableCell>
                    <TableCell align="right">
                      {formatPrice(item.edited_data?.room?.rent)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Existing buildings */}
      {existingBuildings.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'info.50', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon color="info" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              既存建物に追加 ({existingBuildings.length}件)
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ファイル名</TableCell>
                  <TableCell>追加先建物</TableCell>
                  <TableCell>部屋番号</TableCell>
                  <TableCell>間取り</TableCell>
                  <TableCell align="right">賃料</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {existingBuildings.map((item) => {
                  const selectedBuilding = item.similar_buildings?.find(
                    b => b.id === item.selected_building_id
                  );
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {item.original_filename}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedBuilding?.name || item.edited_data?.building?.name || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.edited_data?.room?.room_number || '-'}</TableCell>
                      <TableCell>{item.edited_data?.room?.room_type || '-'}</TableCell>
                      <TableCell align="right">
                        {formatPrice(item.edited_data?.room?.rent)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Confirmation message */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          上記の内容で物件を登録します。
        </Typography>
        <Typography variant="body2" color="text.secondary">
          登録後、各物件・部屋の詳細画面で追加情報を編集できます。
          募集図面PDFは各部屋に自動的に添付されます。
        </Typography>
      </Paper>
    </Box>
  );
}
