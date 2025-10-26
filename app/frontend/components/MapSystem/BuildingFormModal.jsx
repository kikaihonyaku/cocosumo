import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Grid,
  IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

export default function BuildingFormModal({ isOpen, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    building_type: "mansion",
    total_units: "",
    built_year: "",
    description: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch('/api/v1/buildings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ building: formData })
      });

      const data = await response.json();

      if (response.ok) {
        // 成功時のコールバックを実行（物件IDを渡す）
        if (onSuccess) {
          onSuccess(data);
        }
        // フォームをリセット
        setFormData({
          name: "",
          address: "",
          building_type: "mansion",
          total_units: "",
          built_year: "",
          description: ""
        });
        // モーダルを閉じる
        onClose();
      } else {
        setError(data.errors?.join(', ') || '保存に失敗しました');
      }
    } catch (err) {
      console.error('保存エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError("");
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white',
          m: 0,
          px: 2,
          py: 0.5,
          minHeight: '40px'
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          新規物件登録
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={submitting}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="物件名"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="住所"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={submitting}
                helperText="住所から自動的に地図上の位置を取得します"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                required
                fullWidth
                label="物件種別"
                name="building_type"
                value={formData.building_type}
                onChange={handleChange}
                disabled={submitting}
              >
                <MenuItem value="mansion">マンション</MenuItem>
                <MenuItem value="apartment">アパート</MenuItem>
                <MenuItem value="house">一戸建て</MenuItem>
                <MenuItem value="office">オフィス</MenuItem>
                <MenuItem value="store">店舗</MenuItem>
                <MenuItem value="other">その他</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="総戸数"
                name="total_units"
                type="number"
                value={formData.total_units}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="築年"
                name="built_year"
                type="number"
                placeholder="2020"
                value={formData.built_year}
                onChange={handleChange}
                disabled={submitting}
                helperText="西暦で入力"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="説明"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={submitting}
            sx={{
              minWidth: 100,
              borderColor: 'grey.300',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'grey.400',
                backgroundColor: 'grey.50'
              }
            }}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              minWidth: 100,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 2
              }
            }}
          >
            {submitting ? <CircularProgress size={24} /> : '登録する'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
