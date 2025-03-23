"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import "../dashboard.css"

export default function Dashboard() {
  const navigate = useNavigate()
  const [rsoName, setRsoName] = useState("") // RSO ID input
  const [userDetails, setUserDetails] = useState(null) // Stores user details
  const [userRSOs, setUserRSOs] = useState([]) // ✅ Stores RSOs separately
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([]) // ✅ New state for user events
  const [availableEvents, setAvailableEvents] = useState([]) // ✅ New state for available events
  const [activeTab, setActiveTab] = useState("myEvents") // ✅ For tab navigation

  const token = localStorage.getItem("token")

  // ✅ Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("http://localhost:5050/api/users/fetch", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user details")
        }

        const data = await response.json()

        console.log("Fetched User Details:", data) // ✅ Debugging

        setUserDetails({
          userId: data.UserID,
          name: data.FirstName, // Updated to match your API response
          email: data.Email,
        })

        // ❌ Don't fetch RSOs here anymore!
      } catch (err) {
        console.error(err)
        setError("Error fetching user details")
      }
    }

    if (token) {
      fetchUserDetails()
    } else {
      navigate("/")
    }
  }, [token, navigate])

  // ✅ Fetch RSOs only after userDetails is set
  useEffect(() => {
    if (userDetails?.userId) {
      const fetchUserRSOs = async () => {
        try {
          const response = await fetch(`http://localhost:5050/api/users/user-rsos/${userDetails.userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (!response.ok) {
            throw new Error("Failed to fetch user's RSOs")
          }

          const data = await response.json()
          console.log("Fetched RSOs:", data) // ✅ Debugging

          // ✅ Filter out only approved RSOs
          const approvedRSOs = data.filter((rso) => rso.Approved)
          setUserRSOs(approvedRSOs)
        } catch (error) {
          console.error("Error fetching user's RSOs:", error)
        }
      }

      fetchUserRSOs()
    }
  }, [userDetails?.userId, token]) // ✅ Runs only when userId changes

  // ✅ Fetch user events
  useEffect(() => {
    if (userDetails?.userId) {
      const fetchUserEvents = async () => {
        try {
          const response = await fetch("http://localhost:5050/api/users/events", {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (!response.ok) {
            throw new Error("Failed to fetch user's events")
          }

          const data = await response.json()
          console.log("Fetched Events:", data) // Debugging
          setEvents(data)
        } catch (error) {
          console.error("Error fetching user's events:", error)
          setError("Error fetching events")
        }
      }

      fetchUserEvents()
    }
  }, [userDetails?.userId, token])

  // ✅ Fetch available events
  useEffect(() => {
    if (userDetails?.userId) {
      const fetchAvailableEvents = async () => {
        try {
          const response = await fetch("http://localhost:5050/api/users/available-events", {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (!response.ok) {
            throw new Error("Failed to fetch available events")
          }

          const data = await response.json()
          console.log("Fetched Available Events:", data) // Debugging
          setAvailableEvents(data)
        } catch (error) {
          console.error("Error fetching available events:", error)
        }
      }

      fetchAvailableEvents()
    }
  }, [userDetails?.userId, token])

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    navigate("/")
  }

  const handleLeaveRSO = async (rsoName, newAdminUsername = null) => {
    try {
      const response = await fetch("http://localhost:5050/api/users/leave-rso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ RSOName: rsoName, newAdminUsername }), // Send newAdminUsername if applicable
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave RSO")
      }

      alert(data.message)

      // ✅ Remove RSO from state
      setUserRSOs(userRSOs.filter((rso) => rso.Name !== rsoName))
    } catch (err) {
      console.error(err)
      setError(err.message || "Error leaving RSO")
    }
  }

  const handleJoinRSO = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:5050/api/users/join-rso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ RSOName: rsoName }), // ✅ Send name instead of ID
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join RSO")
      }

      alert(data.message)

      // ✅ Update RSOs immediately in state
      setUserRSOs([...userRSOs, { RSOID: data.RSOID, Name: rsoName }])
      setRsoName("") // Clear input field
    } catch (err) {
      console.error(err)
      setError(err.message || "Error joining RSO")
    }
  }

  // Register for an event
  const handleRegisterEvent = async (eventId) => {
    try {
      const response = await fetch("http://localhost:5050/api/users/register-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register for event")
      }

      alert(data.message)

      // Refresh events after registration
      const eventsResponse = await fetch("http://localhost:5050/api/users/events", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
      }
    } catch (err) {
      console.error(err)
      alert(err.message || "Error registering for event")
    }
  }

  // Unregister from an event
  const handleUnregisterEvent = async (eventId) => {
    try {
      const response = await fetch("http://localhost:5050/api/users/unregister-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to unregister from event")
      }

      alert(data.message)

      // Remove event from state
      setEvents(events.filter((event) => event.EventID !== eventId))
    } catch (err) {
      console.error(err)
      alert(err.message || "Error unregistering from event")
    }
  }

  if (!token) {
    navigate("/")
    return null
  }

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return ""
    // If timeString is already in HH:MM:SS format
    const timeParts = timeString.split(":")
    if (timeParts.length === 3) {
      const hours = Number.parseInt(timeParts[0])
      const minutes = timeParts[1]
      const ampm = hours >= 12 ? "PM" : "AM"
      const displayHours = hours % 12 || 12 // Convert 0 to 12 for 12 AM
      return `${displayHours}:${minutes} ${ampm}`
    }
    return timeString
  }

  // Check if an event is in the user's registered events
  const isRegisteredForEvent = (eventId) => {
    return events.some((event) => event.EventID === eventId)
  }

  return (
    <div className="dashboard">
      <h2>Welcome, {userDetails?.name || "User"}!</h2>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button className={activeTab === "myEvents" ? "active" : ""} onClick={() => setActiveTab("myEvents")}>
          My Events
        </button>
        <button
          className={activeTab === "availableEvents" ? "active" : ""}
          onClick={() => setActiveTab("availableEvents")}
        >
          Available Events
        </button>
        <button className={activeTab === "myRSOs" ? "active" : ""} onClick={() => setActiveTab("myRSOs")}>
          My RSOs
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* My Events Tab */}
        {activeTab === "myEvents" && (
          <div>
            <h3>Your Upcoming Events:</h3>
            {events.length > 0 ? (
              <ul className="events-list">
                {events.map((event) => (
                  <li key={event.EventID} className="event-item">
                    <div className="event-header">
                      <h4>{event.Name}</h4>
                      <span className="event-category">{event.Category}</span>
                    </div>
                    <div className="event-details">
                      <p>
                        <strong>Date:</strong> {formatDate(event.Date)}
                      </p>
                      <p>
                        <strong>Time:</strong> {formatTime(event.Time)}
                      </p>
                      <p>
                        <strong>Location:</strong> {event.LocationName}
                      </p>
                      <p>
                        <strong>Coordinates:</strong> {event.Latitude}, {event.Longitude}
                      </p>
                      {event.Description && (
                        <p>
                          <strong>Description:</strong> {event.Description}
                        </p>
                      )}
                      {event.RSOName && (
                        <p>
                          <strong>RSO:</strong> {event.RSOName}
                        </p>
                      )}
                      {event.ContactEmail && (
                        <p>
                          <strong>Contact:</strong> {event.ContactEmail}
                        </p>
                      )}
                      <button onClick={() => handleUnregisterEvent(event.EventID)} className="unregister-button">
                        Unregister
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You are not registered for any events yet.</p>
            )}
          </div>
        )}

        {/* Available Events Tab */}
        {activeTab === "availableEvents" && (
          <div>
            <h3>Available Events:</h3>
            {availableEvents.length > 0 ? (
              <ul className="events-list">
                {availableEvents.map((event) => (
                  <li key={event.EventID} className="event-item">
                    <div className="event-header">
                      <h4>{event.Name}</h4>
                      <span className="event-category">{event.Category}</span>
                    </div>
                    <div className="event-details">
                      <p>
                        <strong>Date:</strong> {formatDate(event.Date)}
                      </p>
                      <p>
                        <strong>Time:</strong> {formatTime(event.Time)}
                      </p>
                      <p>
                        <strong>Location:</strong> {event.LocationName}
                      </p>
                      <p>
                        <strong>Coordinates:</strong> {event.Latitude}, {event.Longitude}
                      </p>
                      {event.Description && (
                        <p>
                          <strong>Description:</strong> {event.Description}
                        </p>
                      )}
                      {event.RSOName && (
                        <p>
                          <strong>RSO:</strong> {event.RSOName}
                        </p>
                      )}
                      {event.ContactEmail && (
                        <p>
                          <strong>Contact:</strong> {event.ContactEmail}
                        </p>
                      )}
                      <p>
                        <strong>Visibility:</strong> {event.Visibility}
                      </p>

                      {isRegisteredForEvent(event.EventID) ? (
                        <button onClick={() => handleUnregisterEvent(event.EventID)} className="unregister-button">
                          Unregister
                        </button>
                      ) : (
                        <button onClick={() => handleRegisterEvent(event.EventID)} className="register-button">
                          Register
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No available events found.</p>
            )}
          </div>
        )}

        {/* My RSOs Tab */}
        {activeTab === "myRSOs" && (
          <div>
            <h3>Your Approved RSOs:</h3>
            {userRSOs.length > 0 ? (
              <ul className="rso-list">
                {userRSOs.map((rso) => (
                  <li key={rso.RSOID} className="rso-item">
                    <span className="rso-name">{rso.Name}</span>
                    <span className="rso-id">ID: {rso.RSOID}</span>
                    <button onClick={() => handleLeaveRSO(rso.Name)} className="leave-button">
                      Leave
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You are not part of any approved RSO yet.</p>
            )}

            {/* Join an RSO Form */}
            <form onSubmit={handleJoinRSO} className="join-rso-form">
              <h3>Join an RSO</h3>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter RSO Name"
                  value={rsoName}
                  onChange={(e) => setRsoName(e.target.value)}
                  required
                />
                <button type="submit" className="join-button">
                  Join RSO
                </button>
              </div>
            </form>

            {/* Create an RSO */}
            <div className="create-rso-section">
              <h3>Or Create a New RSO</h3>
              <Link to="/create-rso">
                <button className="create-button">Create an RSO</button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Logout button */}
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>

      {/* Display errors if any */}
      {error && <p className="error">{error}</p>}
    </div>
  )
}

