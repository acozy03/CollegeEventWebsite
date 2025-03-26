"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import "../dashboard.css"

// Import icons
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  LogOut, 
  MapPin, 
  Clock, 
  Info, 
  Mail, 
  Share2, 
  User, 
  Star, 
  Plus, 
  Minus, 
  MessageSquare,
  BookOpen
} from "react-feather"

export default function Dashboard() {
  const navigate = useNavigate()
  const [rsoName, setRsoName] = useState("") // RSO ID input
  const [userDetails, setUserDetails] = useState(null) // Stores user details including university
  const [userRSOs, setUserRSOs] = useState([]) // Stores RSOs separately
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([]) // New state for user events
  const [availableEvents, setAvailableEvents] = useState([]) // New state for available events
  const [activeTab, setActiveTab] = useState("myEvents") // For tab navigation
  const [eventComments, setEventComments] = useState({}) // Store comments for each event
  const [newComment, setNewComment] = useState("") // New comment text
  const [newRating, setNewRating] = useState(5) // New rating value
  const [selectedEvent, setSelectedEvent] = useState(null) // Selected event for comments
  const [eventRatings, setEventRatings] = useState({}) // Store average ratings
  const [expandedEvents, setExpandedEvents] = useState({}) // Track expanded event descriptions

  const token = localStorage.getItem("token")

  // Toggle event description expansion
  const toggleEventExpansion = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

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
        });
        
        const uniData = await uniResponse.json();

        setUserDetails({
          userId: data.UserID,
          name: data.FirstName,
          email: data.Email,
          universityId: data.UniversityID,
          universityName: uniData.Name,
          universityDomain: uniData.Domain
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

  // Fetch RSOs only after userDetails is set
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
          
          // Filter out only approved RSOs
          const approvedRSOs = data.filter((rso) => rso.Approved)
          setUserRSOs(approvedRSOs)
        } catch (error) {
          console.error("Error fetching user's RSOs:", error)
        }
      }

      fetchUserRSOs()
    }
  }, [userDetails?.userId, token])

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

      // Remove RSO from state
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
        body: JSON.stringify({ RSOName: rsoName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join RSO")
      }

      alert(data.message)

      // Update RSOs immediately in state
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

  // Get event category color
  const getCategoryColor = (category) => {
    const categoryColors = {
      'Social': 'var(--color-social)',
      'Academic': 'var(--color-academic)',
      'Sports': 'var(--color-sports)',
      'Cultural': 'var(--color-cultural)',
      'Career': 'var(--color-career)'
    };
    
    return categoryColors[category] || 'var(--color-default)';
  };

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="navbar-brand">
          <h1>Campus Events</h1>
        </div>
        <div className="navbar-user">
          <div className="user-info">
            <User size={18} />
            <span>{userDetails?.name || "User"}</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="university-card">
            <BookOpen size={24} />
            <div className="university-info">
              <h3>{userDetails?.universityName || "University"}</h3>
              <p className="university-domain">{userDetails?.universityDomain}</p>
            </div>
          </div>
          
          <nav className="main-nav">
            <button 
              className={`nav-item ${activeTab === "myEvents" ? "active" : ""}`} 
              onClick={() => setActiveTab("myEvents")}
            >
              <Calendar size={18} />
              <span>My Events</span>
            </button>
            <button 
              className={`nav-item ${activeTab === "availableEvents" ? "active" : ""}`} 
              onClick={() => setActiveTab("availableEvents")}
            >
              <Calendar size={18} />
              <span>Available Events</span>
            </button>
            <button 
              className={`nav-item ${activeTab === "myRSOs" ? "active" : ""}`} 
              onClick={() => setActiveTab("myRSOs")}
            >
              <User size={18} />
              <span>My RSOs</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* My Events Tab */}
          {activeTab === "myEvents" && (
            <section className="content-section">
              <h2 className="section-title">My Upcoming Events</h2>
              {events.length > 0 ? (
                <div className="events-grid">
                  {events.map((event) => (
                    <motion.div 
                      key={event.EventID} 
                      className="event-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="event-card-header" style={{ borderColor: getCategoryColor(event.Category) }}>
                        <h3>{event.Name}</h3>
                        <span className="event-category" style={{ backgroundColor: getCategoryColor(event.Category) }}>
                          {event.Category}
                        </span>
                      </div>
                      
                      <div className="event-card-body">
                        <div className="event-info">
                          <div className="event-info-item">
                            <Calendar size={16} />
                            <span>{formatDate(event.Date)}</span>
                          </div>
                          <div className="event-info-item">
                            <Clock size={16} />
                            <span>{formatTime(event.Time)}</span>
                          </div>
                          <div className="event-info-item">
                            <MapPin size={16} />
                            <span>{event.LocationName}</span>
                          </div>
                        </div>
                        
                        {/* Expandable Details */}
                        <button 
                          className="expand-button"
                          onClick={() => toggleEventExpansion(event.EventID)}
                        >
                          {expandedEvents[event.EventID] ? (
                            <>
                              <ChevronUp size={16} />
                              <span>Hide Details</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              <span>Show Details</span>
                            </>
                          )}
                        </button>
                        
                        <AnimatePresence>
                          {expandedEvents[event.EventID] && (
                            <motion.div 
                              className="event-details"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {event.Description && (
                                <div className="event-detail-item">
                                  <Info size={16} />
                                  <p>{event.Description}</p>
                                </div>
                              )}
                              
                              {event.RSOName && (
                                <div className="event-detail-item">
                                  <User size={16} />
                                  <p>Organized by: {event.RSOName}</p>
                                </div>
                              )}
                              
                              {event.ContactEmail && (
                                <div className="event-detail-item">
                                  <Mail size={16} />
                                  <p>Contact: {event.ContactEmail}</p>
                                </div>
                              )}
                              
                              <div className="event-detail-item">
                                <MapPin size={16} />
                                <p>Coordinates: {event.Latitude}, {event.Longitude}</p>
                              </div>
                              
                              {/* Event Rating */}
                              {eventRatings[event.EventID] && (
                                <div className="event-rating">
                                  <Star size={16} />
                                  <div>
                                    {renderStarRating(Number(eventRatings[event.EventID].averageRating))}
                                    <span className="rating-text">
                                      ({Number(eventRatings[event.EventID].averageRating).toFixed(1)}/5 from {eventRatings[event.EventID].ratingCount} ratings)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div className="event-card-actions">
                        <button 
                          onClick={() => handleUnregisterEvent(event.EventID)}
                          className="action-button unregister-button"
                        >
                          <Minus size={16} />
                          <span>Unregister</span>
                        </button>
                        <button 
                          onClick={() => toggleEventComments(event.EventID)}
                          className="action-button comments-button"
                        >
                          <MessageSquare size={16} />
                          <span>{selectedEvent === event.EventID ? "Hide Comments" : "Comments"}</span>
                        </button>
                        <button 
                          onClick={() => shareOnFacebook(event)}
                          className="action-button share-button"
                        >
                          <Share2 size={16} />
                          <span>Share</span>
                        </button>
                      </div>
                      
                      {/* Comments Section */}
                      <AnimatePresence>
                        {selectedEvent === event.EventID && (
                          <motion.div 
                            className="comments-section"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
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
                              <p className="no-comments">No comments yet. Be the first to comment!</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Calendar size={48} />
                  <p>You are not registered for any events yet.</p>
                  <button 
                    className="action-button"
                    onClick={() => setActiveTab("availableEvents")}
                  >
                    Browse Available Events
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Available Events Tab */}
          {activeTab === "availableEvents" && (
            <section className="content-section">
              <h2 className="section-title">Available Events</h2>
              {availableEvents.length > 0 ? (
                <div className="events-grid">
                  {availableEvents.map((event) => (
                    <motion.div 
                      key={event.EventID} 
                      className="event-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="event-card-header" style={{ borderColor: getCategoryColor(event.Category) }}>
                        <h3>{event.Name}</h3>
                        <span className="event-category" style={{ backgroundColor: getCategoryColor(event.Category) }}>
                          {event.Category}
                        </span>
                      </div>
                      
                      <div className="event-card-body">
                        <div className="event-info">
                          <div className="event-info-item">
                            <Calendar size={16} />
                            <span>{formatDate(event.Date)}</span>
                          </div>
                          <div className="event-info-item">
                            <Clock size={16} />
                            <span>{formatTime(event.Time)}</span>
                          </div>
                          <div className="event-info-item">
                            <MapPin size={16} />
                            <span>{event.LocationName}</span>
                          </div>
                        </div>
                        
                        {/* Expandable Details */}
                        <button 
                          className="expand-button"
                          onClick={() => toggleEventExpansion(event.EventID)}
                        >
                          {expandedEvents[event.EventID] ? (
                            <>
                              <ChevronUp size={16} />
                              <span>Hide Details</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              <span>Show Details</span>
                            </>
                          )}
                        </button>
                        
                        <AnimatePresence>
                          {expandedEvents[event.EventID] && (
                            <motion.div 
                              className="event-details"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {event.Description && (
                                <div className="event-detail-item">
                                  <Info size={16} />
                                  <p>{event.Description}</p>
                                </div>
                              )}
                              
                              {event.RSOName && (
                                <div className="event-detail-item">
                                  <User size={16} />
                                  <p>Organized by: {event.RSOName}</p>
                                </div>
                              )}
                              
                              {event.ContactEmail && (
                                <div className="event-detail-item">
                                  <Mail size={16} />
                                  <p>Contact: {event.ContactEmail}</p>
                                </div>
                              )}
                              
                              <div className="event-detail-item">
                                <MapPin size={16} />
                                <p>Coordinates: {event.Latitude}, {event.Longitude}</p>
                              </div>
                              
                              <div className="event-detail-item">
                                <Info size={16} />
                                <p>Visibility: {event.Visibility}</p>
                              </div>
                              
                              {/* Event Rating */}
                              {eventRatings[event.EventID] && (
                                <div className="event-rating">
                                  <Star size={16} />
                                  <div>
                                    {renderStarRating(Number(eventRatings[event.EventID].averageRating))}
                                    <span className="rating-text">
                                      ({Number(eventRatings[event.EventID].averageRating).toFixed(1)}/5 from {eventRatings[event.EventID].ratingCount} ratings)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div className="event-card-actions">
                        {isRegisteredForEvent(event.EventID) ? (
                          <button 
                            onClick={() => handleUnregisterEvent(event.EventID)}
                            className="action-button unregister-button"
                          >
                            <Minus size={16} />
                            <span>Unregister</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRegisterEvent(event.EventID)}
                            className="action-button register-button"
                          >
                            <Plus size={16} />
                            <span>Register</span>
                          </button>
                        )}
                        <button 
                          onClick={() => toggleEventComments(event.EventID)}
                          className="action-button comments-button"
                        >
                          <MessageSquare size={16} />
                          <span>{selectedEvent === event.EventID ? "Hide Comments" : "Comments"}</span>
                        </button>
                        <button 
                          onClick={() => shareOnFacebook(event)}
                          className="action-button share-button"
                        >
                          <Share2 size={16} />
                          <span>Share</span>
                        </button>
                      </div>
                      
                      {/* Comments Section */}
                      <AnimatePresence>
                        {selectedEvent === event.EventID && (
                          <motion.div 
                            className="comments-section"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
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
                              <p className="no-comments">No comments yet. Be the first to comment!</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Calendar size={48} />
                  <p>No available events found.</p>
                </div>
              )}
            </section>
          )}

          {/* My RSOs Tab */}
          {activeTab === "myRSOs" && (
            <section className="content-section">
              <h2 className="section-title">My RSOs</h2>
              
              {userRSOs.length > 0 ? (
                <div className="rso-list">
                  {userRSOs.map((rso) => (
                    <motion.div 
                      key={rso.RSOID} 
                      className="rso-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="rso-card-content">
                        <h3 className="rso-name">{rso.Name}</h3>
                        <span className="rso-id">ID: {rso.RSOID}</span>
                      </div>
                      <button 
                        onClick={() => handleLeaveRSO(rso.Name)} 
                        className="leave-button"
                      >
                        Leave
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <User size={48} />
                  <p>You are not part of any approved RSO yet.</p>
                </div>
              )}

              {/* Join an RSO Form */}
              <div className="rso-actions">
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
                      <Plus size={16} />
                      <span>Join RSO</span>
                    </button>
                  </div>
                </form>

                {/* Create an RSO */}
                <div className="create-rso-section">
                  <h3>Or Create a New RSO</h3>
                  <Link to="/create-rso" className="create-button">
                    <Plus size={16} />
                    <span>Create an RSO</span>
                  </Link>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Display errors if any */}
      {error && (
        <div className="error-toast">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  )
}
