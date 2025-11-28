import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

export default function RoomForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('building_id');
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [formData, setFormData] = useState({
    building_id: buildingId || "",
    room_number: "",
    floor: "",
    room_type: "one_ldk",
    area: "",
    rent: "",
    management_fee: "",
    deposit: "",
    key_money: "",
    status: "vacant",
    description: "",
    direction: "",
    parking_fee: "",
    available_date: "",
    renewal_fee: "",
    guarantor_required: true,
    pets_allowed: false,
    two_person_allowed: false,
    office_use_allowed: false
  });

  useEffect(() => {
    fetchBuildings();
    if (isEdit) {
      fetchRoom();
    }
  }, [id]);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/v1/buildings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (err) {
      console.error('物件取得エラー:', err);
    }
  };

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          building_id: data.building_id || "",
          room_number: data.room_number || "",
          floor: data.floor || "",
          room_type: data.room_type || "one_ldk",
          area: data.area || "",
          rent: data.rent || "",
          management_fee: data.management_fee || "",
          deposit: data.deposit || "",
          key_money: data.key_money || "",
          status: data.status || "vacant",
          description: data.description || "",
          direction: data.direction || "",
          parking_fee: data.parking_fee || "",
          available_date: data.available_date || "",
          renewal_fee: data.renewal_fee || "",
          guarantor_required: data.guarantor_required ?? true,
          pets_allowed: data.pets_allowed || false,
          two_person_allowed: data.two_person_allowed || false,
          office_use_allowed: data.office_use_allowed || false
        });
      } else {
        setError('部屋情報の取得に失敗しました');
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
      // 新規作成時はネストされたルート、編集時はスタンドアロンルートを使用
      const url = isEdit ? `/api/v1/rooms/${id}` : `/api/v1/buildings/${formData.building_id}/rooms`;
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: formData })
      });

      const data = await response.json();

      if (response.ok) {
        // 物件詳細ページに戻る
        navigate(`/building/${formData.building_id}`);
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

  const handleCancel = () => {
    if (formData.building_id) {
      navigate(`/building/${formData.building_id}`);
    } else {
      navigate('/buildings');
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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleCancel}
        sx={{ mb: 2 }}
      >
        戻る
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? '部屋情報編集' : '新規部屋登録'}
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
                select
                required
                fullWidth
                label="物件"
                name="building_id"
                value={formData.building_id}
                onChange={handleChange}
                disabled={submitting || isEdit}
                helperText={isEdit ? "物件は編集できません" : ""}
              >
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="部屋番号"
                name="room_number"
                value={formData.room_number}
                onChange={handleChange}
                disabled={submitting}
                placeholder="101"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="階数"
                name="floor"
                type="number"
                value={formData.floor}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                required
                fullWidth
                label="部屋タイプ"
                name="room_type"
                value={formData.room_type}
                onChange={handleChange}
                disabled={submitting}
              >
                <MenuItem value="studio">ワンルーム</MenuItem>
                <MenuItem value="one_bedroom">1K</MenuItem>
                <MenuItem value="one_ldk">1LDK</MenuItem>
                <MenuItem value="two_bedroom">2K</MenuItem>
                <MenuItem value="two_ldk">2LDK</MenuItem>
                <MenuItem value="three_bedroom">3K</MenuItem>
                <MenuItem value="three_ldk">3LDK</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="面積（㎡）"
                name="area"
                type="number"
                inputProps={{ step: "0.01" }}
                value={formData.area}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="賃料（円）"
                name="rent"
                type="number"
                value={formData.rent}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="管理費（円）"
                name="management_fee"
                type="number"
                value={formData.management_fee}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="敷金（円）"
                name="deposit"
                type="number"
                value={formData.deposit}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="礼金（円）"
                name="key_money"
                type="number"
                value={formData.key_money}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                required
                fullWidth
                label="ステータス"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={submitting}
              >
                <MenuItem value="vacant">空室</MenuItem>
                <MenuItem value="occupied">入居中</MenuItem>
                <MenuItem value="reserved">予約済</MenuItem>
                <MenuItem value="maintenance">メンテナンス中</MenuItem>
              </TextField>
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
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                追加情報
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="向き"
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                disabled={submitting}
              >
                <MenuItem value="">未設定</MenuItem>
                <MenuItem value="north">北</MenuItem>
                <MenuItem value="northeast">北東</MenuItem>
                <MenuItem value="east">東</MenuItem>
                <MenuItem value="southeast">南東</MenuItem>
                <MenuItem value="south">南</MenuItem>
                <MenuItem value="southwest">南西</MenuItem>
                <MenuItem value="west">西</MenuItem>
                <MenuItem value="northwest">北西</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="入居可能日"
                name="available_date"
                type="date"
                value={formData.available_date}
                onChange={handleChange}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="駐車場料金（円/月）"
                name="parking_fee"
                type="number"
                value={formData.parking_fee}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="更新料（円）"
                name="renewal_fee"
                type="number"
                value={formData.renewal_fee}
                onChange={handleChange}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                入居条件
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.guarantor_required}
                    onChange={handleChange}
                    name="guarantor_required"
                    disabled={submitting}
                  />
                }
                label="保証人必要"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pets_allowed}
                    onChange={handleChange}
                    name="pets_allowed"
                    disabled={submitting}
                  />
                }
                label="ペット可"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.two_person_allowed}
                    onChange={handleChange}
                    name="two_person_allowed"
                    disabled={submitting}
                  />
                }
                label="二人入居可"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.office_use_allowed}
                    onChange={handleChange}
                    name="office_use_allowed"
                    disabled={submitting}
                  />
                }
                label="事務所利用可"
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
              onClick={handleCancel}
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
