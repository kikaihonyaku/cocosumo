import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from '@mui/material';
import {
  Apartment as BuildingIcon,
  LocalParking as ParkingIcon,
  Elevator as ElevatorIcon,
  DirectionsBike as BikeIcon
} from '@mui/icons-material';

const BUILDING_TYPE_LABELS = {
  apartment: 'アパート',
  mansion: 'マンション',
  house: '戸建て',
  office: 'オフィス'
};

const STRUCTURE_LABELS = {
  wood: '木造',
  steel: '鉄骨造',
  rc: 'RC造',
  src: 'SRC造',
  other: 'その他'
};

export default function BuildingStep({ property, config, isMobile }) {
  const { building } = property;

  const buildingInfo = [
    { label: '建物名', value: building?.name },
    { label: '所在地', value: building?.address },
    { label: '建物種別', value: BUILDING_TYPE_LABELS[building?.building_type] || building?.building_type },
    { label: '構造', value: STRUCTURE_LABELS[building?.structure] || building?.structure },
    { label: '築年', value: building?.built_year ? `${building.built_year}年` : null },
    { label: '階建', value: building?.floors ? `${building.floors}階建` : null },
    { label: '総戸数', value: building?.total_units ? `${building.total_units}戸` : null }
  ].filter(item => item.value);

  const facilities = [
    { icon: <ParkingIcon />, label: '駐車場', available: building?.has_parking },
    { icon: <ElevatorIcon />, label: 'エレベーター', available: building?.has_elevator },
    { icon: <BikeIcon />, label: '駐輪場', available: building?.has_bicycle_parking }
  ].filter(item => item.available);

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BuildingIcon color="primary" />
        建物情報
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        建物の基本情報と設備をご案内します
      </Typography>

      <Grid container spacing={3}>
        {/* 基本情報 */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              基本情報
            </Typography>
            <Table size="small">
              <TableBody>
                {buildingInfo.map((info, index) => (
                  <TableRow key={index}>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        width: '35%',
                        bgcolor: 'grey.50',
                        borderBottom: index === buildingInfo.length - 1 ? 0 : undefined
                      }}
                    >
                      {info.label}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: index === buildingInfo.length - 1 ? 0 : undefined
                      }}
                    >
                      {info.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* 設備 */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              建物設備
            </Typography>
            {facilities.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {facilities.map((facility, index) => (
                  <Chip
                    key={index}
                    icon={facility.icon}
                    label={facility.label}
                    color="primary"
                    variant="outlined"
                    sx={{ py: 2 }}
                  />
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                建物設備の情報はありません
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 建物名を大きく表示 */}
      {building?.name && (
        <Paper
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 2,
            bgcolor: 'primary.50',
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            {building.name}
          </Typography>
          {building.address && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {building.address}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
