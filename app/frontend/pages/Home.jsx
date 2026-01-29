import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Paper,
  Alert,
  Skeleton
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Web as WebIcon,
  Phone as PhoneIcon,
  Note as NoteIcon,
  Visibility as VisibilityIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  PriorityHigh as PriorityHighIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

// 商談ステータスのラベルと色
const DEAL_STATUS_CONFIG = {
  new_inquiry: { label: "新規反響", color: "#2196F3" },
  contacting: { label: "対応中", color: "#FF9800" },
  viewing_scheduled: { label: "内見予約", color: "#9C27B0" },
  viewing_done: { label: "内見済", color: "#00BCD4" },
  application: { label: "申込", color: "#4CAF50" },
  contracted: { label: "成約", color: "#8BC34A" },
  lost: { label: "失注", color: "#9E9E9E" }
};

// 媒体のラベルと色
const MEDIA_TYPE_CONFIG = {
  suumo: { label: "SUUMO", color: "#00C853" },
  athome: { label: "at home", color: "#FF6D00" },
  homes: { label: "HOMES", color: "#2962FF" },
  lifull: { label: "LIFULL", color: "#D500F9" },
  own_website: { label: "自社HP", color: "#0168B7" },
  line: { label: "LINE", color: "#00B900" },
  phone: { label: "電話", color: "#607D8B" },
  walk_in: { label: "飛び込み", color: "#795548" },
  referral: { label: "紹介", color: "#E91E63" },
  other_media: { label: "その他", color: "#9E9E9E" }
};

// アクティビティアイコン
const ACTIVITY_ICONS = {
  note: <NoteIcon fontSize="small" />,
  phone_call: <PhoneIcon fontSize="small" />,
  email: <EmailIcon fontSize="small" />,
  visit: <HomeIcon fontSize="small" />,
  viewing: <VisibilityIcon fontSize="small" />,
  inquiry: <EmailIcon fontSize="small" />,
  access_issued: <WebIcon fontSize="small" />,
  status_change: <AssignmentIcon fontSize="small" />,
  line_message: <EmailIcon fontSize="small" />,
  assigned_user_change: <PeopleIcon fontSize="small" />
};

