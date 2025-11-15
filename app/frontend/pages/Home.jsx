import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Box,
  CircularProgress
} from "@mui/material";
import {
  Map as MapIcon,
  Settings as SettingsIcon,
  Vrpano as VrpanoIcon,
  CompareArrows as CompareArrowsIcon
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ログイン状態のチェックが完了し、未ログインの場合はログインページへリダイレクト
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // ログイン状態チェック中はローディング表示
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // 未ログインの場合は何も表示しない（リダイレクト中）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{
          mb: 4,
          fontWeight: 700,
          background: 'linear-gradient(45deg, #0168B7 30%, #4087cc 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        CoCoスモへようこそ
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* 物件管理カード */}
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card sx={{
            height: '100%',
            minHeight: 240,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <MapIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  物件管理
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                地図上で物件を管理し、建物・部屋情報を効率的に登録・編集できます。
              </Typography>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                component={Link}
                to="/map"
                size="large"
                variant="contained"
                fullWidth
              >
                物件管理を開く
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* VRツアー管理カード */}
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card sx={{
            height: '100%',
            minHeight: 240,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <VrpanoIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  VRツアー管理
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                360度パノラマ写真でバーチャルツアーを作成・管理できます。
              </Typography>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                component={Link}
                to="/vr-tours"
                size="large"
                variant="contained"
                fullWidth
              >
                VRツアー管理を開く
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* バーチャルステージング管理カード */}
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card sx={{
            height: '100%',
            minHeight: 240,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <CompareArrowsIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  バーチャルステージング
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Before/After画像比較で、リノベーション前後を視覚的に表現できます。
              </Typography>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                component={Link}
                to="/virtual-stagings"
                size="large"
                variant="contained"
                fullWidth
              >
                ステージング管理を開く
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 管理者設定カード */}
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card sx={{
            height: '100%',
            minHeight: 240,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <SettingsIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  管理者設定
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                レイヤー管理、ユーザー管理やテナント設定を行います。（管理者のみ）
              </Typography>
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                component={Link}
                to="/admin/layers"
                size="large"
                variant="outlined"
                fullWidth
                disabled={user?.role === 'member'}
              >
                レイヤー管理
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* お知らせセクション */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          お知らせ
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              CoCoスモをご利用いただきありがとうございます。現在、順次機能を追加中です。(2025/11/09)
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
