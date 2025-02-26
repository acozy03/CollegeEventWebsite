import React, { useState } from "react";

const API_BASE_URL = "http://localhost:5050/api/users";

export default function CreateRSO() {
  const [rsoData, setRsoData] = useState({
    name: "",
    members: ["", "", "", ""], // Array of member IDs
    adminId: "",
  });
  const [error, setError] = useState(null);

  const handleChange = (e, index) => {
    const { value } = e.target;
    const updatedMembers = [...rsoData.members];
    updatedMembers[index] = value;
    setRsoData({ ...rsoData, members: updatedMembers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/create-rso`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rsoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create RSO");
      }

      const data = await response.json();
      alert(`RSO created successfully! RSO ID: ${data.rsoId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while creating the RSO.");
    }
  };

  return (
    <div className="create-rso">
      <h2>Create a New RSO</h2>
      <form onSubmit={handleSubmit}>
        {/* RSO Name */}
        <input
          type="text"
          placeholder="RSO Name"
          value={rsoData.name}
          onChange={(e) => setRsoData({ ...rsoData, name: e.target.value })}
          required
        />

        {/* Member Inputs */}
        <h3>Add 4 Members</h3>
        {rsoData.members.map((member, index) => (
          <input
            key={index}
            type="number"
            placeholder={`Member ${index + 1} ID`}
            value={member}
            onChange={(e) => handleChange(e, index)}
            required
          />
        ))}

        {/* Admin ID */}
        <input
          type="number"
          placeholder="Admin ID"
          value={rsoData.adminId}
          onChange={(e) =>
            setRsoData({ ...rsoData, adminId: e.target.value })
          }
          required
        />

        <button type="submit">Create RSO</button>
      </form>

      {/* Display errors if any */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}