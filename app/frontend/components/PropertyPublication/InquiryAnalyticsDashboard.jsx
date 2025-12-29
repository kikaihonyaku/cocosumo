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
  Email as EmailIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  Public as PublicIcon,
  Campaign as CampaignIcon,
  Link as LinkIcon,
  QuestionMark as QuestionMarkIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import axios from 'axios';

// Source info mapping
const getSourceInfo = (source) => {
  const sourceMap = {
    direct: { label: 'ダイレクト', icon: <LinkIcon />, color: '#757575' },
    organic_search: { label: '検索', icon: <SearchIcon />, color: '#1976d2' },
    social: { label: 'SNS', icon: <ShareIcon />, color: '#e91e63' },
    referral: { label: '参照', icon: <PublicIcon />, color: '#00bcd4' },
    campaign: { label: 'キャンペーン', icon: <CampaignIcon />, color: '#4caf50' },
    unknown: { label: '不明', icon: <QuestionMarkIcon />, color: '#9e9e9e' }
  };
  return sourceMap[source] || sourceMap.unknown;
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

// Source Breakdown Component
function SourceBreakdown({ data }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const sortedSources = Object.entries(data).sort(([, a], [, b]) => b - a);

  if (total === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  return (
    <Box>
      {sortedSources.map(([source, count]) => {
        const sourceInfo = getSourceInfo(source);
        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;

        return (
          <Box key={source} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: sourceInfo.color }}>{sourceInfo.icon}</Box>
                <Typography variant="body2">{sourceInfo.label}</Typography>
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
                  bgcolor: sourceInfo.color,
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
function SimpleBarChart({ data, label }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const maxValue = Math.max(...Object.values(data), 1);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  // Show last 14 days for daily, all for weekly
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

// Top Publications Component
function TopPublications({ data }) {
  if (!data || data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        データがありません
      </Typography>
    );
  }

  const maxCount = Math.max(...data.map(item => item.count), 1);

  return (
    <List dense disablePadding>
      {data.map((item, index) => (
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
                  label={`${item.count}件`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 22 }}
                />
              </Box>
            }
            secondary={
              <LinearProgress
                variant="determinate"
                value={(item.count / maxCount) * 100}
                sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
              />
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

// Campaign Breakdown Component
function CampaignBreakdown({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        キャンペーンデータがありません
      </Typography>
    );
  }

  const sortedCampaigns = Object.entries(data).sort(([, a], [, b]) => b - a);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {sortedCampaigns.map(([campaign, count]) => (
        <Chip
          key={campaign}
          icon={<CampaignIcon />}
          label={`${campaign}: ${count}件`}
          color="success"
          variant="outlined"
          size="small"
        />
      ))}
    </Box>
  );
}

// Recent Inquiries Component
function RecentInquiries({ data }) {
  if (!data || data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        最近の問い合わせがありません
      </Typography>
    );
  }

  return (
    <List dense disablePadding>
      {data.map((inquiry, index) => {
        const sourceInfo = getSourceInfo(inquiry.source);

        return (
          <React.Fragment key={inquiry.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem disablePadding sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32, color: sourceInfo.color }}>
                {sourceInfo.icon}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {inquiry.name}
                    </Typography>
                    <Chip
                      label={sourceInfo.label}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: `${sourceInfo.color}20`,
                        color: sourceInfo.color
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {inquiry.property_title} • {inquiry.created_at}
                  </Typography>
                }
              />
            </ListItem>
          </React.Fragment>
        );
      })}
    </List>
  );
}

// Main Dashboard Component
export default function InquiryAnalyticsDashboard() {
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
      const response = await axios.get(`/api/v1/inquiry_analytics?days=${period}`);
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
          問い合わせ分析
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
            title="総問い合わせ数"
            value={data.summary.total}
            subtitle={`${data.period.start_date} 〜 ${data.period.end_date}`}
            trend={data.summary.change_percentage}
            icon={<EmailIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="前期間"
            value={data.summary.previous_period}
            subtitle={`比較期間: ${period}日前`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="主要流入源"
            value={
              Object.entries(data.source_breakdown || {})
                .sort(([, a], [, b]) => b - a)[0]?.[0] === 'direct' ? 'ダイレクト' :
              Object.entries(data.source_breakdown || {})
                .sort(([, a], [, b]) => b - a)[0]?.[0] === 'organic_search' ? '検索' :
              Object.entries(data.source_breakdown || {})
                .sort(([, a], [, b]) => b - a)[0]?.[0] === 'social' ? 'SNS' :
              Object.entries(data.source_breakdown || {})
                .sort(([, a], [, b]) => b - a)[0]?.[0] || '-'
            }
            subtitle="最も多い流入元"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="人気物件"
            value={data.top_publications?.[0]?.count || 0}
            subtitle={data.top_publications?.[0]?.title || '-'}
            icon={<HomeIcon />}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Daily Trend */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              日別推移
            </Typography>
            <SimpleBarChart data={data.daily_trend} label="日別" />
          </Paper>
        </Grid>

        {/* Source Breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              流入元別
            </Typography>
            <SourceBreakdown data={data.source_breakdown} />
          </Paper>
        </Grid>
      </Grid>

      {/* Details Row */}
      <Grid container spacing={3}>
        {/* Top Publications */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              物件別ランキング
            </Typography>
            <TopPublications data={data.top_publications} />
          </Paper>
        </Grid>

        {/* Recent Inquiries */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              最新の問い合わせ
            </Typography>
            <RecentInquiries data={data.recent_inquiries} />
          </Paper>
        </Grid>

        {/* Campaign Breakdown */}
        {Object.keys(data.campaign_breakdown || {}).length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                キャンペーン別
              </Typography>
              <CampaignBreakdown data={data.campaign_breakdown} />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
