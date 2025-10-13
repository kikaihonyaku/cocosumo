import React from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, useMediaQuery } from "@mui/material";
import muiTheme from "./theme/muiTheme";
import { AuthProvider } from "./contexts/AuthContext";
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

function Layout() {
  const location = useLocation();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isMapSystem = location.pathname === '/map';
  const isPropertyDetail = location.pathname.startsWith('/property/');
  const isRoomDetail = location.pathname.startsWith('/room/');

  // 物件詳細と部屋詳細ページでは常に全画面レイアウト（独自ヘッダーを使用）
  // 地図システムページではデスクトップのみ全画面レイアウト
  if (isPropertyDetail || isRoomDetail || (!isMobile && isMapSystem)) {
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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
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
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
