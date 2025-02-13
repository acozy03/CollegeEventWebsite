import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5050/api";

export default function UserManagement() {
  const [newUser, setNewUser] = useState({ Name: "", Email: "", Password: "", Role: "", UniversityID: "" });
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: newUser.Email, Password: newUser.Password }),
      });

      if (!response.ok) throw new Error("Invalid email or password");

      const data = await response.json();
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error("Failed to register user");
      setNewUser({ Name: "", Email: "", Password: "", Role: "", UniversityID: "" });
    } catch (err) {
      setError("Registration failed: " + err.message);
    }
  };

  return (
    <div className="user-management">
      <h2>User Authentication</h2>

      {error && <div className="error">{error}</div>}

      {!token ? (
        <>
          <form onSubmit={handleLogin}>
            <h3>Login</h3>
            <input type="email" placeholder="Email" value={newUser.Email} onChange={(e) => setNewUser({ ...newUser, Email: e.target.value })} required />
            <input type="password" placeholder="Password" value={newUser.Password} onChange={(e) => setNewUser({ ...newUser, Password: e.target.value })} required />
            <button type="submit">Login</button>
          </form>

          <form onSubmit={handleRegister}>
            <h3>Register</h3>
            <input type="text" placeholder="Name" value={newUser.Name} onChange={(e) => setNewUser({ ...newUser, Name: e.target.value })} required />
            <input type="email" placeholder="Email" value={newUser.Email} onChange={(e) => setNewUser({ ...newUser, Email: e.target.value })} required />
            <input type="password" placeholder="Password" value={newUser.Password} onChange={(e) => setNewUser({ ...newUser, Password: e.target.value })} required />
            <input type="text" placeholder="Role" value={newUser.Role} onChange={(e) => setNewUser({ ...newUser, Role: e.target.value })} required />
            <input type="text" placeholder="University ID" value={newUser.UniversityID} onChange={(e) => setNewUser({ ...newUser, UniversityID: e.target.value })} required />
            <button type="submit">Register</button>
          </form>
        </>
      ) : (
        <button onClick={() => { localStorage.removeItem("token"); setToken(""); }}>Logout</button>
      )}
    </div>
  );
}