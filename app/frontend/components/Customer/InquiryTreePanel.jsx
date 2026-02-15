import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItemButton,
  Collapse,
  Button
} from '@mui/material';
import {
  Flag as FlagIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Person as PersonIcon,
  OpenInNew as OpenInNewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

// Status maps (shared with parent)
const INQUIRY_STATUS_MAP = {
  active: { label: 'アクティブ', color: 'success' },
  on_hold: { label: '保留中', color: 'warning' },
  closed: { label: 'クローズ', color: 'default' }
};

const getInquiryStatusInfo = (status) =>
  INQUIRY_STATUS_MAP[status] || { label: status || 'アクティブ', color: 'default' };

const DEAL_STATUS_MAP = {
  new_inquiry: { label: '新規反響', color: 'info' },
  contacting: { label: '対応中', color: 'primary' },
  viewing_scheduled: { label: '内見予約', color: 'secondary' },
  viewing_done: { label: '内見済', color: 'warning' },
  application: { label: '申込', color: 'success' },
  contracted: { label: '成約', color: 'success' },
  lost: { label: '失注', color: 'error' }
};

const getDealStatusInfo = (status) =>
  DEAL_STATUS_MAP[status] || { label: status, color: 'default' };

const getPIStatusInfo = (status) => {
  const statusMap = {
    pending: { label: '未対応', color: 'error' },
    status_pending: { label: '未対応', color: 'error' },
    in_progress: { label: '対応中', color: 'warning' },
    status_in_progress: { label: '対応中', color: 'warning' },
    completed: { label: '完了', color: 'success' },
    status_completed: { label: '完了', color: 'success' }
  };
  return statusMap[status] || { label: status || '未対応', color: 'default' };
};

export default function InquiryTreePanel({
  inquiries,
  selectedInquiryId,
  selectedPropertyInquiryId,
  onInquirySelect,
  onPropertyInquirySelect,
  onCreateInquiry,
  onEditInquiry,
  onAddActivity,
  onEditPropertyInquiry,
  onPIStatusClick,
  onAddProperty
}) {
  const [expandedInquiries, setExpandedInquiries] = useState(new Set());

  // Auto-expand selected inquiry
  useEffect(() => {
    if (selectedInquiryId) {
      setExpandedInquiries(prev => {
        const next = new Set(prev);
        next.add(selectedInquiryId);
        return next;
      });
    }
  }, [selectedInquiryId]);

  const toggleExpand = (inquiryId, e) => {
    e.stopPropagation();
    setExpandedInquiries(prev => {
      const next = new Set(prev);
      if (next.has(inquiryId)) {
        next.delete(inquiryId);
      } else {
        next.add(inquiryId);
      }
      return next;
    });
  };

  return (
    <>
      {/* Panel Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          minHeight: 48,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlagIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            案件一覧
          </Typography>
          <Chip label={inquiries.length} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
        </Box>
        <Tooltip title="案件を作成">
          <IconButton size="small" color="primary" onClick={onCreateInquiry}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ overflow: 'auto', flex: 1 }}>
        {inquiries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <FlagIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              案件はありません
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onCreateInquiry}
            >
              案件を作成
            </Button>
          </Box>
        ) : (
          <List dense disablePadding>
            {inquiries.map((inquiry) => {
              const inquiryStatusInfo = getInquiryStatusInfo(inquiry.status);
              const isSelected = selectedInquiryId === inquiry.id;
              const isExpanded = expandedInquiries.has(inquiry.id);
              const propertyInquiries = inquiry.property_inquiries || [];
              const hasChildren = propertyInquiries.length > 0;

              return (
                <React.Fragment key={inquiry.id}>
                  {/* Inquiry Row */}
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onInquirySelect(inquiry.id)}
                    sx={{
                      py: 0.75,
                      borderBottom: !isExpanded ? '1px solid' : 'none',
                      borderColor: 'divider',
                      '&.Mui-selected': {
                        bgcolor: '#bbdefb',
                        borderLeft: '3px solid',
                        borderLeftColor: 'primary.main',
                        '&:hover': { bgcolor: '#90caf9' },
                      },
                    }}
                  >
                    {/* Expand/Collapse toggle */}
                    <IconButton
                      size="small"
                      onClick={(e) => toggleExpand(inquiry.id, e)}
                      sx={{ p: 0.25, mr: 0.5, visibility: hasChildren ? 'visible' : 'hidden' }}
                    >
                      {isExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                    </IconButton>

                    <FlagIcon fontSize="small" color={inquiryStatusInfo.color} sx={{ mr: 0.75, flexShrink: 0 }} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          案件 #{inquiry.id}
                        </Typography>
                        <Chip
                          size="small"
                          label={inquiry.status_label || inquiryStatusInfo.label}
                          color={inquiryStatusInfo.color}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        {inquiry.assigned_user && (
                          <>
                            <PersonIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }} noWrap>
                              {inquiry.assigned_user.name}
                            </Typography>
                          </>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {inquiry.created_at}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexShrink: 0, ml: 0.5 }}>
                      <Tooltip title="編集" placement="top">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); onEditInquiry(inquiry); }}
                          sx={{ p: 0.25 }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="履歴追加" placement="top">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); onAddActivity(inquiry.id); }}
                          sx={{ p: 0.25 }}
                        >
                          <AddIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemButton>

                  {/* Children (Property Inquiries) */}
                  <Collapse in={isExpanded} unmountOnExit>
                    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pl: 2 }}>
                      {propertyInquiries.map((pi) => {
                        const piStatusInfo = getPIStatusInfo(pi.status);
                        const piDealStatusInfo = getDealStatusInfo(pi.deal_status);
                        const isPiSelected = selectedPropertyInquiryId === pi.id;
                        return (
                          <ListItemButton
                            key={pi.id}
                            selected={isPiSelected}
                            onClick={() => onPropertyInquirySelect(pi.id)}
                            sx={{
                              py: 0.5,
                              pl: 3,
                              '&.Mui-selected': {
                                bgcolor: '#bbdefb',
                                borderLeft: '3px solid',
                                borderLeftColor: 'primary.main',
                                '&:hover': { bgcolor: '#90caf9' },
                              },
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" fontWeight={600} noWrap sx={{ flex: 1 }}>
                                  {pi.property_title || '物件名なし'}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={pi.deal_status_label || piDealStatusInfo.label}
                                  color={piDealStatusInfo.color}
                                  sx={{ height: 16, fontSize: '0.6rem' }}
                                />
                                <Tooltip title="クリックしてステータスを変更">
                                  <Chip
                                    size="small"
                                    label={pi.status_label || piStatusInfo.label}
                                    color={piStatusInfo.color}
                                    onClick={(e) => onPIStatusClick(e, pi.id)}
                                    sx={{ height: 16, fontSize: '0.6rem', cursor: 'pointer' }}
                                  />
                                </Tooltip>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexShrink: 0, ml: 0.5 }}>
                              {pi.room?.id && (
                                <Tooltip title="部屋詳細を別タブで開く" placement="top">
                                  <IconButton
                                    size="small"
                                    component="a"
                                    href={`/room/${pi.room.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{ p: 0.25 }}
                                  >
                                    <OpenInNewIcon sx={{ fontSize: 12 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="編集" placement="top">
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); onEditPropertyInquiry(pi); }}
                                  sx={{ p: 0.25 }}
                                >
                                  <EditIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemButton>
                        );
                      })}
                      <ListItemButton
                        onClick={(e) => { e.stopPropagation(); onAddProperty(inquiry.id); }}
                        sx={{ py: 0.25, pl: 3 }}
                      >
                        <AddIcon sx={{ fontSize: 14, color: 'primary.main', mr: 0.5 }} />
                        <Typography variant="caption" color="primary">
                          物件を追加
                        </Typography>
                      </ListItemButton>
                    </Box>
                  </Collapse>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </>
  );
}
