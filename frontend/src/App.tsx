import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { DocsPage } from './pages/DocsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { BusinessImpactPage } from './pages/BusinessImpactPage';
import { SupplierHubPage } from './pages/SupplierHubPage';
import { SplashScreen } from './components/SplashScreen';

const protectedRoute = (el: React.ReactNode) => (
  <ProtectedRoute>
    <AppLayout>{el}</AppLayout>
  </ProtectedRoute>
);

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('splash_seen');
    } catch {
      return true;
    }
  });

  const hideSplash = useCallback(() => {
    try {
      sessionStorage.setItem('splash_seen', '1');
      setShowSplash(false);
    } catch {
      setShowSplash(false);
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={protectedRoute(<DashboardPage />)} />
              <Route path="/search" element={protectedRoute(<SearchPage />)} />
              <Route path="/analytics" element={protectedRoute(<AnalyticsPage />)} />
              <Route path="/history" element={protectedRoute(<HistoryPage />)} />
              <Route path="/settings" element={protectedRoute(<SettingsPage />)} />
              <Route path="/watchlist" element={protectedRoute(<WatchlistPage />)} />
              <Route path="/impact" element={protectedRoute(<BusinessImpactPage />)} />
              <Route path="/supplier-hub" element={protectedRoute(<SupplierHubPage />)} />
              <Route path="/docs" element={protectedRoute(<DocsPage />)} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
      {showSplash && <SplashScreen onFinish={hideSplash} />}
    </ThemeProvider>
  );
}
