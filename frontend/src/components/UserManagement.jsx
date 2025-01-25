import React, { useState, useEffect } from "react"

const API_BASE_URL = "http://localhost:5000/api"

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "" })
  const [editingUser, setEditingUser] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`)
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError("Failed to fetch users: " + err.message)
    }
  }

  const addUser = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE_URL}/users/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })
      if (!response.ok) throw new Error("Failed to add user")
      await fetchUsers()
      setNewUser({ name: "", email: "", role: "" })
    } catch (err) {
      setError("Failed to add user: " + err.message)
    }
  }

  const updateUser = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      const response = await fetch(`${API_BASE_URL}/users/update/${editingUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      })
      if (!response.ok) throw new Error("Failed to update user")
      await fetchUsers()
      setEditingUser(null)
    } catch (err) {
      setError("Failed to update user: " + err.message)
    }
  }

  const deleteUser = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete user")
      await fetchUsers()
    } catch (err) {
      setError("Failed to delete user: " + err.message)
    }
  }

  return (
    <div className="user-management">
      <h2>User Management</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={editingUser ? updateUser : addUser}>
        <input
          type="text"
          placeholder="Name"
          value={editingUser ? editingUser.name : newUser.name}
          onChange={(e) =>
            editingUser
              ? setEditingUser({ ...editingUser, name: e.target.value })
              : setNewUser({ ...newUser, name: e.target.value })
          }
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={editingUser ? editingUser.email : newUser.email}
          onChange={(e) =>
            editingUser
              ? setEditingUser({ ...editingUser, email: e.target.value })
              : setNewUser({ ...newUser, email: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Role"
          value={editingUser ? editingUser.role : newUser.role}
          onChange={(e) =>
            editingUser
              ? setEditingUser({ ...editingUser, role: e.target.value })
              : setNewUser({ ...newUser, role: e.target.value })
          }
          required
        />
        <button type="submit">{editingUser ? "Update User" : "Add User"}</button>
        {editingUser && (
          <button type="button" onClick={() => setEditingUser(null)}>
            Cancel
          </button>
        )}
      </form>

      <ul>
        {users.map((user) => (
          <li key={user._id}>
            <span>
              {user.name} - {user.email} - {user.role}
            </span>
            <button onClick={() => setEditingUser(user)}>Edit</button>
            <button onClick={() => deleteUser(user._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

