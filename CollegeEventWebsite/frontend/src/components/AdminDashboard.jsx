import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminRSOs, setAdminRSOs] = useState([]); // Stores RSOs admin is part of
  const [selectedNewAdmin, setSelectedNewAdmin] = useState(""); // Tracks selected new admin for transfer
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  // ✅ Fetch RSOs for the admin on load
  useEffect(() => {
    const fetchAdminRSOs = async () => {
      try {
        const response = await fetch("http://localhost:5050/api/admin/admin-rsos", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch admin RSOs");
        }

        const data = await response.json();
        setAdminRSOs(data);
      } catch (error) {
        console.error("Error fetching admin RSOs:", error);
        setError("Error fetching RSOs");
      }
    };

    if (token) {
      fetchAdminRSOs();
    } else {
      navigate("/");
    }
  }, [token, navigate]);

  // ✅ Handle leaving an RSO
  const handleLeaveRSO = async (rsoName, isAdmin) => {
    try {
      const bodyData = { RSOName: rsoName };
      
      // If user is the admin, they must select a new admin
      if (isAdmin) {
        if (!selectedNewAdmin) {
          return alert("You must select a new admin before leaving.");
        }
        bodyData.newAdminUsername = selectedNewAdmin;
      }

      const response = await fetch("http://localhost:5050/api/users/leave-rso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave RSO");
      }

      alert(data.message);

      // ✅ Remove RSO from UI state
      setAdminRSOs(adminRSOs.filter(rso => rso.Name !== rsoName));
    } catch (err) {
      console.error(err);
      setError(err.message || "Error leaving RSO");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  if (!token) {
    navigate("/");
    return null;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      {/* ✅ Display RSOs the admin is involved in */}
      <h3>Your RSOs:</h3>
      {adminRSOs.length > 0 ? (
        <ul>
          {adminRSOs.map((rso) => (
            <li key={rso.RSOID}>
              {rso.Name} (ID: {rso.RSOID}) 
              
              {/* ✅ Show leave button */}
              <button onClick={() => handleLeaveRSO(rso.Name, rso.isAdmin)}>
                {rso.isAdmin ? "Transfer & Leave" : "Leave"}
              </button>

              {/* ✅ If the user is an admin, show an input to select new admin */}
              {rso.isAdmin && (
                <input
                  type="text"
                  placeholder="New admin username"
                  onChange={(e) => setSelectedNewAdmin(e.target.value)}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>You are not part of any RSOs.</p>
      )}

      {/* ✅ Link to Create Event Page */}
      <div style={{ marginTop: "20px" }}>
        <h3>Manage Events</h3>
        <Link to="/create-event">
          <button>Create an Event</button>
        </Link>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        Logout
      </button>

      {/* Display errors if any */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
