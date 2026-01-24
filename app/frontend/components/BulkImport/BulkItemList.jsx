import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Star as StarIcon,
} from '@mui/icons-material';

import BulkItemEditor from './BulkItemEditor';

const getStatusColor = (status) => {
  switch (status) {
    case 'analyzed':
      return 'success';
    case 'error':
      return 'error';
    case 'registered':
      return 'info';
    default:
      return 'default';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'analyzed':
      return '解析完了';
    case 'error':
      return 'エラー';
    case 'registered':
      return '登録済み';
    default:
      return '待機中';
  }
};

export default function BulkItemList({ items, onItemEdit }) {
  const [expandedId, setExpandedId] = useState(null);

  const handleAccordionChange = (itemId) => (event, isExpanded) => {
    setExpandedId(isExpanded ? itemId : null);
  };

  const analyzedItems = items.filter(item => item.status === 'analyzed');
  const errorItems = items.filter(item => item.status === 'error');

  return (
    <Box>
      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip
          icon={<CheckCircleIcon />}
          label={`解析成功: ${analyzedItems.length}件`}
          color="success"
          variant="outlined"
        />
        {errorItems.length > 0 && (
          <Chip
            icon={<ErrorIcon />}
            label={`エラー: ${errorItems.length}件`}
            color="error"
            variant="outlined"
          />
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        各項目を展開して、解析結果を確認・編集できます。類似建物が見つかった場合は選択して既存建物に部屋を追加できます。
      </Typography>

      {/* Item list */}
      {items.map((item) => (
        <Accordion
          key={item.id}
          expanded={expandedId === item.id}
          onChange={handleAccordionChange(item.id)}
          sx={{
            mb: 1,
            '&:before': { display: 'none' },
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: item.status === 'error' ? 'error.50' : 'grey.50',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
              <Chip
                label={getStatusLabel(item.status)}
                size="small"
                color={getStatusColor(item.status)}
              />

              <Typography sx={{ fontWeight: 500, flex: 1 }}>
                {item.original_filename}
              </Typography>

              {item.status === 'analyzed' && (
                <Grid container spacing={1} sx={{ flex: 2 }}>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.edited_data?.building?.name || '建物名未取得'}
                    </Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.edited_data?.room?.room_number || '-'}号室
                    </Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.edited_data?.room?.rent ? `${Number(item.edited_data.room.rent).toLocaleString()}円` : '-'}
                    </Typography>
                  </Grid>
                </Grid>
              )}

              {item.has_recommended_building && !item.selected_building_id && (
                <Chip
                  icon={<StarIcon />}
                  label="類似建物あり"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}

              {item.selected_building_id && (
                <Chip
                  label="既存建物に追加"
                  size="small"
                  color="primary"
                />
              )}

              {item.status === 'error' && (
                <Typography variant="body2" color="error" sx={{ maxWidth: 200 }} noWrap>
                  {item.error_message}
                </Typography>
              )}
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 0 }}>
            {item.status === 'analyzed' && (
              <BulkItemEditor
                item={item}
                onSave={(editedData, selectedBuildingId) =>
                  onItemEdit(item.id, editedData, selectedBuildingId)
                }
              />
            )}

            {item.status === 'error' && (
              <Box sx={{ p: 3 }}>
                <Typography color="error">
                  {item.error_message}
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
