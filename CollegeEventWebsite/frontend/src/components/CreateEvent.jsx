"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Map, { Marker } from "@vis.gl/react-maplibre" // Map library
import "maplibre-gl/dist/maplibre-gl.css" // Styles
import "../dashboard.css"

// Import icons
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  ChevronLeft,
  Save,
  Info,
  AlertTriangle,
  User,
  LogOut,
} from "react-feather"

const API_BASE_URL = "http://localhost:5050/api"
const MAP_STYLE = "http://localhost:5050/api/map-style" // Fallback map style

export default function CreateEvent() {
  const navigate = useNavigate()
  const [eventData, setEventData] = useState({
    Name: "",
    Category: "",
    Description: "",
    Time: "",
    Date: "",
    LocationName: "", // ✅ Location Name
    Latitude: null, // ✅ Latitude
    Longitude: null, // ✅ Longitude
    ContactPhone: "",
    ContactEmail: "",
    Visibility: "public", // Default to public
  })

  const [marker, setMarker] = useState({ lat: 28.541619, lng: -81.374569 })
  const [adminRSOs, setAdminRSOs] = useState([]) // List of RSOs the admin manages
  const [selectedRSOID, setSelectedRSOID] = useState("") // Selected RSO ID
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [userDetails, setUserDetails] = useState(null)

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("http://localhost:5050/api/users/fetch", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user details")
        }

        const data = await response.json()

        // Fetch university information
        const uniResponse = await fetch(`http://localhost:5050/api/users/university/${data.UniversityID}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const uniData = await uniResponse.json()

        setUserDetails({
          userId: data.UserID,
          name: data.FirstName,
          email: data.Email,
          universityId: data.UniversityID,
          universityName: uniData.Name,
          universityDomain: uniData.Domain,
        })
      } catch (err) {
        console.error(err)
        setError("Error fetching user details")
      }
    }

    const token = localStorage.getItem("token")
    if (token) {
      fetchUserDetails()
    } else {
      navigate("/")
    }
  }, [navigate])

  useEffect(() => {
    const fetchAdminRSOs = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`${API_BASE_URL}/admin/admin-rsos`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Failed to fetch admin RSOs")

        const data = await response.json()
        setAdminRSOs(data)

        // Auto-select if admin is only in one RSO
        if (data.length === 1) {
          setSelectedRSOID(data[0].RSOID)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchAdminRSOs()
  }, [])

  // Handle location selection on the map
  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat
    const locationName = window.prompt("Enter the name of the location:")
    if (!locationName) {
      alert("Location name is required.")
      return
    }

    setMarker({ lat, lng })
    setEventData({
      ...eventData,
      LocationName: locationName, // ✅ Store Location Name
      Latitude: lat, // ✅ Store Latitude
      Longitude: lng, // ✅ Store Longitude
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate RSO selection if the event is an RSO event
    if (eventData.Visibility === "rso") {
      if (adminRSOs.length === 0) {
        setError("You are not an admin of any RSO. You cannot create RSO events.")
        return
      }

      if (adminRSOs.length > 0 && !selectedRSOID) {
        setError("Please select an RSO for this event.")
        return
      }
    }

    try {
      const token = localStorage.getItem("token")
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
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create event")
      }

      const data = await response.json()
      setSuccess(`Event created successfully! Event ID: ${data.eventId}`)

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
      })

      setMarker({ lat: 28.5, lng: -81.205 })
      setSelectedRSOID("")
    } catch (err) {
      setError(err.message || "An error occurred while creating the event.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    navigate("/")
  }

  const goBack = () => {
    navigate("/admin-dashboard")
  }

  // Get category options
  const categoryOptions = [
    { value: "Social", label: "Social" },
    { value: "Academic", label: "Academic" },
    { value: "Sports", label: "Sports" },
    { value: "Cultural", label: "Cultural" },
    { value: "Career", label: "Career" },
    { value: "Other", label: "Other" },
  ]

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="navbar-brand">
          <h1>
            Campus Events <span className="admin-badge">Admin</span>
          </h1>
        </div>
        <div className="navbar-user">
          <div className="user-info">
            <User size={18} />
            <span>{userDetails?.name || "Admin"}</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <main className="main-content create-event-page full-width">
          <div className="back-button-container">
            <button onClick={goBack} className="back-button">
              <ChevronLeft size={18} />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <section className="content-section">
            <h2 className="section-title">Create a New Event</h2>

            {error && (
              <div className="error-alert">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-alert">
                <Info size={18} />
                <span>{success}</span>
              </div>
            )}

            <div className="create-event-form-container">
              <form onSubmit={handleSubmit} className="create-event-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="eventName">
                      <Info size={16} />
                      <span>Event Name</span>
                    </label>
                    <input
                      id="eventName"
                      type="text"
                      placeholder="Event Name"
                      value={eventData.Name}
                      onChange={(e) => setEventData({ ...eventData, Name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eventCategory">
                      <Info size={16} />
                      <span>Event Category</span>
                    </label>
                    <select
                      id="eventCategory"
                      value={eventData.Category}
                      onChange={(e) => setEventData({ ...eventData, Category: e.target.value })}
                      required
                    >
                      <option value="">Select a category</option>
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="eventDescription">
                      <Info size={16} />
                      <span>Event Description</span>
                    </label>
                    <textarea
                      id="eventDescription"
                      placeholder="Event Description"
                      value={eventData.Description}
                      onChange={(e) => setEventData({ ...eventData, Description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eventTime">
                      <Clock size={16} />
                      <span>Event Time</span>
                    </label>
                    <input
                      id="eventTime"
                      type="time"
                      value={eventData.Time}
                      onChange={(e) => setEventData({ ...eventData, Time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eventDate">
                      <Calendar size={16} />
                      <span>Event Date</span>
                    </label>
                    <input
                      id="eventDate"
                      type="date"
                      value={eventData.Date}
                      onChange={(e) => setEventData({ ...eventData, Date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactPhone">
                      <Phone size={16} />
                      <span>Contact Phone</span>
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      placeholder="Contact Phone"
                      value={eventData.ContactPhone}
                      onChange={(e) => setEventData({ ...eventData, ContactPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactEmail">
                      <Mail size={16} />
                      <span>Contact Email</span>
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      placeholder="Contact Email"
                      value={eventData.ContactEmail}
                      onChange={(e) => setEventData({ ...eventData, ContactEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="eventVisibility">
                      <Globe size={16} />
                      <span>Event Visibility</span>
                    </label>
                    <select
                      id="eventVisibility"
                      value={eventData.Visibility}
                      onChange={(e) => {
                        setEventData({ ...eventData, Visibility: e.target.value })
                        if (e.target.value !== "rso") {
                          setSelectedRSOID("") // Clear RSO selection if it's not an RSO event
                        } else if (adminRSOs.length === 1) {
                          // Auto-select if admin is only in one RSO
                          setSelectedRSOID(adminRSOs[0].RSOID)
                        }
                      }}
                    >
                      <option value="public">Public (Requires Approval)</option>
                      <option value="private">Private (Visible to University Only)</option>
                      <option value="rso">RSO Event (Visible to RSO Members Only)</option>
                    </select>

                    {eventData.Visibility === "rso" && adminRSOs.length === 0 && (
                      <p className="input-help error-text">
                        You are not an admin of any RSO. You cannot create RSO events.
                      </p>
                    )}

                    {eventData.Visibility === "public" && (
                      <p className="input-help">
                        Public events require approval from a super admin before they become visible.
                      </p>
                    )}

                    {eventData.Visibility === "private" && (
                      <p className="input-help">Private events are only visible to members of your university.</p>
                    )}

                    {eventData.Visibility === "rso" && adminRSOs.length > 0 && (
                      <p className="input-help">RSO events are only visible to members of the selected RSO.</p>
                    )}
                  </div>

                  {/* Show RSO selection when "RSO Event" is selected */}
                  {eventData.Visibility === "rso" && adminRSOs.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="rsoSelect">
                        <Users size={16} />
                        <span>Select RSO</span>
                      </label>
                      <select
                        id="rsoSelect"
                        value={selectedRSOID}
                        onChange={(e) => setSelectedRSOID(e.target.value)}
                        required={eventData.Visibility === "rso"}
                      >
                        <option value="">Select an RSO</option>
                        {adminRSOs.map((rso) => (
                          <option key={rso.RSOID} value={rso.RSOID}>
                            {rso.Name}
                          </option>
                        ))}
                      </select>
                      <p className="input-help">You can only create events for RSOs where you are an admin.</p>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="locationName">
                      <MapPin size={16} />
                      <span>Location Name</span>
                    </label>
                    <input
                      id="locationName"
                      type="text"
                      placeholder="Click on map to set location"
                      value={eventData.LocationName}
                      readOnly
                    />
                  </div>

                  <div className="form-group location-coordinates">
                    <div>
                      <label htmlFor="latitude">Latitude</label>
                      <input
                        id="latitude"
                        type="text"
                        placeholder="Latitude"
                        value={eventData.Latitude || ""}
                        readOnly
                      />
                    </div>
                    <div>
                      <label htmlFor="longitude">Longitude</label>
                      <input
                        id="longitude"
                        type="text"
                        placeholder="Longitude"
                        value={eventData.Longitude || ""}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="map-container">
                  <h3>
                    <MapPin size={16} />
                    <span>Select Event Location (Click on Map)</span>
                  </h3>
                  <div className="map-wrapper">
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
                      {marker && <Marker longitude={marker.lng} latitude={marker.lat} color="red" />}
                    </Map>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    <Save size={18} />
                    <span>Create Event</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

