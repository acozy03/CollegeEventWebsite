// Import necessary modules
import express from "express";
import connection from "../db/connection.js";
import { authenticate } from "./auth.js";

const adminRoutes = express.Router();

// Middleware to ensure only admins can access this route
const isAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// Route to create a new event
adminRoutes.route("/events/add").post(authenticate, isAdmin, async (req, res) => {
  const {
    Name,
    Category,
    Description,
    Time,
    Date,
    LocationID,
    ContactPhone,
    ContactEmail,
    Visibility,
    Approved,
    RSOID,
    UniversityID,
  } = req.body;

  // Validate required fields
  if (!Name || !Category || !Time || !Date || !LocationID || !UniversityID) {
    return res.status(400).json({ error: "All required fields must be provided." });
  }

  try {
    // Insert the event into the database
    const query =
      "INSERT INTO events (Name, Category, Description, Time, Date, LocationID, ContactPhone, ContactEmail, Visibility, Approved, AdminID, RSOID, UniversityID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const [result] = await connection.promise().query(query, [
      Name,
      Category,
      Description,
      Time,
      Date,
      LocationID,
      ContactPhone,
      ContactEmail,
      Visibility || "Public", // Default to "public" if not provided
      Approved || 1, // Default to 0 (not approved) if not provided
      req.user.userId, // The ID of the admin creating the event
      RSOID || null, // Optional: RSO ID
      UniversityID,
    ]);

    res.json({ message: "Event created successfully", eventId: result.insertId });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

export default adminRoutes;