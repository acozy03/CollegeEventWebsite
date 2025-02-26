import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [rsoId, setRsoId] = useState(""); // State for the RSO ID input
  const [userDetails, setUserDetails] = useState(null); // State to store user details
  const [error, setError] = useState(null); // State for error messages

  // Retrieve the token and username from local storage
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  // Fetch user details (including RSODID) from the backend
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("http://localhost:5050/api/users/fetch", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }

        const data = await response.json();
        setUserDetails(data);
      } catch (err) {
        console.error(err);
        setError("Error fetching user details");
      }
    };

    if (token) {
      fetchUserDetails();
    } else {
      navigate("/");
    }
  }, [token, navigate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the token
    localStorage.removeItem("username"); // Remove the username
    navigate("/"); // Redirect to the login page
  };

  // Handle joining an RSO
  const handleJoinRSO = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5050/api/users/join-rso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ RSOID: rsoId }), // ✅ Fixed key
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join RSO");
      }

      alert(data.message); // Notify the user that they joined successfully
      
      // ✅ Store RSO as an array instead of a single value
      setUserDetails({ 
        ...userDetails, 
        RSOs: [...(userDetails.RSOs || []), rsoId] 
      });

    } catch (err) {
      console.error(err);
      setError(err.message || "Error joining RSO");
    }
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

      {/* Display RSO status */}
      {userDetails && userDetails.RSODID ? (
        <p>You are already part of RSO with ID: {userDetails.RSODID}</p>
      ) : (
        <>
          <form onSubmit={handleJoinRSO}>
            <h3>Join an RSO</h3>
            <input
              type="number"
              placeholder="Enter RSO ID"
              value={rsoId}
              onChange={(e) => setRsoId(e.target.value)}
              required
            />
            <button type="submit">Join RSO</button>
          </form>

          {/* Add a "Create an RSO" button */}
          <div style={{ marginTop: "20px" }}>
            <h3>Or Create a New RSO</h3>
            <Link to="/create-rso">
              <button>Create an RSO</button>
            </Link>
          </div>
        </>
      )}

      {/* Logout button */}
      <button onClick={handleLogout}>Logout</button>

      {/* Display errors if any */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}