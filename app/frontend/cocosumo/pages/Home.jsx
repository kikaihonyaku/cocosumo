import React from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Box
} from "@mui/material";
import {
  Map as MapIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        CoCoスモへようこそ
      </Typography>

      <Grid container spacing={3}>
        {/* 物件管理カード */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MapIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  物件管理
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                地図上で物件を管理し、建物・部屋情報を効率的に登録・編集できます。
              </Typography>
            </CardContent>
            <CardActions>
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

        {/* 物件一覧カード */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  物件一覧
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                登録されている全ての物件を一覧で確認・検索できます。
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                component={Link}
                to="/buildings"
                size="large"
                variant="outlined"
                fullWidth
              >
                物件一覧を開く
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 管理者設定カード */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  管理者設定
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                ユーザー管理やテナント設定を行います。（管理者のみ）
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                disabled
              >
                近日公開
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
              CoCoスモをご利用いただきありがとうございます。現在、順次機能を追加中です。
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
