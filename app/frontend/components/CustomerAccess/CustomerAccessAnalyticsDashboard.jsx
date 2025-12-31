import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Schedule as ScheduleIcon,
  DesktopWindows as DesktopIcon,
  PhoneAndroid as MobileIcon,
  Tablet as TabletIcon,
  DevicesOther as OtherDeviceIcon,
  Warning as WarningIcon,
  CheckCircle as ActiveIcon,
  Cancel as RevokedIcon,
  AccessTime as ExpiredIcon
} from '@mui/icons-material';
import axios from 'axios';

// Device info mapping
const getDeviceInfo = (device) => {
  const deviceMap = {
    desktop: { label: 'デスクトップ', icon: <DesktopIcon />, color: '#1976d2' },
    mobile: { label: 'モバイル', icon: <MobileIcon />, color: '#4caf50' },
    tablet: { label: 'タブレット', icon: <TabletIcon />, color: '#ff9800' },
    other: { label: 'その他', icon: <OtherDeviceIcon />, color: '#9e9e9e' }
  };
  return deviceMap[device] || deviceMap.other;
};

// Status info mapping
const getStatusInfo = (status) => {
  const statusMap = {
    active: { label: '有効', icon: <ActiveIcon />, color: '#4caf50' },
    expired: { label: '期限切れ', icon: <ExpiredIcon />, color: '#ff9800' },
    revoked: { label: '取消済み', icon: <RevokedIcon />, color: '#f44336' }
  };
  return statusMap[status] || statusMap.active;
};

