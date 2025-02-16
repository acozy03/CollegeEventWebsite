import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserManagement from "./components/UserManagement";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserManagement />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;