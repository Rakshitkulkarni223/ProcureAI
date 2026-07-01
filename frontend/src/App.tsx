import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { WalkthroughPage } from './pages/WalkthroughPage';

const protectedRoute = (el: React.ReactNode) => (
  <ProtectedRoute>
    <AppLayout>{el}</AppLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={protectedRoute(<DashboardPage />)} />
          <Route path="/search" element={protectedRoute(<SearchPage />)} />
          <Route path="/analytics" element={protectedRoute(<AnalyticsPage />)} />
          <Route path="/history" element={protectedRoute(<HistoryPage />)} />
          <Route path="/settings" element={protectedRoute(<SettingsPage />)} />
          <Route path="/walkthrough" element={protectedRoute(<WalkthroughPage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
