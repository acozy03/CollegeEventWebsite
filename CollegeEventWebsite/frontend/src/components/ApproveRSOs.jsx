import React, { useEffect, useState } from "react";

const ApproveRSOs = () => {
  const [pendingRSOs, setPendingRSOs] = useState([]);
  const [error, setError] = useState(null);

  // Fetch unapproved RSOs on component mount
  useEffect(() => {
    const fetchUnapprovedRSOs = async () => {
      try {
        const token = localStorage.getItem("token"); // Get the JWT token
        if (!token) {
          setError("You must be logged in to access this page.");
          return;
        }

        const response = await fetch("http://localhost:5050/api/superadmin/rsos/unapproved", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the request
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch unapproved RSOs");
        }

        const data = await response.json();
        setPendingRSOs(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching unapproved RSOs.");
      }
    };

    fetchUnapprovedRSOs();
  }, []);

  // Function to approve an RSO
  const handleApproveRSO = async (rsoId) => {
    try {
      const token = localStorage.getItem("token"); // Get the JWT token
      if (!token) {
        setError("You must be logged in to perform this action.");
        return;
      }

      const response = await fetch(`http://localhost:5050/api/superadmin/approve-rso/${rsoId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the request
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve RSO");
      }

      alert(`RSO ID ${rsoId} approved successfully!`);
      // Remove the approved RSO from the list
      setPendingRSOs((prevRSOs) => prevRSOs.filter((rso) => rso.RSOID !== rsoId));
    } catch (err) {
      setError(err.message || "An error occurred while approving the RSO.");
    }
  };

  return (
    <div className="approve-rsos">
      <h2>Approve RSOs</h2>
      {error && <div className="error">{error}</div>}
      {pendingRSOs.length === 0 ? (
        <p>No pending RSOs to approve.</p>
      ) : (
        <ul>
          {pendingRSOs.map((rso) => (
            <li key={rso.RSOID}>
              <strong>{rso.Name}</strong> - {rso.Description}
              <button onClick={() => handleApproveRSO(rso.RSOID)}>Approve</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApproveRSOs;