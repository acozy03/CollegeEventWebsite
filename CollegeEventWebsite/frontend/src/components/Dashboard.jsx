import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // Retrieve the token and user info from local storage
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username"); // You can store the username during login

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the token
    localStorage.removeItem("username"); // Remove the username
    navigate("/"); // Redirect to the login page
  }; 

  // If the user is not logged in, redirect to the login page
  if (!token) {
    navigate("/");
    return null;
  }

  return (
    <div className="dashboard">
      <h2>Welcome, {username}!</h2>
      <p>You are now logged in.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}