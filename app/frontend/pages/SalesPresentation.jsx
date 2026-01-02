import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Map as MapIcon,
  Apartment as BuildingIcon,
  Home as RoomIcon,
  ViewInAr as VRIcon,
  Info as NotesIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RecordVoiceOver as TalkIcon
} from '@mui/icons-material';
import axios from 'axios';

// ステップコンポーネント
import NeighborhoodStep from '../components/SalesPresentation/steps/NeighborhoodStep';
import BuildingStep from '../components/SalesPresentation/steps/BuildingStep';
import RoomStep from '../components/SalesPresentation/steps/RoomStep';
import VRStep from '../components/SalesPresentation/steps/VRStep';
import NotesStep from '../components/SalesPresentation/steps/NotesStep';

const STEP_ICONS = {
  neighborhood: <MapIcon />,
  building: <BuildingIcon />,
  room: <RoomIcon />,
  vr: <VRIcon />,
  notes: <NotesIcon />
};

const STEP_COMPONENTS = {
  neighborhood: NeighborhoodStep,
  building: BuildingStep,
  room: RoomStep,
  vr: VRStep,
  notes: NotesStep
};

// パスワード入力画面
function PasswordScreen({ onSubmit, error }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(password);
    setLoading(false);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        p: 2
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            パスワードが必要です
          </Typography>
          <Typography variant="body2" color="text.secondary">
            このプレゼンページはパスワードで保護されています
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="パスワード"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading || !password}
            size="large"
          >
            {loading ? '確認中...' : '確認'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default function SalesPresentation() {
  const { accessToken } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // ステップ管理
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTalkingPoints, setShowTalkingPoints] = useState(!isMobile);

  const loadData = useCallback(async (password = null) => {
    try {
      setLoading(true);
      setError(null);
      setPasswordError(null);

      const params = password ? { password } : {};
      const response = await axios.get(`/api/v1/present/${accessToken}`, { params });

      setData(response.data);
      setPasswordRequired(false);

      // 閲覧追跡
      trackView();
    } catch (err) {
      if (err.response?.status === 401) {
        if (err.response.data.error === 'password_required') {
          setPasswordRequired(true);
        } else if (err.response.data.error === 'invalid_password') {
          setPasswordError('パスワードが正しくありません');
        }
      } else if (err.response?.status === 404) {
        setError('プレゼンURLが見つかりません');
      } else if (err.response?.status === 403) {
        setError('このプレゼンURLは取り消されています');
      } else if (err.response?.status === 410) {
        setError('このプレゼンURLの有効期限が切れています');
      } else {
        setError('データの読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const trackView = async () => {
    try {
      const deviceType = /mobile/i.test(navigator.userAgent) ? 'mobile' :
                        /tablet/i.test(navigator.userAgent) ? 'tablet' : 'desktop';
      await axios.post(`/api/v1/present/${accessToken}/track_view`, {
        device_type: deviceType
      });
    } catch (e) { /* ignore */ }
  };

  const trackStep = async (stepKey) => {
    try {
      await axios.post(`/api/v1/present/${accessToken}/track_step`, { step: stepKey });
    } catch (e) { /* ignore */ }
  };

  const handlePasswordSubmit = async (password) => {
    await loadData(password);
  };

  const handleNext = () => {
    if (data && currentStepIndex < data.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      trackStep(data.steps[nextIndex].key);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleStepClick = (index) => {
    setCurrentStepIndex(index);
    if (data) {
      trackStep(data.steps[index].key);
    }
    setDrawerOpen(false);
  };

  if (passwordRequired) {
    return <PasswordScreen onSubmit={handlePasswordSubmit} error={passwordError} />;
  }

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>エラー</Typography>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!data) return null;

  const currentStep = data.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === data.steps.length - 1;
  const StepComponent = STEP_COMPONENTS[currentStep.key];
  const talkingPoints = currentStep.config?.talking_points || [];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      {/* ヘッダー */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }} noWrap>
            {data.title}
          </Typography>

          {!isMobile && (
            <IconButton
              onClick={() => setShowTalkingPoints(!showTalkingPoints)}
              color={showTalkingPoints ? 'primary' : 'default'}
              title="トークポイント表示"
            >
              <TalkIcon />
            </IconButton>
          )}
        </Toolbar>

        {/* デスクトップ用ステッパー */}
        {!isMobile && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Stepper activeStep={currentStepIndex} alternativeLabel>
              {data.steps.map((step, index) => (
                <Step key={step.key} completed={index < currentStepIndex}>
                  <StepButton onClick={() => handleStepClick(index)}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: index === currentStepIndex ? 'primary.main' :
                                    index < currentStepIndex ? 'success.main' : 'grey.300',
                            color: 'white'
                          }}
                        >
                          {STEP_ICONS[step.key]}
                        </Box>
                      )}
                    >
                      {step.label}
                    </StepLabel>
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
      </AppBar>

      {/* モバイル用ドロワー */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">ステップ</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {data.steps.map((step, index) => (
              <ListItem
                key={step.key}
                button
                selected={index === currentStepIndex}
                onClick={() => handleStepClick(index)}
              >
                <ListItemIcon
                  sx={{
                    color: index === currentStepIndex ? 'primary.main' :
                           index < currentStepIndex ? 'success.main' : 'text.secondary'
                  }}
                >
                  {STEP_ICONS[step.key]}
                </ListItemIcon>
                <ListItemText
                  primary={step.label}
                  secondary={index < currentStepIndex ? '完了' : null}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ステップコンテンツ */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: { xs: 2, md: 3 },
            pb: { xs: 12, md: 3 }
          }}
        >
          {StepComponent && (
            <StepComponent
              property={data.property}
              config={currentStep.config}
              isMobile={isMobile}
            />
          )}
        </Box>

        {/* トークポイントパネル（デスクトップ） */}
        {showTalkingPoints && !isMobile && talkingPoints.length > 0 && (
          <Paper
            sx={{
              width: 300,
              flexShrink: 0,
              overflow: 'auto',
              borderLeft: 1,
              borderColor: 'divider',
              bgcolor: 'primary.50'
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TalkIcon fontSize="small" />
                トークポイント
              </Typography>
              <List dense>
                {talkingPoints.map((point, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={point}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        )}
      </Box>

      {/* ナビゲーションバー */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1100
        }}
      >
        <Button
          variant="outlined"
          startIcon={<PrevIcon />}
          onClick={handlePrev}
          disabled={isFirstStep}
          sx={{ minWidth: 100 }}
        >
          戻る
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {currentStepIndex + 1} / {data.steps.length}
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold">
            {currentStep.label}
          </Typography>
        </Box>

        <Button
          variant="contained"
          endIcon={!isLastStep && <NextIcon />}
          onClick={handleNext}
          disabled={isLastStep}
          sx={{ minWidth: 140 }}
        >
          {isLastStep ? '説明完了' : '次に見る'}
        </Button>
      </Paper>

      {/* モバイル用トークポイント表示 */}
      {isMobile && talkingPoints.length > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 80,
            left: 8,
            right: 8,
            p: 1.5,
            bgcolor: 'primary.50',
            maxHeight: 120,
            overflow: 'auto',
            zIndex: 1099
          }}
        >
          <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TalkIcon fontSize="small" />
            トークポイント
          </Typography>
          {talkingPoints.map((point, idx) => (
            <Typography key={idx} variant="body2" sx={{ mt: 0.5 }}>
              {point}
            </Typography>
          ))}
        </Paper>
      )}
    </Box>
  );
}
