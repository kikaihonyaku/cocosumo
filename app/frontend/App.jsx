import React from "react";
import { Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, useMediaQuery, Box, CircularProgress } from "@mui/material";
import muiTheme from "./theme/muiTheme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import { ThemeContextProvider } from "./contexts/ThemeContext";
import Header from "./components/shared/Header";
import ImpersonationBanner from "./components/shared/ImpersonationBanner";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import MapSystem from "./pages/MapSystem";
import Buildings from "./pages/Buildings";
import BuildingForm from "./pages/BuildingForm";
import BuildingDetail from "./pages/BuildingDetail";
import RoomDetail from "./pages/RoomDetail";
import RoomForm from "./pages/RoomForm";
import VrTourEditor from "./pages/VrTourEditor";
import VrTourViewer from "./pages/VrTourViewer";
import PublicVrTour from "./pages/PublicVrTour";
import VrTours from "./pages/VrTours";
import PhotoEditor from "./pages/PhotoEditor";
import VirtualStagingEditor from "./pages/VirtualStagingEditor";
import VirtualStagingViewer from "./pages/VirtualStagingViewer";
import PublicVirtualStaging from "./pages/PublicVirtualStaging";
import EmbedVirtualStaging from "./pages/EmbedVirtualStaging";
import EmbedVrTour from "./pages/EmbedVrTour";
import VirtualStagings from "./pages/VirtualStagings";
import PropertyPublicationEditor from "./pages/PropertyPublicationEditor";
import PropertyPublicationsManager from "./pages/PropertyPublicationsManager";
import PublicPropertyDetail from "./pages/PublicPropertyDetail";
import LayerManagement from "./pages/admin/LayerManagement";
import SuumoImport from "./pages/admin/SuumoImport";
import StoreManagement from "./pages/admin/StoreManagement";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import InquiryAnalytics from "./pages/InquiryAnalytics";
import CustomerPropertyView from "./pages/CustomerPropertyView";
import CustomerAccessManager from "./pages/admin/CustomerAccessManager";
import InquiryManager from "./pages/admin/InquiryManager";
import CustomerAccessAnalytics from "./pages/CustomerAccessAnalytics";
import SalesPresentation from "./pages/SalesPresentation";
import TenantManagement from "./pages/super_admin/TenantManagement";
import UserManagement from "./pages/admin/UserManagement";
import ProfileSettings from "./pages/ProfileSettings";
import CustomerList from "./pages/CustomerList";
import CustomerDetail from "./pages/CustomerDetail";

// 認証が必要なルートを保護するコンポーネント
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh * var(--vh-correction, 1))' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // 未認証の場合、ログインページにリダイレクト（元のURLを保存）
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// スーパー管理者権限が必要なルートを保護するコンポーネント
function SuperAdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'super_admin') {
    return <Navigate to="/home" replace />;
  }
  return children;
}

