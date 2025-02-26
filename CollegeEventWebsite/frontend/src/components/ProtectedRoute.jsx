import React from "react";
import { Navigate } from "react-router-dom";

// ProtectedRoute component to restrict access to certain routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // Check if the user is logged in
  const userRole = localStorage.getItem("role"); // Check the user's role
  // Redirect to login if no token exists
  if (!token) {
    return <Navigate to="/" />;
  }

  // Optionally, restrict access to admins only
  if (userRole !== "Admin" && userRole !== "Super Admin" && userRole !== "Student") {
    return <Navigate to="/" />;
  }

  // If the user is authenticated and has the correct role, render the protected content
  return children;
};

export default ProtectedRoute;