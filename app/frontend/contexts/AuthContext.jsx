import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // API base URL
  const API_BASE = '/api/v1';

  // 初期化時にログイン状態をチェック
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // URL パラメータからGoogle認証結果をチェック
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const authError = urlParams.get('auth_error');

    if (authSuccess === 'true') {
      // Google認証成功時
      checkAuthStatus();
      // URLパラメータをクリア
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authError) {
      // Google認証失敗時
      console.error('Google認証エラー:', authError);
      setLoading(false);
      // URLパラメータをクリア
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 認証状態確認
  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setTenant(data.tenant);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setTenant(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      setUser(null);
      setTenant(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // 既存認証（メールアドレス・パスワード）でのログイン
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setTenant(data.tenant);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'ログインに失敗しました' };
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  };

  // Google認証でのログイン
  const loginWithGoogle = () => {
    // Google OAuth認証開始（リダイレクト）
    window.location.href = `${API_BASE}/auth/google`;
  };

  // ログアウト
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setUser(null);
      setTenant(null);
      setIsAuthenticated(false);
    }
  };

  // 既存アカウントとGoogle連携
  const linkGoogleAccount = async (googleId, email) => {
    try {
      const response = await fetch(`${API_BASE}/auth/link_google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ google_id: googleId, email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || '連携に失敗しました' };
      }
    } catch (error) {
      console.error('Google連携エラー:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  };

  const value = {
    user,
    tenant,
    isAuthenticated,
    loading,
    login,
    loginWithGoogle,
    logout,
    linkGoogleAccount,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
