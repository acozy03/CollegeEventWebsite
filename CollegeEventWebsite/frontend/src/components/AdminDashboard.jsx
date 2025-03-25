"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import "../dashboard.css" // Reusing the same CSS

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [adminRSOs, setAdminRSOs] = useState([]) // Stores RSOs admin is part of
  const [selectedNewAdmin, setSelectedNewAdmin] = useState("") // Tracks selected new admin for transfer
  const [error, setError] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [events, setEvents] = useState([])
  const [availableEvents, setAvailableEvents] = useState([])
  const [activeTab, setActiveTab] = useState("myEvents")
  const [eventComments, setEventComments] = useState({})
  const [newComment, setNewComment] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventRatings, setEventRatings] = useState({})
  const [rsoName, setRsoName] = useState("")

  const token = localStorage.getItem("token")

  // Fetch user details
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

    if (token) {
      fetchUserDetails()
    } else {
      navigate("/")
    }
  }, [token, navigate])

  // Fetch RSOs for the admin on load
  useEffect(() => {
    const fetchAdminRSOs = async () => {
      try {
        const response = await fetch("http://localhost:5050/api/admin/admin-rsos", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch admin RSOs")
        }

        const data = await response.json()
        setAdminRSOs(data)
      } catch (error) {
        console.error("Error fetching admin RSOs:", error)
        setError("Error fetching RSOs")
      }
    }

    if (token) {
      fetchAdminRSOs()
    } else {
      navigate("/")
    }
  }, [token, navigate])

  // Fetch user events
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
          setEvents(data)
        } catch (error) {
          console.error("Error fetching user's events:", error)
          setError("Error fetching events")
        }
      }

      fetchUserEvents()
    }
  }, [userDetails?.userId, token])

  // Fetch available events
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
          setAvailableEvents(data)
        } catch (error) {
          console.error("Error fetching available events:", error)
        }
      }

      fetchAvailableEvents()
    }
  }, [userDetails?.userId, token])

  // Fetch comments for an event
  const fetchEventComments = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/users/event-comments/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch event comments")
      }

      const data = await response.json()
      setEventComments((prev) => ({
        ...prev,
        [eventId]: data,
      }))

      return data
    } catch (error) {
      console.error("Error fetching event comments:", error)
      return []
    }
  }

  // Fetch average rating for an event
  const fetchEventRating = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/users/event-rating/${eventId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch event rating")
      }

      const data = await response.json()
      setEventRatings((prev) => ({
        ...prev,
        [eventId]: data,
      }))

      return data
    } catch (error) {
      console.error("Error fetching event rating:", error)
      return { averageRating: 0, ratingCount: 0 }
    }
  }

  // Handle leaving an RSO
  const handleLeaveRSO = async (rsoName, isAdmin) => {
    try {
      const bodyData = { RSOName: rsoName }

      // If user is the admin, they must select a new admin
      if (isAdmin) {
        if (!selectedNewAdmin) {
          return alert("You must select a new admin before leaving.")
        }
        bodyData.newAdminUsername = selectedNewAdmin
      }

      const response = await fetch("http://localhost:5050/api/users/leave-rso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave RSO")
      }

      alert(data.message)

      // Remove RSO from UI state
      setAdminRSOs(adminRSOs.filter((rso) => rso.Name !== rsoName))
    } catch (err) {
      console.error(err)
      setError(err.message || "Error leaving RSO")
    }
  }

  // Join an RSO
  const handleJoinRSO = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:5050/api/users/join-rso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ RSOName: rsoName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join RSO")
      }

      alert(data.message)

      // Update RSOs immediately in state
      setAdminRSOs([...adminRSOs, { RSOID: data.RSOID, Name: rsoName }])
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

  // Add or update a comment
  const handleAddComment = async (eventId) => {
    try {
      const response = await fetch("http://localhost:5050/api/users/event-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          comment: newComment,
          rating: newRating,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add comment")
      }

      alert(data.message)

      // Refresh comments
      await fetchEventComments(eventId)
      await fetchEventRating(eventId)

      // Clear form
      setNewComment("")
      setNewRating(5)
    } catch (err) {
      console.error(err)
      alert(err.message || "Error adding comment")
    }
  }

  // Delete a comment
  const handleDeleteComment = async (commentId, eventId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/users/event-comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete comment")
      }

      alert(data.message)

      // Refresh comments
      await fetchEventComments(eventId)
      await fetchEventRating(eventId)
    } catch (err) {
      console.error(err)
      alert(err.message || "Error deleting comment")
    }
  }

  // Share event on Facebook
  const shareOnFacebook = (event) => {
    const eventTitle = encodeURIComponent(event.Name)
    const eventDate = encodeURIComponent(formatDate(event.Date))
    const eventLocation = encodeURIComponent(event.LocationName)
    const message = encodeURIComponent(
      `Join me at ${event.Name} on ${formatDate(event.Date)} at ${event.LocationName}!`,
    )

    const url = `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${message}`

    window.open(url, "_blank", "width=600,height=400")
  }

  // Toggle showing comments for an event
  const toggleEventComments = async (eventId) => {
    if (selectedEvent === eventId) {
      setSelectedEvent(null)
    } else {
      setSelectedEvent(eventId)

      // Fetch comments and ratings if not already loaded
      if (!eventComments[eventId]) {
        await fetchEventComments(eventId)
      }

      if (!eventRatings[eventId]) {
        await fetchEventRating(eventId)
      }
    }
  }

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    navigate("/")
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

  // Render star rating
  const renderStarRating = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "star filled" : "star"}>
          ★
        </span>,
      )
    }
    return stars
  }

  // Render star rating input
  const renderStarRatingInput = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= newRating ? "star filled" : "star"} onClick={() => setNewRating(i)}>
          ★
        </span>,
      )
    }
    return stars
  }

  return (
    <div className="dashboard">
      <h2>Admin Dashboard - Welcome, {userDetails?.name || "Admin"}!</h2>
      {userDetails?.universityName && (
        <div className="university-info">
          <p>University: {userDetails.universityName}</p>
          <p className="university-domain">({userDetails.universityDomain})</p>
        </div>
      )}

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
        <button className={activeTab === "createEvent" ? "active" : ""} onClick={() => setActiveTab("createEvent")}>
          Create Event
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

                      {/* Event Rating */}
                      {eventRatings[event.EventID] && (
                        <div className="event-rating">
                          <p>
                            <strong>Rating:</strong>{" "}
                            {renderStarRating(Number(eventRatings[event.EventID].averageRating))}(
                            {Number(eventRatings[event.EventID].averageRating).toFixed(1)}/5 from{" "}
                            {eventRatings[event.EventID].ratingCount} ratings)
                          </p>
                        </div>
                      )}

                      <div className="event-actions">
                        <button onClick={() => handleUnregisterEvent(event.EventID)} className="unregister-button">
                          Unregister
                        </button>
                        <button onClick={() => toggleEventComments(event.EventID)} className="comments-button">
                          {selectedEvent === event.EventID ? "Hide Comments" : "Show Comments"}
                        </button>
                        <button onClick={() => shareOnFacebook(event)} className="share-button">
                          Share on Facebook
                        </button>
                      </div>

                      {/* Comments Section */}
                      {selectedEvent === event.EventID && (
                        <div className="comments-section">
                          <h4>Comments and Ratings</h4>

                          {/* Add Comment Form */}
                          <div className="add-comment-form">
                            <h5>Add Your Comment</h5>
                            <div className="rating-input">
                              <label>Your Rating: </label>
                              <div className="star-rating-input">{renderStarRatingInput()}</div>
                            </div>
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Write your comment here..."
                              rows={3}
                            ></textarea>
                            <button onClick={() => handleAddComment(event.EventID)} className="submit-comment-button">
                              Submit
                            </button>
                          </div>

                          {/* Comments List */}
                          {eventComments[event.EventID] && eventComments[event.EventID].length > 0 ? (
                            <ul className="comments-list">
                              {eventComments[event.EventID].map((comment) => (
                                <li key={comment.CommentID} className="comment-item">
                                  <div className="comment-header">
                                    <span className="comment-author">{comment.FirstName}</span>
                                    <span className="comment-date">
                                      {new Date(comment.CreatedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {comment.Rating && (
                                    <div className="comment-rating">{renderStarRating(comment.Rating)}</div>
                                  )}
                                  <p className="comment-text">{comment.Comment}</p>

                                  {/* Delete button (only for user's own comments) */}
                                  {comment.UserID === userDetails?.userId && (
                                    <button
                                      onClick={() => handleDeleteComment(comment.CommentID, event.EventID)}
                                      className="delete-comment-button"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No comments yet. Be the first to comment!</p>
                          )}
                        </div>
                      )}
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

                      {/* Event Rating */}
                      {eventRatings[event.EventID] && (
                        <div className="event-rating">
                          <p>
                            <strong>Rating:</strong>{" "}
                            {renderStarRating(Number(eventRatings[event.EventID].averageRating))}(
                            {Number(eventRatings[event.EventID].averageRating).toFixed(1)}/5 from{" "}
                            {eventRatings[event.EventID].ratingCount} ratings)
                          </p>
                        </div>
                      )}

                      <div className="event-actions">
                        {isRegisteredForEvent(event.EventID) ? (
                          <button onClick={() => handleUnregisterEvent(event.EventID)} className="unregister-button">
                            Unregister
                          </button>
                        ) : (
                          <button onClick={() => handleRegisterEvent(event.EventID)} className="register-button">
                            Register
                          </button>
                        )}

                        <button onClick={() => toggleEventComments(event.EventID)} className="comments-button">
                          {selectedEvent === event.EventID ? "Hide Comments" : "Show Comments"}
                        </button>

                        <button onClick={() => shareOnFacebook(event)} className="share-button">
                          Share on Facebook
                        </button>
                      </div>

                      {/* Comments Section */}
                      {selectedEvent === event.EventID && (
                        <div className="comments-section">
                          <h4>Comments and Ratings</h4>

                          {/* Add Comment Form (only if registered) */}
                          {isRegisteredForEvent(event.EventID) && (
                            <div className="add-comment-form">
                              <h5>Add Your Comment</h5>
                              <div className="rating-input">
                                <label>Your Rating: </label>
                                <div className="star-rating-input">{renderStarRatingInput()}</div>
                              </div>
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write your comment here..."
                                rows={3}
                              ></textarea>
                              <button onClick={() => handleAddComment(event.EventID)} className="submit-comment-button">
                                Submit
                              </button>
                            </div>
                          )}

                          {/* Comments List */}
                          {eventComments[event.EventID] && eventComments[event.EventID].length > 0 ? (
                            <ul className="comments-list">
                              {eventComments[event.EventID].map((comment) => (
                                <li key={comment.CommentID} className="comment-item">
                                  <div className="comment-header">
                                    <span className="comment-author">{comment.FirstName}</span>
                                    <span className="comment-date">
                                      {new Date(comment.CreatedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {comment.Rating && (
                                    <div className="comment-rating">{renderStarRating(comment.Rating)}</div>
                                  )}
                                  <p className="comment-text">{comment.Comment}</p>

                                  {/* Delete button (only for user's own comments) */}
                                  {comment.UserID === userDetails?.userId && (
                                    <button
                                      onClick={() => handleDeleteComment(comment.CommentID, event.EventID)}
                                      className="delete-comment-button"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No comments yet. Be the first to comment!</p>
                          )}
                        </div>
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
            <h3>Your RSOs:</h3>
            {adminRSOs.length > 0 ? (
              <ul className="rso-list">
                {adminRSOs.map((rso) => (
                  <li key={rso.RSOID} className="rso-item">
                    <span className="rso-name">{rso.Name}</span>
                    <span className="rso-id">ID: {rso.RSOID}</span>

                    {rso.isAdmin && (
                      <div className="admin-controls">
                        <input
                          type="text"
                          placeholder="New admin username"
                          onChange={(e) => setSelectedNewAdmin(e.target.value)}
                          className="admin-input"
                        />
                      </div>
                    )}

                    <button onClick={() => handleLeaveRSO(rso.Name, rso.isAdmin)} className="leave-button">
                      {rso.isAdmin ? "Transfer & Leave" : "Leave"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You are not part of any RSOs.</p>
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

        {/* Create Event Tab */}
        {activeTab === "createEvent" && (
          <div className="create-event-section">
            <h3>Create a New Event</h3>
            <p>As an admin, you can create events for your university or RSO.</p>

            <div className="admin-actions">
              <Link to="/create-event">
                <button className="create-event-button">Create Event Form</button>
              </Link>
            </div>

            <div className="event-management-info">
              <h4>Event Management Guidelines:</h4>
              <ul>
                <li>Public events need to be approved by the super admin</li>
                <li>Private events are visible to students at your university</li>
                <li>RSO events are visible only to members of your RSO</li>
                <li>Provide accurate location information for all events</li>
                <li>Include contact information for event inquiries</li>
              </ul>
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

