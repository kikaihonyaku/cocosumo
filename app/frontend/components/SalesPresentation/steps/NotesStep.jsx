import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import {
  Info as InfoIcon,
  EventAvailable as DateIcon,
  Gavel as GuarantorIcon,
  Pets as PetsIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Notes as NotesIcon
} from '@mui/icons-material';

export default function NotesStep({ property, config, isMobile }) {
  const { room, publication } = property;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const conditions = [
    {
      icon: <GuarantorIcon />,
      label: '保証人',
      value: room?.guarantor_required ? '必要' : '不要',
      required: room?.guarantor_required
    },
    {
      icon: <PetsIcon />,
      label: 'ペット',
      value: room?.pets_allowed ? '相談可' : '不可',
      allowed: room?.pets_allowed
    },
    {
      icon: <PeopleIcon />,
      label: '2人入居',
      value: room?.two_person_allowed ? '可' : '不可',
      allowed: room?.two_person_allowed
    },
    {
      icon: <BusinessIcon />,
      label: '事務所利用',
      value: room?.office_use_allowed ? '可' : '不可',
      allowed: room?.office_use_allowed
    }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon color="primary" />
        注意事項
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        契約条件と重要事項をご確認ください
      </Typography>

      <Grid container spacing={3}>
        {/* 入居可能日 */}
        {room?.available_date && (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'success.50',
                border: 1,
                borderColor: 'success.200'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DateIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    入居可能日
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {formatDate(room.available_date)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* 契約条件 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              契約条件
            </Typography>
            <List dense>
              {conditions.map((condition, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {condition.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={condition.label}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                  <Chip
                    size="small"
                    icon={condition.allowed !== undefined ?
                      (condition.allowed ? <CheckIcon /> : <CancelIcon />) :
                      (condition.required ? <CheckIcon /> : <CancelIcon />)
                    }
                    label={condition.value}
                    color={condition.allowed !== undefined ?
                      (condition.allowed ? 'success' : 'default') :
                      (condition.required ? 'warning' : 'success')
                    }
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 備考 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotesIcon color="primary" />
              備考
            </Typography>
            {room?.notes ? (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {room.notes}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                特記事項はありません
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* キャッチコピー */}
        {publication?.catch_copy && (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'primary.50',
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {publication.catch_copy}
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* 説明完了メッセージ */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 2,
              bgcolor: 'grey.100',
              textAlign: 'center'
            }}
          >
            <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              物件説明は以上です
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ご質問やご不明な点がございましたら、お気軽にお申し付けください。
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
