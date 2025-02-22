import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Update the API_BASE_URL to point to the Express.js server
const API_BASE_URL = "http://localhost:5050/api"; // Replace with your Express.js server URL

export default function UserManagement() {
  const [newUser, setNewUser] = useState({
    FirstName: "",
    LastName: "",
    Username: "",
    Email: "",
    Password: "",
  });
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // Hook for navigation

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Username: newUser.Username, Password: newUser.Password }),
      });
      if (!response.ok) throw new Error("Invalid username or password");
      const data = await response.json();
  
      // Store the token and user role in local storage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role); // Assuming the backend returns the user's role
      localStorage.setItem("username", newUser.Username); // Optional: Store the username
      console.log(data.role); 
      if(data.role === "Admin") {
        navigate("/create-event");
      } 
      else navigate("/dashboard"); // Redirect to the dashboard after successful login
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FirstName: newUser.FirstName,
          LastName: newUser.LastName,
          Username: newUser.Username,
          Email: newUser.Email,
          Password: newUser.Password,
        }),
      });
      if (!response.ok) throw new Error("Failed to register user");
      setNewUser({ FirstName: "", LastName: "", Username: "", Email: "", Password: "" });
      setError(null); // Clear any previous errors
    } catch (err) {
      setError("Registration failed: " + err.message);
    }
  };

  return (
    <div className="user-management">
      <h2>User Authentication</h2>
      {error && <div className="error">{error}</div>}
      {/* Login Form */}
      <form onSubmit={handleLogin}>
        <h3>Login</h3>
        <input
          type="text"
          placeholder="Username"
          value={newUser.Username}
          onChange={(e) => setNewUser({ ...newUser, Username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.Password}
          onChange={(e) => setNewUser({ ...newUser, Password: e.target.value })}
          required
        />
        <button type="submit">Login</button>
      </form>

      {/* Registration Form */}
      <form onSubmit={handleRegister}>
        <h3>Register</h3>
        <input
          type="text"
          placeholder="First Name"
          value={newUser.FirstName}
          onChange={(e) => setNewUser({ ...newUser, FirstName: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={newUser.LastName}
          onChange={(e) => setNewUser({ ...newUser, LastName: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Username"
          value={newUser.Username}
          onChange={(e) => setNewUser({ ...newUser, Username: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.Email}
          onChange={(e) => setNewUser({ ...newUser, Email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.Password}
          onChange={(e) => setNewUser({ ...newUser, Password: e.target.value })}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}