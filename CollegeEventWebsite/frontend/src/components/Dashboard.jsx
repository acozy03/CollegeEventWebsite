import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [rsoName, setRsoName] = useState(""); // RSO ID input
  const [userDetails, setUserDetails] = useState(null); // Stores user details
  const [userRSOs, setUserRSOs] = useState([]); // ✅ Stores RSOs separately
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  // ✅ Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("http://localhost:5050/api/users/fetch", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }

        const data = await response.json();

        console.log("Fetched User Details:", data); // ✅ Debugging

        setUserDetails({
          userId: data.UserID,
          name: data.Name,
          email: data.Email,
        });

        // ❌ Don't fetch RSOs here anymore!
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

  // ✅ Fetch RSOs only after userDetails is set
  useEffect(() => {
    if (userDetails?.userId) {
      const fetchUserRSOs = async () => {
        try {
          const response = await fetch(`http://localhost:5050/api/users/user-rsos/${userDetails.userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user's RSOs");
          }

          const data = await response.json();
          console.log("Fetched RSOs:", data); // ✅ Debugging
          setUserRSOs(data);
        } catch (error) {
          console.error("Error fetching user's RSOs:", error);
        }
      };

      fetchUserRSOs();
    }
  }, [userDetails?.userId]); // ✅ Runs only when userId changes

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const handleJoinRSO = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5050/api/users/join-rso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ RSOName: rsoName }), // ✅ Send name instead of ID
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to join RSO");
      }
  
      alert(data.message);
  
      // ✅ Update RSOs immediately in state
      setUserRSOs([...userRSOs, { RSOID: data.RSOID, Name: rsoName }]);
      setRsoName(""); // Clear input field
    } catch (err) {
      console.error(err);
      setError(err.message || "Error joining RSO");
    }
  };
  

  if (!token) {
    navigate("/");
    return null;
  }

  return (
    <div className="dashboard">
      <h2>Welcome, {userDetails?.name || "User"}!</h2>

      {/* ✅ Display multiple RSOs the user is part of */}
      <h3>Your RSOs:</h3>
      {userRSOs.length > 0 ? (
        <ul>
          {userRSOs.map((rso) => (
            <li key={rso.RSOID}>{rso.Name} (ID: {rso.RSOID})</li>
          ))}
        </ul>
      ) : (
        <p>You are not part of any RSO yet.</p>
      )}

      {/* Join an RSO Form */}
      <form onSubmit={handleJoinRSO}>
      <h3>Join an RSO</h3>
      <input
        type="text"
        placeholder="Enter RSO Name"
        value={rsoName}
        onChange={(e) => setRsoName(e.target.value)}
        required
      />
      <button type="submit">Join RSO</button>
    </form>


      {/* Create an RSO */}
      <div style={{ marginTop: "20px" }}>
        <h3>Or Create a New RSO</h3>
        <Link to="/create-rso">
          <button>Create an RSO</button>
        </Link>
      </div>

      {/* Logout button */}
      <button onClick={handleLogout}>Logout</button>

      {/* Display errors if any */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
