"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../dashboard.css"

// Import icons
import { Users, User, ChevronLeft, Save, AlertTriangle, LogOut, BookOpen, UserPlus, Book } from "react-feather"

const API_BASE_URL = "http://localhost:5050/api/users"

export default function CreateRSO() {
  const navigate = useNavigate()
  const [rsoData, setRsoData] = useState({
    name: "",
    member1: "",
    member2: "",
    member3: "",
    member4: "",
    adminUsername: "", // Admin username
  })
  const [error, setError] = useState(null)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setRsoData({ ...rsoData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Combine all members into an array
    const members = [rsoData.member1, rsoData.member2, rsoData.member3, rsoData.member4, rsoData.adminUsername]

    try {
      const token = localStorage.getItem("token")
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
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create RSO")
      }

      const data = await response.json()
      alert(`RSO created successfully! RSO ID: ${data.rsoId}`)

      // Reset form
      setRsoData({
        name: "",
        member1: "",
        member2: "",
        member3: "",
        member4: "",
        adminUsername: "",
      })
    } catch (err) {
      console.error(err)
      setError(err.message || "An error occurred while creating the RSO.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    navigate("/")
  }

  const goBack = () => {
    navigate(-1)
  }

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
        </aside>

        <main className="main-content create-rso-page">
          <div className="back-button-container">
            <button onClick={goBack} className="back-button">
              <ChevronLeft size={18} />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <section className="content-section">
            <h2 className="section-title">Create a New RSO</h2>

            {error && (
              <div className="error-alert">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="create-rso-form-container">
              <form onSubmit={handleSubmit} className="create-rso-form">
                <div className="form-group">
                  <label htmlFor="rsoName">
                    <Users size={16} />
                    <span>RSO Name</span>
                  </label>
                  <input
                    id="rsoName"
                    type="text"
                    placeholder="RSO Name"
                    name="name"
                    value={rsoData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="members-section">
                  <h3>
                    <UserPlus size={18} />
                    <span>Add 4 Members</span>
                  </h3>
                  <p className="members-info">
                    Enter the usernames of 4 members who will join this RSO. All members must be from the same
                    university.
                  </p>

                  <div className="members-grid">
                    <div className="form-group">
                      <label htmlFor="member1">
                        <User size={16} />
                        <span>Member 1</span>
                      </label>
                      <input
                        id="member1"
                        type="text"
                        placeholder="Member 1 Username"
                        name="member1"
                        value={rsoData.member1}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="member2">
                        <User size={16} />
                        <span>Member 2</span>
                      </label>
                      <input
                        id="member2"
                        type="text"
                        placeholder="Member 2 Username"
                        name="member2"
                        value={rsoData.member2}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="member3">
                        <User size={16} />
                        <span>Member 3</span>
                      </label>
                      <input
                        id="member3"
                        type="text"
                        placeholder="Member 3 Username"
                        name="member3"
                        value={rsoData.member3}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="member4">
                        <User size={16} />
                        <span>Member 4</span>
                      </label>
                      <input
                        id="member4"
                        type="text"
                        placeholder="Member 4 Username"
                        name="member4"
                        value={rsoData.member4}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="adminUsername">
                    <User size={16} />
                    <span>Admin Username</span>
                  </label>
                  <input
                    id="adminUsername"
                    type="text"
                    placeholder="Admin Username"
                    name="adminUsername"
                    value={rsoData.adminUsername}
                    onChange={handleChange}
                    required
                  />
                  <p className="input-help">This user will be the administrator of the RSO</p>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    
                    <span>Create RSO</span>
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

