import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  Grid
} from "@mui/material";

export default function BuildingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
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

  useEffect(() => {
    if (isEdit) {
      fetchBuilding();
    }
  }, [id]);

  const fetchBuilding = async () => {
    try {
      const response = await fetch(`/api/v1/buildings/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || "",
          address: data.address || "",
          building_type: data.building_type || "mansion",
          total_units: data.total_units || "",
          built_year: data.built_year || "",
          description: data.description || ""
        });
      } else {
        setError('物件情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

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
      const url = isEdit ? `/api/v1/buildings/${id}` : '/api/v1/buildings';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ building: formData })
      });

      const data = await response.json();

      if (response.ok) {
        // 新規登録時は物件詳細画面へ、更新時は物件一覧へ遷移
        if (isEdit) {
          navigate('/buildings');
        } else {
          // geocodingが失敗しているかチェック（latitude/longitudeがnullまたは存在しない場合）
          const geocodingFailed = !data.latitude || !data.longitude;

          navigate(`/property/${data.id}`, {
            state: { geocodingFailed }
          });
        }
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? '物件情報編集' : '新規物件登録'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
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

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : (isEdit ? '更新する' : '登録する')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/buildings')}
              disabled={submitting}
            >
              キャンセル
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
