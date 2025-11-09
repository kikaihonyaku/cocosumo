import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Alert
} from "@mui/material";
import {
  Add as AddIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon
} from "@mui/icons-material";

export default function Buildings() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBuildings();
  }, []);

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

  const getBuildingTypeLabel = (type) => {
    const types = {
      mansion: 'マンション',
      apartment: 'アパート',
      house: '一戸建て',
      office: 'オフィス',
      store: '店舗',
      other: 'その他'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1">
          物件一覧
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/buildings/new')}
        >
          新規物件登録
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {buildings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BusinessIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            物件が登録されていません
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            「新規物件登録」ボタンから最初の物件を登録しましょう
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/buildings/new')}
          >
            新規物件登録
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {buildings.map((building) => (
            <Grid item xs={12} md={6} lg={4} key={building.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {building.name}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {building.address}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip
                      label={getBuildingTypeLabel(building.building_type)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`${building.total_units || 0}戸`}
                      size="small"
                    />
                  </Box>

                  {building.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {building.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/building/${building.id}`)}
                  >
                    詳細を見る
                  </Button>
                  <Button
                    size="small"
                    onClick={() => navigate(`/buildings/${building.id}/edit`)}
                  >
                    編集
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
