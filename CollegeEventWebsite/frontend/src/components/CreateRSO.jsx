import React, { useState } from "react";

const API_BASE_URL = "http://localhost:5050/api/users";

export default function CreateRSO() {
  const [rsoData, setRsoData] = useState({
    name: "",
    member1: "",
    member2: "",
    member3: "",
    member4: "",
    adminUsername: "", // Admin username
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRsoData({ ...rsoData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine all members into an array
    const members = [
      rsoData.member1,
      rsoData.member2,
      rsoData.member3,
      rsoData.member4,
      rsoData.adminUsername,
    ];

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/create-rso`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: rsoData.name,
          members: members.filter((member) => member.trim() !== ""), // Remove empty values
          adminUsername: rsoData.adminUsername,
        }),
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
          name="name"
          value={rsoData.name}
          onChange={handleChange}
          required
        />

        {/* Member Inputs */}
        <h3>Add 4 Members</h3>
        <input
          type="text"
          placeholder="Member 1 Username"
          name="member1"
          value={rsoData.member1}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          placeholder="Member 2 Username"
          name="member2"
          value={rsoData.member2}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          placeholder="Member 3 Username"
          name="member3"
          value={rsoData.member3}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          placeholder="Member 4 Username"
          name="member4"
          value={rsoData.member4}
          onChange={handleChange}
          required
        />

        {/* Admin Username */}
        <input
          type="text"
          placeholder="Admin Username"
          name="adminUsername"
          value={rsoData.adminUsername}
          onChange={handleChange}
          required
        />

        {/* Submit Button */}
        <button type="submit">Create RSO</button>
      </form>

      {/* Display errors if any */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}