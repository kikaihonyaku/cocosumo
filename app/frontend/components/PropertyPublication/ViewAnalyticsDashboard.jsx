import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  PhoneIphone as MobileIcon,
  Tablet as TabletIcon,
  Computer as DesktopIcon,
  Language as WebIcon,
  AccessTime as TimeIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';

// デバイスアイコンとラベルのマッピング
const getDeviceInfo = (deviceType) => {
  const deviceMap = {
    desktop: { label: 'デスクトップ', icon: <DesktopIcon />, color: '#1976d2' },
    mobile: { label: 'モバイル', icon: <MobileIcon />, color: '#4caf50' },
    tablet: { label: 'タブレット', icon: <TabletIcon />, color: '#ff9800' }
  };
  return deviceMap[deviceType] || { label: deviceType, icon: <WebIcon />, color: '#757575' };
};

// サマリーカード
function SummaryCard({ title, value, subtitle, icon, color = 'primary.main' }) {
  return (
    <Paper sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box sx={{ color, opacity: 0.3 }}>
            {React.cloneElement(icon, { sx: { fontSize: 40 } })}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

// デバイス別統計
function DeviceBreakdown({ data }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const sortedDevices = Object.entries(data).sort(([, a], [, b]) => b - a);

  if (total === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  return (
    <Box>
      {/* デバイス別円グラフ風表示 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        {sortedDevices.map(([device, count]) => {
          const deviceInfo = getDeviceInfo(device);
          const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;

          return (
            <Box key={device} sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: `${deviceInfo.color}15`,
                  border: `3px solid ${deviceInfo.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}
              >
                <Box sx={{ color: deviceInfo.color }}>
                  {React.cloneElement(deviceInfo.icon, { sx: { fontSize: 28 } })}
                </Box>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {percentage}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {deviceInfo.label}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                ({count}回)
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* 詳細バー */}
      {sortedDevices.map(([device, count]) => {
        const deviceInfo = getDeviceInfo(device);
        const percentage = total > 0 ? (count / total * 100) : 0;

        return (
          <Box key={device} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: deviceInfo.color, display: 'flex' }}>{deviceInfo.icon}</Box>
                <Typography variant="body2">{deviceInfo.label}</Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {count}回 ({percentage.toFixed(1)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: deviceInfo.color,
                  borderRadius: 3
                }
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

// リファラー別統計
function ReferrerBreakdown({ data }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const sortedReferrers = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 10);

  if (total === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  const maxCount = Math.max(...Object.values(data), 1);

  return (
    <Box>
      {sortedReferrers.map(([domain, count], index) => {
        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
        const widthPercent = (count / maxCount) * 100;

        // ドメインの表示名を整形
        const displayName = domain === 'direct' ? '直接アクセス' :
                           domain.replace('www.', '').substring(0, 30);

        return (
          <Box key={domain} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: index === 0 ? 'primary.main' : 'text.primary',
                    fontWeight: index === 0 ? 600 : 400,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayName}
                </Typography>
                {index === 0 && (
                  <Chip label="TOP" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {count}回 ({percentage}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={widthPercent}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: index === 0 ? 'primary.main' : 'grey.500',
                  borderRadius: 3
                }
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

// 時間帯別アクセス
function HourlyBreakdown({ data }) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString());
  const maxValue = Math.max(...hours.map(h => data[h] || 0), 1);
  const total = hours.reduce((sum, h) => sum + (data[h] || 0), 0);

  if (total === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  // ピークタイムを特定
  let peakHour = '0';
  let peakCount = 0;
  hours.forEach(h => {
    if ((data[h] || 0) > peakCount) {
      peakCount = data[h] || 0;
      peakHour = h;
    }
  });

  return (
    <Box>
      {/* ピークタイム表示 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TimeIcon sx={{ color: 'warning.main' }} />
        <Typography variant="body2">
          ピークタイム: <strong>{peakHour}:00〜{parseInt(peakHour) + 1}:00</strong>
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({peakCount}回アクセス)
          </Typography>
        </Typography>
      </Box>

      {/* 24時間バーチャート */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 80 }}>
        {hours.map(hour => {
          const count = data[hour] || 0;
          const height = maxValue > 0 ? (count / maxValue) * 100 : 0;
          const isPeak = hour === peakHour;

          return (
            <Tooltip key={hour} title={`${hour}時: ${count}回`} arrow>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: `${height}%`,
                    minHeight: count > 0 ? 4 : 2,
                    bgcolor: isPeak ? 'warning.main' : count > 0 ? 'primary.main' : 'grey.300',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* 時間ラベル */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        {[0, 6, 12, 18, 23].map(h => (
          <Typography key={h} variant="caption" color="text.secondary">
            {h}時
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

// メインダッシュボードコンポーネント
export default function ViewAnalyticsDashboard({ publicationId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (publicationId) {
      loadAnalytics();
    }
  }, [publicationId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/v1/property_publications/${publicationId}/analytics`);
      setData(response.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      if (err.response?.status === 401) {
        setError('分析データを表示するにはログインが必要です');
      } else if (err.response?.status === 404) {
        setError('物件公開ページが見つかりませんでした');
      } else {
        setError('分析データの読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  // 平均セッション時間をフォーマット
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0秒';
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分`;
  };

  // 有効期限をフォーマット
  const formatExpiration = (expiresAt) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const now = new Date();
    if (date < now) return { text: '期限切れ', color: 'error' };
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return { text: '本日期限', color: 'warning' };
    if (days <= 7) return { text: `あと${days}日`, color: 'warning' };
    return { text: date.toLocaleDateString('ja-JP'), color: 'default' };
  };

  const expirationInfo = formatExpiration(data.expires_at);

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          アクセス分析
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {data.password_protected && (
            <Tooltip title="パスワード保護中">
              <Chip
                icon={<LockIcon />}
                label="保護中"
                size="small"
                color="warning"
                variant="outlined"
              />
            </Tooltip>
          )}
          {expirationInfo && (
            <Tooltip title={`有効期限: ${new Date(data.expires_at).toLocaleString('ja-JP')}`}>
              <Chip
                icon={<ScheduleIcon />}
                label={expirationInfo.text}
                size="small"
                color={expirationInfo.color}
                variant="outlined"
              />
            </Tooltip>
          )}
          <IconButton size="small" onClick={loadAnalytics}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* サマリーカード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <SummaryCard
            title="総閲覧数"
            value={data.view_count?.toLocaleString() || 0}
            icon={<VisibilityIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <SummaryCard
            title="最大スクロール"
            value={`${data.max_scroll_depth || 0}%`}
            subtitle="ページ内到達率"
            icon={<TrendingUpIcon />}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <SummaryCard
            title="平均滞在時間"
            value={formatDuration(data.avg_session_duration)}
            icon={<TimeIcon />}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <SummaryCard
            title="公開日"
            value={data.published_at ? new Date(data.published_at).toLocaleDateString('ja-JP') : '未公開'}
            icon={<WebIcon />}
            color="secondary.main"
          />
        </Grid>
      </Grid>

      {/* 詳細セクション */}
      <Grid container spacing={2}>
        {/* デバイス別 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              デバイス別
            </Typography>
            <DeviceBreakdown data={data.device_stats || {}} />
          </Paper>
        </Grid>

        {/* リファラー別 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              参照元
            </Typography>
            <ReferrerBreakdown data={data.referrer_stats || {}} />
          </Paper>
        </Grid>

        {/* 時間帯別 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              時間帯別アクセス
            </Typography>
            <HourlyBreakdown data={data.hourly_stats || {}} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