// 管理者権限が必要なルートを保護するコンポーネント
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function Layout() {
  const location = useLocation();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isMapSystem = location.pathname === '/map';
  const isBuildingDetail = location.pathname.startsWith('/building/');
  const isRoomDetail = location.pathname.startsWith('/room/') && !location.pathname.includes('/vr-tour/') && !location.pathname.includes('/virtual-staging/') && !location.pathname.includes('/property-publication/');
  const isVrTour = location.pathname.includes('/vr-tour/');
  const isVirtualStaging = location.pathname.includes('/virtual-staging/');
  const isPropertyPublication = location.pathname.includes('/property-publication/');
  const isPhotoEditor = location.pathname.includes('/photos/') && location.pathname.endsWith('/edit');

  // 物件詳細、部屋詳細、VRツアー、バーチャルステージング、物件公開ページ、画像編集ページでは常に全画面レイアウト（独自ヘッダーを使用）
  // 地図システムページではデスクトップのみ全画面レイアウト
  if (isBuildingDetail || isRoomDetail || isVrTour || isVirtualStaging || isPropertyPublication || isPhotoEditor || (!isMobile && isMapSystem)) {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <Outlet />
      </div>
    );
  }

  // 地図システムページのモバイル表示：共通ヘッダー付きで全画面
  if (isMobile && isMapSystem) {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", height: "calc(100vh * var(--vh-correction, 1))", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, overflow: "hidden" }}>
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <ImpersonationBanner />
      <Header />

      <main style={{ padding: "1.25rem" }}>
        <Outlet />
      </main>

      <footer style={{ padding: "1rem", borderTop: "1px solid #eee", color: "#666" }}>
        © {new Date().getFullYear()} CoCoスモ
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ThemeContextProvider disableMuiProvider>
        <AuthProvider>
          <TenantProvider>
          <Routes>
          {/* 公開ページ */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/vr/:publicId" element={<PublicVrTour />} />
          <Route path="/virtual-staging/:publicId" element={<PublicVirtualStaging />} />
          <Route path="/embed/virtual-staging/:publicId" element={<EmbedVirtualStaging />} />
          <Route path="/embed/vr/:publicId" element={<EmbedVrTour />} />
          {/* 物件公開ページ（publication_idで識別） */}
          <Route path="/property/:publicationId" element={<PublicPropertyDetail />} />
          {/* 顧客向け限定公開ページ */}
          <Route path="/customer/:accessToken" element={<CustomerPropertyView />} />
          {/* 営業プレゼンページ */}
          <Route path="/present/:accessToken" element={<SalesPresentation />} />
          {/* ブログページ */}
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:publicId" element={<BlogDetail />} />

          {/* 認証が必要なページ */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/map" element={<MapSystem />} />
            <Route path="/vr-tours" element={<VrTours />} />
            <Route path="/virtual-stagings" element={<VirtualStagings />} />
            <Route path="/admin/stores" element={<StoreManagement />} />
            <Route path="/admin/layers" element={<LayerManagement />} />
            <Route path="/admin/suumo-import" element={<SuumoImport />} />
            <Route path="/analytics/inquiries" element={<InquiryAnalytics />} />
            <Route path="/analytics/customer-accesses" element={<CustomerAccessAnalytics />} />
            <Route path="/admin/publications" element={<PropertyPublicationsManager />} />
            <Route path="/admin/customer-accesses" element={<CustomerAccessManager />} />
            <Route path="/admin/inquiries" element={<InquiryManager />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/buildings" element={<Buildings />} />
            <Route path="/buildings/new" element={<BuildingForm />} />
            <Route path="/buildings/:id/edit" element={<BuildingForm />} />
            <Route path="/buildings/:buildingId/rooms/new" element={<RoomForm />} />
            <Route path="/building/:id" element={<BuildingDetail />} />
            <Route path="/room/:id" element={<RoomDetail />} />
            <Route path="/rooms/new" element={<RoomForm />} />
            <Route path="/rooms/:id/edit" element={<RoomForm />} />
            <Route path="/rooms/:roomId/photos/:photoId/edit" element={<PhotoEditor />} />
            <Route path="/buildings/:buildingId/photos/:photoId/edit" element={<PhotoEditor />} />
            <Route path="/room/:roomId/vr-tour/new" element={<VrTourEditor />} />
            <Route path="/room/:roomId/vr-tour/:id/edit" element={<VrTourEditor />} />
            <Route path="/room/:roomId/vr-tour/:id/viewer" element={<VrTourViewer />} />
            <Route path="/room/:roomId/virtual-staging/new" element={<VirtualStagingEditor />} />
            <Route path="/room/:roomId/virtual-staging/:id/edit" element={<VirtualStagingEditor />} />
            <Route path="/room/:roomId/virtual-staging/:id/viewer" element={<VirtualStagingViewer />} />
            <Route path="/room/:roomId/property-publication/new" element={<PropertyPublicationEditor />} />
            <Route path="/room/:roomId/property-publication/:id/edit" element={<PropertyPublicationEditor />} />

            {/* スーパー管理者用ルート */}
            <Route path="/super-admin/tenants" element={<SuperAdminRoute><TenantManagement /></SuperAdminRoute>} />

            {/* 管理者用ルート */}
            <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          </Route>
          </Routes>
          </TenantProvider>
        </AuthProvider>
      </ThemeContextProvider>
    </ThemeProvider>
  );
}
