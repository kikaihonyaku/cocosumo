import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DateField from '../components/shared/DateField';
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
  Grid,
  FormControlLabel,
  Checkbox,
  Divider
} from "@mui/material";
import StationSelect from "../components/shared/StationSelect";
import useRailwayLines from "../hooks/useRailwayLines";

export default function BuildingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stores, setStores] = useState([]);
  const [buildingStations, setBuildingStations] = useState([]);
  const { railwayData } = useRailwayLines();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    building_type: "mansion",
    total_units: "",
    built_date: "",
    description: "",
    has_elevator: false,
    has_bicycle_parking: false,
    has_parking: false,
    parking_spaces: "",
    store_id: ""
  });

  useEffect(() => {
    fetchStores();
    if (isEdit) {
      fetchBuilding();
    }
  }, [id]);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/v1/stores', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (err) {
      console.error('店舗取得エラー:', err);
    }
  };

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
          built_date: data.built_date || "",
          description: data.description || "",
          has_elevator: data.has_elevator || false,
          has_bicycle_parking: data.has_bicycle_parking || false,
          has_parking: data.has_parking || false,
          parking_spaces: data.parking_spaces || "",
          store_id: data.store_id || ""
        });
        if (data.building_stations) {
          setBuildingStations(
            data.building_stations.map(bs => ({
              station_id: bs.station_id || bs.station?.id,
              walking_minutes: bs.walking_minutes || '',
              _selectedLineId: bs.station?.railway_line?.id || '',
            }))
          );
        }
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        body: JSON.stringify({
          building: formData,
          building_stations: buildingStations.filter(bs => bs.station_id).map((bs, i) => ({
            station_id: bs.station_id,
            walking_minutes: bs.walking_minutes || null,
            display_order: i,
          })),
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 新規登録時は物件詳細画面へ、更新時は物件一覧へ遷移
        if (isEdit) {
          navigate('/buildings');
        } else {
          // geocodingが失敗しているかチェック（latitude/longitudeがnullまたは存在しない場合）
          const geocodingFailed = !data.latitude || !data.longitude;

          navigate(`/building/${data.id}`, {
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
                autoComplete="off"
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
                autoComplete="street-address"
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
                select
                fullWidth
                label="店舗"
                name="store_id"
                value={formData.store_id}
                onChange={handleChange}
                disabled={submitting}
                helperText="この物件を担当する店舗を選択"
              >
                <MenuItem value="">
                  <em>未選択</em>
                </MenuItem>
                {stores.map((store) => (
                  <MenuItem key={store.id} value={store.id}>
                    {store.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateField
                fullWidth
                label="築年月日"
                value={formData.built_date || ""}
                onChange={(val) => setFormData(prev => ({ ...prev, built_date: val }))}
                disabled={submitting}
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

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ mt: 2, mb: 1 }}>
                <StationSelect
                  railwayData={railwayData}
                  value={buildingStations}
                  onChange={setBuildingStations}
                  disabled={submitting}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                建物設備
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_elevator}
                    onChange={handleChange}
                    name="has_elevator"
                    disabled={submitting}
                  />
                }
                label="エレベーター"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_bicycle_parking}
                    onChange={handleChange}
                    name="has_bicycle_parking"
                    disabled={submitting}
                  />
                }
                label="駐輪場"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_parking}
                    onChange={handleChange}
                    name="has_parking"
                    disabled={submitting}
                  />
                }
                label="駐車場"
              />
            </Grid>

            {formData.has_parking && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="駐車場台数"
                  name="parking_spaces"
                  type="number"
                  value={formData.parking_spaces}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </Grid>
            )}
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
