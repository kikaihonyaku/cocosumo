import React from "react";
import { Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, useMediaQuery, Box, CircularProgress } from "@mui/material";
import muiTheme from "./theme/muiTheme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/shared/Header";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import MapSystem from "./pages/MapSystem";
import Buildings from "./pages/Buildings";
import BuildingForm from "./pages/BuildingForm";
import PropertyDetail from "./pages/PropertyDetail";
import RoomDetail from "./pages/RoomDetail";
import RoomForm from "./pages/RoomForm";
import VrTourEditor from "./pages/VrTourEditor";
import VrTourViewer from "./pages/VrTourViewer";
import PublicVrTour from "./pages/PublicVrTour";

// 認証が必要なルートを保護するコンポーネント
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
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

function Layout() {
  const location = useLocation();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isMapSystem = location.pathname === '/map';
  const isPropertyDetail = location.pathname.startsWith('/property/');
  const isRoomDetail = location.pathname.startsWith('/room/');
  const isVrTour = location.pathname.includes('/vr-tour/');

  // 物件詳細、部屋詳細、VRツアーページでは常に全画面レイアウト（独自ヘッダーを使用）
  // 地図システムページではデスクトップのみ全画面レイアウト
  if (isPropertyDetail || isRoomDetail || isVrTour || (!isMobile && isMapSystem)) {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <Outlet />
      </div>
    );
  }

  // 地図システムページのモバイル表示：共通ヘッダー付きで全画面
  if (isMobile && isMapSystem) {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", height: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, overflow: "hidden" }}>
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
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
      <AuthProvider>
        <Routes>
          {/* 公開ページ */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/vr/:id" element={<PublicVrTour />} />

          {/* 認証が必要なページ */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/map" element={<MapSystem />} />
            <Route path="/buildings" element={<Buildings />} />
            <Route path="/buildings/new" element={<BuildingForm />} />
            <Route path="/buildings/:id/edit" element={<BuildingForm />} />
            <Route path="/buildings/:buildingId/rooms/new" element={<RoomForm />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/room/:id" element={<RoomDetail />} />
            <Route path="/rooms/new" element={<RoomForm />} />
            <Route path="/rooms/:id/edit" element={<RoomForm />} />
            <Route path="/room/:roomId/vr-tour/new" element={<VrTourEditor />} />
            <Route path="/room/:roomId/vr-tour/:id/edit" element={<VrTourEditor />} />
            <Route path="/room/:roomId/vr-tour/:id/viewer" element={<VrTourViewer />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
