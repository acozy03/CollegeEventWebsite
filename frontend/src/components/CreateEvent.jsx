import React, { useState } from "react";

const API_BASE_URL = "http://localhost:5050/api"; // Replace with your Express.js server URL

export default function CreateEvent() {
  const [eventData, setEventData] = useState({
    Name: "",
    Category: "",
    Description: "",
    Time: "",
    Date: "",
    LocationID: "",
    ContactPhone: "",
    ContactEmail: "",
    Visibility: "public", // Default visibility
    Approved: false, // Default to not approved
    RSOID: "", // Optional
    UniversityID: "", // Required
  });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token"); // Get the admin's token
      const response = await fetch(`${API_BASE_URL}/admin/events/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the token for authentication
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error("Failed to create event");
      const data = await response.json();
      alert(`Event created successfully! Event ID: ${data.eventId}`);
      setEventData({
        Name: "",
        Category: "",
        Description: "",
        Time: "",
        Date: "",
        LocationID: "",
        ContactPhone: "",
        ContactEmail: "",
        Visibility: "public",
        Approved: false,
        RSOID: "",
        UniversityID: "",
      });
      setError(null);
    } catch (err) {
      setError(err.message || "An error occurred while creating the event.");
    }
  };

  return (
    <div className="create-event">
      <h2>Create an Event</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Event Name"
          value={eventData.Name}
          onChange={(e) => setEventData({ ...eventData, Name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Event Category"
          value={eventData.Category}
          onChange={(e) => setEventData({ ...eventData, Category: e.target.value })}
          required
        />
        <textarea
          placeholder="Event Description"
          value={eventData.Description}
          onChange={(e) => setEventData({ ...eventData, Description: e.target.value })}
        />
        <input
          type="time"
          value={eventData.Time}
          onChange={(e) => setEventData({ ...eventData, Time: e.target.value })}
          required
        />
        <input
          type="date"
          value={eventData.Date}
          onChange={(e) => setEventData({ ...eventData, Date: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Location ID"
          value={eventData.LocationID}
          onChange={(e) => setEventData({ ...eventData, LocationID: e.target.value })}
          required
        />
        <input
          type="tel"
          placeholder="Contact Phone"
          value={eventData.ContactPhone}
          onChange={(e) => setEventData({ ...eventData, ContactPhone: e.target.value })}
        />
        <input
          type="email"
          placeholder="Contact Email"
          value={eventData.ContactEmail}
          onChange={(e) => setEventData({ ...eventData, ContactEmail: e.target.value })}
        />
        <select
          value={eventData.Visibility}
          onChange={(e) => setEventData({ ...eventData, Visibility: e.target.value })}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <input
          type="number"
          placeholder="RSO ID (Optional)"
          value={eventData.RSOID}
          onChange={(e) => setEventData({ ...eventData, RSOID: e.target.value })}
        />
        <input
          type="number"
          placeholder="University ID"
          value={eventData.UniversityID}
          onChange={(e) => setEventData({ ...eventData, UniversityID: e.target.value })}
          required
        />
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
}