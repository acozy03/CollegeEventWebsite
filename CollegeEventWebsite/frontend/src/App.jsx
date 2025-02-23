import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserManagement from "./components/UserManagement";
import Dashboard from "./components/Dashboard";
import CreateEvent from "./components/CreateEvent";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateUniversity from "./components/CreateUniversity";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserManagement />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-university"
          element={
            <ProtectedRoute>
              <CreateUniversity />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;