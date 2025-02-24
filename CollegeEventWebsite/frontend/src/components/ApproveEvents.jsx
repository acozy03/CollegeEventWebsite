import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function ApproveEvents() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  // Fetch pending events
  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5050/api/superadmin/events/pending", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch pending events");
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching pending events.");
      }
    };

    fetchPendingEvents();
  }, []);

  // Approve an event
  const handleApprove = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5050/api/superadmin/events/approve/${eventId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to approve event");
      alert(`Event ID ${eventId} approved successfully!`);

      // Remove the approved event from the list
      setEvents(events.filter((event) => event.EventID !== eventId));
    } catch (err) {
      setError(err.message || "An error occurred while approving the event.");
    }
  };

  return (
    <div className="approve-events">
      <h2>Approve Events</h2>
      {error && <div className="error">{error}</div>}
      {events.length === 0 ? (
        <p>No pending events to approve.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.EventID}>
              <strong>{event.Name}</strong> - {event.Description}
              <button onClick={() => handleApprove(event.EventID)}>Approve</button>
            </li>
          ))}
        </ul>
      )}
      <Link to="/superadmin-dashboard">Back to Dashboard</Link>
    </div>
  );
}