// Summary Card Component
function SummaryCard({ title, value, subtitle, trend, icon }) {
  const getTrendIcon = () => {
    if (trend === null || trend === undefined) return null;
    if (trend > 0) return <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />;
    if (trend < 0) return <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />;
    return <TrendingFlatIcon sx={{ color: 'text.secondary', fontSize: 20 }} />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'success.main';
    if (trend < 0) return 'error.main';
    return 'text.secondary';
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend !== null && trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {getTrendIcon()}
              <Typography variant="body2" sx={{ color: getTrendColor() }}>
                {trend > 0 ? '+' : ''}{trend}% 前期比
              </Typography>
            </Box>
          )}
        </Box>
        {icon && (
          <Box sx={{ color: 'primary.main', opacity: 0.2 }}>
            {React.cloneElement(icon, { sx: { fontSize: 48 } })}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

// Status Breakdown Component
function StatusBreakdown({ data }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  const entries = Object.entries(data);

  return (
    <Box>
      {entries.map(([status, count]) => {
        const statusInfo = getStatusInfo(status);
        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;

        return (
          <Box key={status} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: statusInfo.color }}>{statusInfo.icon}</Box>
                <Typography variant="body2">{statusInfo.label}</Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {count}件 ({percentage}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parseFloat(percentage)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: statusInfo.color,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

// Device Breakdown Component
function DeviceBreakdown({ data }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        デバイスデータがありません
      </Typography>
    );
  }

  const sortedDevices = Object.entries(data).sort(([, a], [, b]) => b - a);

  return (
    <Box>
      {sortedDevices.map(([device, count]) => {
        const deviceInfo = getDeviceInfo(device);
        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;

        return (
          <Box key={device} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: deviceInfo.color }}>{deviceInfo.icon}</Box>
                <Typography variant="body2">{deviceInfo.label}</Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {count}件 ({percentage}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parseFloat(percentage)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: deviceInfo.color,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const maxValue = Math.max(...Object.values(data), 1);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  const displayEntries = entries.slice(-14);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 120 }}>
      {displayEntries.map(([date, count]) => {
        const height = (count / maxValue) * 100;
        const displayDate = new Date(date);
        const dayLabel = displayDate.getDate();

        return (
          <Box
            key={date}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 20
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                color: 'text.secondary',
                mb: 0.5,
                display: count > 0 ? 'block' : 'none'
              }}
            >
              {count}
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: `${height}%`,
                minHeight: count > 0 ? 4 : 2,
                bgcolor: count > 0 ? 'primary.main' : 'grey.300',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease'
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.5 }}
            >
              {dayLabel}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// Top Properties Component
function TopProperties({ data }) {
  if (!data || data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  const maxCount = Math.max(...data.map(item => item.view_count), 1);

  return (
    <List dense disablePadding>
      {data.map((item) => (
        <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <HomeIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.title}
                </Typography>
                <Chip
                  label={`${item.view_count}閲覧`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 22 }}
                />
                <Chip
                  label={`${item.access_count}件`}
                  size="small"
                  sx={{ height: 22 }}
                />
              </Box>
            }
            secondary={
              <LinearProgress
                variant="determinate"
                value={(item.view_count / maxCount) * 100}
                sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
              />
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

// Recently Accessed Component
function RecentlyAccessed({ data }) {
  if (!data || data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        最近のアクセスがありません
      </Typography>
    );
  }

  return (
    <List dense disablePadding>
      {data.map((access, index) => (
        <React.Fragment key={access.id}>
          {index > 0 && <Divider component="li" />}
          <ListItem disablePadding sx={{ py: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PersonIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {access.customer_name}
                  </Typography>
                  <Chip
                    label={`${access.view_count}閲覧`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {access.property_title} / {access.last_accessed_at}
                </Typography>
              }
            />
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
}

// Expiring Soon Component
function ExpiringSoon({ data }) {
  if (!data || data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        まもなく期限切れになるアクセスはありません
      </Typography>
    );
  }

  return (
    <List dense disablePadding>
      {data.map((access, index) => (
        <React.Fragment key={access.id}>
          {index > 0 && <Divider component="li" />}
          <ListItem disablePadding sx={{ py: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <WarningIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {access.customer_name}
                  </Typography>
                  <Chip
                    label={`残り${access.days_until_expiry}日`}
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {access.property_title} / 期限: {access.expires_at}
                </Typography>
              }
            />
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
}

// Main Dashboard Component
export default function CustomerAccessAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/v1/customer_access_analytics?days=${period}`);
      setData(response.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      if (err.response?.status === 401) {
        setError('分析データを表示するにはログインが必要です');
      } else {
        setError('分析データの読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          顧客アクセス分析
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value={7}>7日</ToggleButton>
          <ToggleButton value={30}>30日</ToggleButton>
          <ToggleButton value={90}>90日</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="有効なアクセス数"
            value={data.summary.total_accesses}
            subtitle={`${data.period.start_date} 〜 ${data.period.end_date}`}
            icon={<PersonIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="総閲覧数"
            value={data.summary.total_views}
            subtitle="全期間累計"
            icon={<VisibilityIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="期間内閲覧数"
            value={data.summary.period_views}
            trend={data.summary.change_percentage}
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="平均閲覧数/アクセス"
            value={data.summary.avg_views_per_access}
            subtitle="アクティブリンクあたり"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Daily Trend */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              日別アクセス推移
            </Typography>
            <SimpleBarChart data={data.daily_trend} />
          </Paper>
        </Grid>
      </Grid>

      {/* Breakdown Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Status Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              ステータス別
            </Typography>
            <StatusBreakdown data={data.status_breakdown} />
          </Paper>
        </Grid>

        {/* Device Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              デバイス別
            </Typography>
            <DeviceBreakdown data={data.device_breakdown} />
          </Paper>
        </Grid>
      </Grid>

      {/* Details Row */}
      <Grid container spacing={3}>
        {/* Top Properties */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              物件別閲覧数ランキング
            </Typography>
            <TopProperties data={data.top_properties} />
          </Paper>
        </Grid>

        {/* Recently Accessed */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              最近アクセスされたリンク
            </Typography>
            <RecentlyAccessed data={data.recently_accessed} />
          </Paper>
        </Grid>

        {/* Expiring Soon */}
        {data.expiring_soon && data.expiring_soon.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, bgcolor: 'warning.50', borderColor: 'warning.200', border: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ScheduleIcon color="warning" />
                <Typography variant="h6">
                  まもなく期限切れ（7日以内）
                </Typography>
              </Box>
              <ExpiringSoon data={data.expiring_soon} />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
