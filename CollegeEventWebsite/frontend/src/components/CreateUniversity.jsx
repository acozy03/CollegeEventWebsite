import React, { useState } from "react";

export default function CreateUniversity() {
  const [universityData, setUniversityData] = useState({
    Name: "",
    Location: "", // Changed from LocationID to Location
    Description: "",
    NumberOfStudents: "",
    Domain: "",
  });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5050/api/superadmin/universities/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(universityData),
      });

      if (!response.ok) throw new Error("Failed to create university");
      const data = await response.json();
      alert(`University created successfully! University ID: ${data.universityId}`);
      setUniversityData({
        Name: "",
        Location: "", // Reset Location field
        Description: "",
        NumberOfStudents: "",
        Domain: "",
      });
      setError(null);
    } catch (err) {
      setError(err.message || "An error occurred while creating the university.");
    }
  };

  return (
    <div className="create-university">
      <h2>Create a University</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <input
          type="text"
          placeholder="University Name"
          value={universityData.Name}
          onChange={(e) => setUniversityData({ ...universityData, Name: e.target.value })}
          required
        />
        {/* Location */}
        <input
          type="text"
          placeholder="Location (e.g., Orlando, FL)"
          value={universityData.Location}
          onChange={(e) => setUniversityData({ ...universityData, Location: e.target.value })}
          required
        />
        {/* Description */}
        <textarea
          placeholder="University Description"
          value={universityData.Description}
          onChange={(e) => setUniversityData({ ...universityData, Description: e.target.value })}
          required
        />
        {/* Number of Students */}
        <input
          type="number"
          placeholder="Number of Students"
          value={universityData.NumberOfStudents}
          onChange={(e) => setUniversityData({ ...universityData, NumberOfStudents: e.target.value })}
          required
        />
        {/* Domain */}
        <input
          type="text"
          placeholder="Email Domain (e.g., ucf.edu)"
          value={universityData.Domain}
          onChange={(e) => setUniversityData({ ...universityData, Domain: e.target.value })}
          required
        />
        <button type="submit">Create University</button>
      </form>
    </div>
  );
}