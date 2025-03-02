import React, { useState, useEffect } from "react";
import Map, { Marker } from "@vis.gl/react-maplibre"; // Map library
import "maplibre-gl/dist/maplibre-gl.css"; // Styles

const API_BASE_URL = "http://localhost:5050/api";
const MAP_STYLE = "http://localhost:5050/api/map-style";

export default function CreateEvent() {
  const [eventData, setEventData] = useState({
    Name: "",
    Category: "",
    Description: "",
    Time: "",
    Date: "",
    LocationName: "", // ✅ Location Name
    Latitude: null,   // ✅ Latitude
    Longitude: null,  // ✅ Longitude
    ContactPhone: "",
    ContactEmail: "",
    Visibility: "public", // Default to public
  });

  const [marker, setMarker] = useState({ lat: 28.541619, lng: -81.374569 });
  const [adminRSOs, setAdminRSOs] = useState([]); // List of RSOs the admin manages
  const [selectedRSOID, setSelectedRSOID] = useState(""); // Selected RSO ID
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminRSOs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/admin/admin-rsos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch admin RSOs");

        const data = await response.json();
        setAdminRSOs(data);

        // Auto-select if admin is only in one RSO
        if (data.length === 1) {
          setSelectedRSOID(data[0].RSOID);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchAdminRSOs();
  }, []);

  // Handle location selection on the map
  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;
    const locationName = window.prompt("Enter the name of the location:");
    if (!locationName) {
      alert("Location name is required.");
      return;
    }

    setMarker({ lat, lng });
    setEventData({
      ...eventData,
      LocationName: locationName, // ✅ Store Location Name
      Latitude: lat,              // ✅ Store Latitude
      Longitude: lng,             // ✅ Store Longitude
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure RSO selection if the event is an RSO event
    if (eventData.Visibility === "rso" && adminRSOs.length > 1 && !selectedRSOID) {
      alert("You are an admin of multiple RSOs. Please select one before submitting.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/events/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventData,
          RSOID: eventData.Visibility === "rso" ? selectedRSOID : null, // Only include RSOID if event is an RSO event
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.adminRSOs) {
          alert(`You are an admin of multiple RSOs. Please select one: ${errorData.adminRSOs.join(", ")}`);
        }
        throw new Error(errorData.error || "Failed to create event");
      }

      const data = await response.json();
      alert(`Event created successfully! Event ID: ${data.eventId}`);

      // Reset event data
      setEventData({
        Name: "",
        Category: "",
        Description: "",
        Time: "",
        Date: "",
        LocationName: "",
        Latitude: null,
        Longitude: null,
        ContactPhone: "",
        ContactEmail: "",
        Visibility: "public",
      });

      setMarker({ lat: 28.5, lng: -81.205 });
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
        {/* ✅ Event Name */}
        <input
          type="text"
          placeholder="Event Name"
          value={eventData.Name}
          onChange={(e) => setEventData({ ...eventData, Name: e.target.value })}
          required
        />

        {/* ✅ Event Category */}
        <input
          type="text"
          placeholder="Event Category"
          value={eventData.Category}
          onChange={(e) => setEventData({ ...eventData, Category: e.target.value })}
          required
        />

        {/* ✅ Event Description */}
        <textarea
          placeholder="Event Description"
          value={eventData.Description}
          onChange={(e) => setEventData({ ...eventData, Description: e.target.value })}
        />

        {/* ✅ Event Time */}
        <input
          type="time"
          value={eventData.Time}
          onChange={(e) => setEventData({ ...eventData, Time: e.target.value })}
          required
        />

        {/* ✅ Event Date */}
        <input
          type="date"
          value={eventData.Date}
          onChange={(e) => setEventData({ ...eventData, Date: e.target.value })}
          required
        />

        {/* ✅ Contact Info */}
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

        {/* ✅ Visibility Dropdown */}
        <select
          value={eventData.Visibility}
          onChange={(e) => {
            setEventData({ ...eventData, Visibility: e.target.value });
            if (e.target.value !== "rso") {
              setSelectedRSOID(""); // Clear RSO selection if it's not an RSO event
            }
          }}
        >
          <option value="public">Public (Requires Approval)</option>
          <option value="private">Private (Visible to University Only)</option>
          <option value="rso">RSO Event (Visible to RSO Members Only)</option>
        </select>

        {/* ✅ Show RSO selection only if "RSO Event" is selected */}
        {eventData.Visibility === "rso" && adminRSOs.length > 1 && (
          <select
            value={selectedRSOID}
            onChange={(e) => setSelectedRSOID(e.target.value)}
            required
          >
            <option value="">Select an RSO</option>
            {adminRSOs.map((rso) => (
              <option key={rso.RSOID} value={rso.RSOID}>
                {rso.Name} (ID: {rso.RSOID})
              </option>
            ))}
          </select>
        )}

        {/* ✅ Display Location Info */}
        <input type="text" placeholder="Location Name" value={eventData.LocationName} readOnly />
        <input type="text" placeholder="Latitude" value={eventData.Latitude || ""} readOnly />
        <input type="text" placeholder="Longitude" value={eventData.Longitude || ""} readOnly />

        <button type="submit">Create Event</button>
      </form>

      {/* ✅ Map Section */}
      <div style={{ height: "400px", width: "100%", marginTop: "20px" }}>
        <Map
          initialViewState={{
            longitude: marker.lng,
            latitude: marker.lat,
            zoom: 10,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          onClick={handleMapClick}
        >
          <Marker longitude={marker.lng} latitude={marker.lat} color="red" />
        </Map>
      </div>
    </div>
  );
}
