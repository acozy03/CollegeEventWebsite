import React, { useState } from "react";
import Map, { Marker } from "@vis.gl/react-maplibre"; // Import MapLibre and Marker
import "maplibre-gl/dist/maplibre-gl.css"; // Import styles

const API_BASE_URL = "http://localhost:5050/api";
const MAP_STYLE = "http://localhost:5050/api/map-style";

export default function CreateEvent() {
  const [eventData, setEventData] = useState({
    Name: "",
    Category: "",
    Description: "",
    Time: "",
    Date: "",
    LocationName: "", // New field for location name
    Latitude: null,   // New field for latitude
    Longitude: null,  // New field for longitude
    ContactPhone: "",
    ContactEmail: "",
    Visibility: "public",
    Approved: false,
    RSOID: "",
    UniversityID: "",
  });
  const [error, setError] = useState(null);
  const [marker, setMarker] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco

  // Handle map click to select location
  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;

    // Prompt the user to enter a location name
    const locationName = window.prompt("Enter the name of the location:");
    if (!locationName) {
      alert("Location name is required.");
      return;
    }

    // Update the marker and event data
    setMarker({ lat, lng });
    setEventData({
      ...eventData,
      LocationName: locationName, // Store the location name
      Latitude: lat,              // Store the latitude
      Longitude: lng,             // Store the longitude
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/events/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData), // Send updated eventData
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
        LocationName: "", // Reset location name
        Latitude: null,   // Reset latitude
        Longitude: null,  // Reset longitude
        ContactPhone: "",
        ContactEmail: "",
        Visibility: "public",
        Approved: false,
        RSOID: "",
        UniversityID: "",
      });
      setMarker({ lat: 37.7749, lng: -122.4194 }); // Reset marker
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
        {/* Display Selected Location Details */}
        <div>
          <input
            type="text"
            placeholder="Location Name"
            value={eventData.LocationName}
            readOnly
          />
          <input
            type="text"
            placeholder="Latitude"
            value={eventData.Latitude || ""}
            readOnly
          />
          <input
            type="text"
            placeholder="Longitude"
            value={eventData.Longitude || ""}
            readOnly
          />
        </div>
        <button type="submit">Create Event</button>
      </form>
      {/* Map Section */}
      <div style={{ height: "400px", width: "100%", marginTop: "20px" }}>
        <Map
          initialViewState={{
            longitude: marker.lng,
            latitude: marker.lat,
            zoom: 10,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          onClick={handleMapClick} // Detects user click
        >
          <Marker longitude={marker.lng} latitude={marker.lat} color="red" />
        </Map>
      </div>
    </div>
  );
}