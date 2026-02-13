import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  SwapHoriz as SwapHorizIcon,
  MergeType as MergeTypeIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import axios from 'axios';

const steps = ['統合先の選択', 'フィールド解決', '確認'];

const FIELD_LABELS = {
  name: '顧客名',
  email: 'メールアドレス',
  line_user_id: 'LINE ID',
  phone: '電話番号',
  notes: 'メモ',
  status: 'ステータス',
  expected_move_date: '引越し予定日',
  budget_min: '予算（下限）',
  budget_max: '予算（上限）',
  preferred_areas: '希望エリア',
  requirements: '要望'
};

// Fields that need manual resolution when both differ
const MANUAL_FIELDS = ['name', 'email', 'line_user_id', 'phone', 'expected_move_date', 'budget_min', 'budget_max'];
// Fields that are auto-merged (not shown for selection)
const AUTO_MERGE_FIELDS = ['notes', 'status', 'preferred_areas', 'requirements'];

export default function MergeCustomerDialog({ open, onClose, customer, suggestedSecondaryId, onMerged }) {
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSecondary, setSelectedSecondary] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [fieldResolutions, setFieldResolutions] = useState({});
  const [mergeReason, setMergeReason] = useState('');
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedSecondary(null);
      setPreview(null);
      setFieldResolutions({});
      setMergeReason('');
      setError(null);

      if (suggestedSecondaryId) {
        loadSecondaryById(suggestedSecondaryId);
      }
    }
  }, [open, suggestedSecondaryId]);

  const loadSecondaryById = async (secondaryId) => {
    try {
      const res = await axios.get(`/api/v1/customers/${secondaryId}`);
      setSelectedSecondary(res.data);
      // Auto-advance to step 1 and load preview
      loadPreview(secondaryId);
    } catch (err) {
      console.error('Failed to load secondary customer:', err);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearchLoading(true);
      const res = await axios.get('/api/v1/customers', {
        params: { query: searchQuery.trim(), per_page: 10 }
      });
      // Filter out the primary customer
      setSearchResults(
        (res.data.customers || []).filter(c => c.id !== customer?.id)
      );
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, customer?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const loadPreview = async (secondaryId) => {
    try {
      setPreviewLoading(true);
      setError(null);
      const res = await axios.get(`/api/v1/customers/${customer.id}/merge_preview`, {
        params: { secondary_id: secondaryId }
      });
      setPreview(res.data);

      // Auto-resolve fields where only one has a value
      const autoResolutions = {};
      (res.data.fields || []).forEach(f => {
        if (f.auto_resolved) {
          autoResolutions[f.field] = f.auto_resolved;
        } else if (!f.differs) {
          autoResolutions[f.field] = 'primary';
        }
      });
      setFieldResolutions(autoResolutions);
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'プレビューの読み込みに失敗しました');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSelectSecondary = (cust) => {
    setSelectedSecondary(cust);
    loadPreview(cust.id);
  };

  const handleSwap = () => {
    // Swap primary and secondary - navigate to the other customer's merge
    if (selectedSecondary) {
      window.location.href = `/customers/${selectedSecondary.id}`;
    }
  };

  const handleFieldResolution = (field, value) => {
    setFieldResolutions(prev => ({ ...prev, [field]: value }));
  };

  const allManualFieldsResolved = () => {
    if (!preview) return false;
    return preview.fields
      .filter(f => MANUAL_FIELDS.includes(f.field) && f.differs && !f.auto_resolved)
      .every(f => fieldResolutions[f.field]);
  };

  const handleMerge = async () => {
    try {
      setMerging(true);
      setError(null);
      const res = await axios.post(`/api/v1/customers/${customer.id}/merge`, {
        secondary_id: selectedSecondary.id,
        field_resolutions: fieldResolutions,
        merge_reason: mergeReason || undefined
      });
      onMerged?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || '統合に失敗しました');
    } finally {
      setMerging(false);
    }
  };

  const renderStep0 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" icon={<MergeTypeIcon />}>
        <strong>{customer?.name}</strong> に統合する顧客を選択してください。
        選択した顧客のデータが {customer?.name} に移動されます。
      </Alert>

      <TextField
        fullWidth
        size="small"
        placeholder="名前、メール、電話番号で検索..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          )
        }}
      />

      {searchLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {searchResults.map((c) => (
            <ListItem key={c.id} disablePadding>
              <ListItemButton
                selected={selectedSecondary?.id === c.id}
                onClick={() => handleSelectSecondary(c)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                      {c.has_line && <ChatIcon fontSize="small" color="success" sx={{ fontSize: 16 }} />}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {c.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption">{c.email}</Typography>
                        </Box>
                      )}
                      {c.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption">{c.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
          {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">該当する顧客が見つかりませんでした</Typography>
            </Box>
          )}
        </List>
      )}
    </Box>
  );

  const renderStep1 = () => {
    if (!preview) return null;

    const manualFields = preview.fields.filter(
      f => MANUAL_FIELDS.includes(f.field) && f.differs
    );

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header with swap */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Chip label="残す" color="primary" size="small" sx={{ mb: 0.5 }} />
            <Typography variant="subtitle2" fontWeight={600}>{preview.primary.name}</Typography>
          </Box>
          <Tooltip title="プライマリとセカンダリを入れ替え">
            <IconButton size="small" onClick={handleSwap}>
              <SwapHorizIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ textAlign: 'center' }}>
            <Chip label="統合元" color="default" size="small" sx={{ mb: 0.5 }} />
            <Typography variant="subtitle2">{preview.secondary.name}</Typography>
          </Box>
        </Box>

        <Divider />

        {/* Auto-merge info */}
        <Alert severity="info" variant="outlined">
          メモ・要望は自動的に結合されます。希望エリアは和集合になります。ステータスはアクティブが優先されます。
        </Alert>

        {/* LINE warning */}
        {manualFields.some(f => f.field === 'line_user_id' && f.differs) && (
          <Alert severity="warning" icon={<WarningIcon />}>
            両方にLINE IDがあります。不採用側のLINE接続は切断されます。
          </Alert>
        )}

        {/* Manual field resolution */}
        {manualFields.length === 0 ? (
          <Alert severity="success">フィールドの競合はありません。そのまま統合できます。</Alert>
        ) : (
          manualFields.map((f) => (
            <Box key={f.field} sx={{ p: 1.5, border: '1px solid', borderColor: f.auto_resolved ? 'grey.200' : 'warning.light', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                {f.label}
              </Typography>
              <RadioGroup
                value={fieldResolutions[f.field] || ''}
                onChange={(e) => handleFieldResolution(f.field, e.target.value)}
              >
                <FormControlLabel
                  value="primary"
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="body2">
                      {displayValue(f.primary_value) || <em style={{ color: '#999' }}>（空）</em>}
                    </Typography>
                  }
                />
                <FormControlLabel
                  value="secondary"
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="body2">
                      {displayValue(f.secondary_value) || <em style={{ color: '#999' }}>（空）</em>}
                    </Typography>
                  }
                />
              </RadioGroup>
            </Box>
          ))
        )}
      </Box>
    );
  };

  const renderStep2 = () => {
    if (!preview) return null;
    const pc = preview.related_counts.primary;
    const sc = preview.related_counts.secondary;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="warning" icon={<MergeTypeIcon />}>
          <strong>{preview.secondary.name}</strong> のすべてのデータが <strong>{preview.primary.name}</strong> に移動されます。
          この操作は管理者が取り消すことができます。
        </Alert>

        {/* Data to be moved */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>移動されるデータ</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sc.inquiries > 0 && <Chip size="small" label={`案件 ${sc.inquiries}件`} color="primary" variant="outlined" />}
            {sc.property_inquiries > 0 && <Chip size="small" label={`物件問合せ ${sc.property_inquiries}件`} variant="outlined" />}
            {sc.activities > 0 && <Chip size="small" label={`対応履歴 ${sc.activities}件`} variant="outlined" />}
            {sc.accesses > 0 && <Chip size="small" label={`アクセス権 ${sc.accesses}件`} variant="outlined" />}
            {sc.email_drafts > 0 && <Chip size="small" label={`メール下書き ${sc.email_drafts}件`} variant="outlined" />}
            {sc.inquiries === 0 && sc.property_inquiries === 0 && sc.activities === 0 && sc.accesses === 0 && sc.email_drafts === 0 && (
              <Typography variant="body2" color="text.secondary">移動するデータはありません</Typography>
            )}
          </Box>
        </Box>

        {/* Resolved fields summary */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>採用されるフィールド値</Typography>
          {preview.fields.filter(f => MANUAL_FIELDS.includes(f.field) && f.differs).map(f => {
            const choice = fieldResolutions[f.field];
            const val = choice === 'secondary' ? f.secondary_value : f.primary_value;
            return (
              <Box key={f.field} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>{f.label}:</Typography>
                <Typography variant="caption" fontWeight={600}>{displayValue(val) || '（空）'}</Typography>
              </Box>
            );
          })}
        </Box>

        <TextField
          fullWidth
          size="small"
          label="統合理由（任意）"
          value={mergeReason}
          onChange={(e) => setMergeReason(e.target.value)}
          placeholder="例: 同一人物（電話番号一致）"
        />
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { maxHeight: '85vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MergeTypeIcon color="primary" />
        顧客統合
      </DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {previewLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeStep === 0 && renderStep0()}
            {activeStep === 1 && renderStep1()}
            {activeStep === 2 && renderStep2()}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(prev => prev - 1)}>
            戻る
          </Button>
        )}
        {activeStep === 1 && (
          <Button
            variant="contained"
            onClick={() => setActiveStep(2)}
            disabled={!allManualFieldsResolved()}
          >
            次へ
          </Button>
        )}
        {activeStep === 2 && (
          <Button
            variant="contained"
            color="warning"
            onClick={handleMerge}
            disabled={merging}
            startIcon={merging ? <CircularProgress size={16} /> : <MergeTypeIcon />}
          >
            統合を実行
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function displayValue(val) {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}
