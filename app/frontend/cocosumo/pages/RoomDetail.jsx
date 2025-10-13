import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Image as ImageIcon,
  Vrpano as VrpanoIcon
} from "@mui/icons-material";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRoom();
  }, [id]);

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
        setRoom(data);
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !room) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || '部屋が見つかりません'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/buildings')}
          sx={{ mt: 2 }}
        >
          物件一覧に戻る
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/property/${room.building_id}`)}
        sx={{ mb: 2 }}
      >
        物件詳細に戻る
      </Button>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              {room.room_number}号室
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BusinessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {room.building?.name}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/rooms/${room.id}/edit`)}
          >
            編集
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip
            label={room.status_label}
            color={room.status === 'vacant' ? 'success' : 'default'}
          />
          <Chip label={room.room_type_label} variant="outlined" />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              階数
            </Typography>
            <Typography variant="body1">
              {room.floor}階
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">
              面積
            </Typography>
            <Typography variant="body1">
              {room.area}㎡
            </Typography>
          </Grid>

          {room.rent && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                賃料
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {room.rent.toLocaleString()}円
              </Typography>
            </Grid>
          )}

          {room.management_fee && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                管理費
              </Typography>
              <Typography variant="body1">
                {room.management_fee.toLocaleString()}円
              </Typography>
            </Grid>
          )}

          {room.deposit && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                敷金
              </Typography>
              <Typography variant="body1">
                {room.deposit.toLocaleString()}円
              </Typography>
            </Grid>
          )}

          {room.key_money && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">
                礼金
              </Typography>
              <Typography variant="body1">
                {room.key_money.toLocaleString()}円
              </Typography>
            </Grid>
          )}
        </Grid>

        {room.description && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="caption" color="text.secondary">
              説明
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {room.description}
            </Typography>
          </>
        )}
      </Paper>

      {/* AI画像生成セクション */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          AI画像生成
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ImageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                AI画像生成機能は近日実装予定です
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gemini NanaBananaを使用して、室内写真から「家具なし」「家具あり」の画像を自動生成できるようになります。
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* VRツアーセクション */}
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          VRルームツアー
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <VrpanoIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                VRツアー機能は近日実装予定です
              </Typography>
              <Typography variant="body2" color="text.secondary">
                360度パノラマビューでVRルームツアーを作成・編集できるようになります。
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
