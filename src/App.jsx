// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import MfaGate from "./components/MfaGate";
import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Security from "./pages/Security.jsx";
import ReportsOverview from "./pages/ReportsOverview.jsx";
import UserReports from "./pages/UserReports.jsx";
import ProductReports from "./pages/ProductReports.jsx";
import RatingReports from "./pages/RatingReports.jsx";
import CustomerSupport from "./pages/CustomerSupport.jsx";
import UserManagement from "./pages/UserManagement.jsx";

/**
 * Wraps a page in the authenticated shell.
 *  - mfa=true  → also enforces MFA enrollment (everything except /security)
 *  - fullBleed → page manages its own height (e.g. the chat/support view)
 */
function Protected({ title, children, mfa = true, fullBleed = false }) {
  const shell = (
    <AppLayout title={title} fullBleed={fullBleed}>
      {children}
    </AppLayout>
  );
  return (
    <ProtectedRoute>{mfa ? <MfaGate>{shell}</MfaGate> : shell}</ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <Protected title="Dashboard">
            <Dashboard />
          </Protected>
        }
      />

      <Route
        path="/reports"
        element={
          <Protected title="Reports">
            <ReportsOverview />
          </Protected>
        }
      />
      <Route
        path="/reports/users"
        element={
          <Protected title="User Reports">
            <UserReports />
          </Protected>
        }
      />
      <Route
        path="/reports/products"
        element={
          <Protected title="Product Reports">
            <ProductReports />
          </Protected>
        }
      />
      <Route
        path="/reports/ratings"
        element={
          <Protected title="Rating Reports">
            <RatingReports />
          </Protected>
        }
      />

      <Route
        path="/users"
        element={
          <Protected title="User Management">
            <UserManagement />
          </Protected>
        }
      />

      <Route
        path="/support"
        element={
          <Protected title="Customer Support" fullBleed>
            <CustomerSupport />
          </Protected>
        }
      />

      {/* Security is reachable without MFA so first-time enrollment can happen */}
      <Route
        path="/security"
        element={
          <Protected title="Security" mfa={false}>
            <Security />
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
