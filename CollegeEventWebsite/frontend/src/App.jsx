import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import UserManagement from "./components/UserManagement";
import Dashboard from "./components/Dashboard";
import CreateEvent from "./components/CreateEvent";
import CreateUniversity from "./components/CreateUniversity";
import ApproveEvents from "./components/ApproveEvents";
import SuperAdminDashboard from "./components/SuperAdminDashboard"; // Import the new component
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<UserManagement />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/create-university"
          element={
            <ProtectedRoute>
              <CreateUniversity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/approve-events"
          element={
            <ProtectedRoute>
              <ApproveEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin-dashboard"
          element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;