// KPIカードコンポーネント
function SummaryCard({ title, value, subtitle, icon, change, loading }) {
  return (
    <Card sx={{ height: "100%", minHeight: 140 }}>
      <CardContent sx={{ p: 2.5 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width={100} height={24} />
            <Skeleton variant="text" width={60} height={48} sx={{ mt: 1 }} />
            <Skeleton variant="text" width={80} height={20} sx={{ mt: 1 }} />
          </>
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
              <Box sx={{ color: "primary.main", opacity: 0.7 }}>{icon}</Box>
            </Box>
            <Typography variant="h3" component="div" sx={{ mt: 1, fontWeight: 700 }}>
              {value}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              {change !== null && change !== undefined && (
                <Chip
                  size="small"
                  icon={change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${change >= 0 ? "+" : ""}${change}%`}
                  color={change >= 0 ? "success" : "error"}
                  sx={{ height: 24 }}
                />
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// 問い合わせトレンドグラフ
function InquiryTrendChart({ data, loading }) {
  // 過去30日分のデータを生成（データがない日は0で埋める）
  const chartData = React.useMemo(() => {
    if (!data) return [];

    const result = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const displayDate = `${date.getMonth() + 1}/${date.getDate()}`;

      result.push({
        date: displayDate,
        count: data[dateStr] || 0
      });
    }

    return result;
  }, [data]);

  if (loading) {
    return (
      <Box sx={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          interval={4}
          stroke="#999"
        />
        <YAxis tick={{ fontSize: 11 }} stroke="#999" allowDecimals={false} />
        <RechartsTooltip
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          formatter={(value) => [`${value}件`, "問い合わせ"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#0168B7"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 商談ステータス分布チャート
function DealStatusChart({ data, loading }) {
  const chartData = React.useMemo(() => {
    if (!data) return [];

    return Object.entries(data)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: DEAL_STATUS_CONFIG[status]?.label || status,
        value: count,
        color: DEAL_STATUS_CONFIG[status]?.color || "#9E9E9E"
      }));
  }, [data]);

  if (loading) {
    return (
      <Box sx={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (chartData.length === 0) {
    return (
      <Box sx={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">データがありません</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <RechartsTooltip
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          formatter={(value) => [`${value}人`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 媒体別問い合わせチャート
function MediaBreakdownChart({ data, loading }) {
  const chartData = React.useMemo(() => {
    if (!data) return [];

    return Object.entries(data)
      .filter(([_, count]) => count > 0)
      .map(([media, count]) => ({
        name: MEDIA_TYPE_CONFIG[media]?.label || media,
        count: count,
        color: MEDIA_TYPE_CONFIG[media]?.color || "#9E9E9E"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // 上位6件
  }, [data]);

  if (loading) {
    return (
      <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (chartData.length === 0) {
    return (
      <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">データがありません</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#999" allowDecimals={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#999" width={60} />
        <RechartsTooltip
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          formatter={(value) => [`${value}件`, ""]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// 未対応案件リスト
function PendingInquiriesList({ items, loading, navigate }) {
  if (loading) {
    return (
      <List dense>
        {[1, 2, 3].map((i) => (
          <ListItem key={i}>
            <ListItemText
              primary={<Skeleton variant="text" width={150} />}
              secondary={<Skeleton variant="text" width={100} />}
            />
          </ListItem>
        ))}
      </List>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: "center" }}>
        <Typography color="text.secondary" variant="body2">
          未対応の案件はありません
        </Typography>
      </Box>
    );
  }

  return (
    <List dense sx={{ py: 0 }}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <Divider />}
          <ListItem
            sx={{
              px: 1,
              py: 1,
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" }
            }}
            onClick={() => navigate(`/customers/${item.customer_id}`)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <EmailIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                  {item.property_title}
                </Typography>
              }
              secondary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.customer_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">|</Typography>
                  <Chip
                    label={item.media_type_label}
                    size="small"
                    sx={{ height: 18, fontSize: "0.7rem" }}
                  />
                  <Typography variant="caption" color="text.secondary">|</Typography>
                  <Typography variant="caption" color="warning.main">
                    {item.days_ago}日前
                  </Typography>
                </Box>
              }
            />
            <ChevronRightIcon color="action" />
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
}

// 最近のアクティビティリスト
function RecentActivitiesList({ items, loading, navigate }) {
  if (loading) {
    return (
      <List dense>
        {[1, 2, 3].map((i) => (
          <ListItem key={i}>
            <ListItemText
              primary={<Skeleton variant="text" width={150} />}
              secondary={<Skeleton variant="text" width={100} />}
            />
          </ListItem>
        ))}
      </List>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: "center" }}>
        <Typography color="text.secondary" variant="body2">
          アクティビティはありません
        </Typography>
      </Box>
    );
  }

  return (
    <List dense sx={{ py: 0 }}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <Divider />}
          <ListItem
            sx={{
              px: 1,
              py: 1,
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" }
            }}
            onClick={() => navigate(`/customers/${item.customer_id}`)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {ACTIVITY_ICONS[item.activity_type] || <NoteIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                  {item.subject}
                </Typography>
              }
              secondary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.customer_name}
                  </Typography>
                  {item.user_name && (
                    <>
                      <Typography variant="caption" color="text.secondary">|</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.user_name}
                      </Typography>
                    </>
                  )}
                  <Typography variant="caption" color="text.secondary">|</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.created_at}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
}

// アラートパネル
function AlertsPanel({ alerts, loading, navigate }) {
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={60} />
      </Box>
    );
  }

  const hasHighPriority = alerts?.high_priority_inquiries?.length > 0;
  const hasExpiring = alerts?.expiring_accesses?.length > 0;

  if (!hasHighPriority && !hasExpiring) {
    return (
      <Box sx={{ py: 3, textAlign: "center" }}>
        <Typography color="text.secondary" variant="body2">
          現在、対応が必要な項目はありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {hasHighPriority && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, color: "error.main" }}>
            <PriorityHighIcon fontSize="small" />
            優先度が高い問い合わせ
          </Typography>
          <List dense sx={{ py: 0 }}>
            {alerts.high_priority_inquiries.slice(0, 3).map((pi) => (
              <ListItem
                key={pi.id}
                sx={{
                  px: 1,
                  py: 0.5,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                  borderRadius: 1
                }}
                onClick={() => navigate(`/customers/${pi.customer_id}`)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {pi.customer_name}
                      </Typography>
                      <Chip
                        label={pi.priority_label}
                        size="small"
                        color={pi.priority === "urgent" ? "error" : "warning"}
                        sx={{ height: 18, fontSize: "0.7rem" }}
                      />
                    </Box>
                  }
                  secondary={`${pi.property_title} - ${pi.deal_status_label}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {hasExpiring && (
        <Box>
          <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, color: "warning.main" }}>
            <AccessTimeIcon fontSize="small" />
            期限切れ間近のアクセス権
          </Typography>
          <List dense sx={{ py: 0 }}>
            {alerts.expiring_accesses.slice(0, 3).map((access) => (
              <ListItem
                key={access.id}
                sx={{
                  px: 1,
                  py: 0.5,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                  borderRadius: 1
                }}
                onClick={() => navigate("/admin/customer-accesses")}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {access.customer_name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="warning.main">
                      あと{access.days_until_expiry}日で期限切れ
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}

export default function Home() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/dashboard");
      setDashboardData(response.data);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      setError("ダッシュボードの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // ログイン状態のチェックが完了し、未ログインの場合はログインページへリダイレクト
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, fetchDashboard]);

  // ログイン状態チェック中はローディング表示
  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Container>
    );
  }

  // 未ログインの場合は何も表示しない（リダイレクト中）
  if (!isAuthenticated) {
    return null;
  }

  const summary = dashboardData?.summary;

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
      {/* ヘッダー */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          ダッシュボード
        </Typography>
        <Tooltip title="更新">
          <IconButton onClick={fetchDashboard} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPIカード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <SummaryCard
            title="今月の問い合わせ"
            value={summary?.inquiries?.count ?? "-"}
            change={summary?.inquiries?.change_percentage}
            icon={<EmailIcon />}
            subtitle="前月比"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <SummaryCard
            title="進行中の案件"
            value={summary?.active_cases?.total ?? "-"}
            subtitle={summary?.active_cases ? `未対応: ${summary.active_cases.pending}` : ""}
            icon={<AssignmentIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <SummaryCard
            title="アクティブな顧客"
            value={summary?.active_customers?.count ?? "-"}
            subtitle={summary?.active_customers?.contracted_this_month > 0 ? `今月成約: ${summary.active_customers.contracted_this_month}` : ""}
            icon={<PeopleIcon />}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <SummaryCard
            title="公開中のページ"
            value={summary?.published_pages ?? "-"}
            icon={<WebIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* グラフセクション */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              問い合わせトレンド（過去30日）
            </Typography>
            <InquiryTrendChart data={dashboardData?.inquiry_trend} loading={loading} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              商談ステータス分布
            </Typography>
            <DealStatusChart data={dashboardData?.deal_status_distribution} loading={loading} />
          </Paper>
        </Grid>
      </Grid>

      {/* 媒体別 + リストセクション */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              媒体別問い合わせ（今月）
            </Typography>
            <MediaBreakdownChart data={dashboardData?.media_breakdown} loading={loading} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                未対応案件
              </Typography>
              <Chip
                label={dashboardData?.pending_inquiries?.length || 0}
                size="small"
                color="warning"
                sx={{ height: 20 }}
              />
            </Box>
            <PendingInquiriesList
              items={dashboardData?.pending_inquiries}
              loading={loading}
              navigate={navigate}
            />
            {dashboardData?.pending_inquiries?.length > 0 && (
              <Box sx={{ mt: 1, textAlign: "center" }}>
                <Typography
                  component={Link}
                  to="/admin/inquiries"
                  variant="body2"
                  sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  すべて見る
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                最近のアクティビティ
              </Typography>
              <RecentActivitiesList
                items={dashboardData?.recent_activities}
                loading={loading}
                navigate={navigate}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                <WarningIcon fontSize="small" color="warning" />
                要対応
              </Typography>
              <AlertsPanel
                alerts={dashboardData?.alerts}
                loading={loading}
                navigate={navigate}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
