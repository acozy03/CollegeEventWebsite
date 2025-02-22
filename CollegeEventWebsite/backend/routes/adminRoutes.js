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
    LocationName, // New field for the location name
    Latitude,     // New field for latitude
    Longitude,    // New field for longitude
    ContactPhone,
    ContactEmail,
    Visibility,
    Approved,
    RSOID,
    UniversityID,
  } = req.body;

  // Validate required fields
  if (!Name || !Category || !Time || !Date || !LocationName || !Latitude || !Longitude || !UniversityID) {
    return res.status(400).json({ error: "All required fields must be provided." });
  }

  try {
    // Step 1: Check if the location already exists
    const checkLocationQuery = `
      SELECT locationid FROM locations 
      WHERE name = ? AND latitude = ? AND longitude = ?
    `;
    const [existingLocations] = await connection.promise().query(checkLocationQuery, [LocationName, Latitude, Longitude]);

    let locationId;

    if (existingLocations.length > 0) {
      // Location already exists, use its ID
      locationId = existingLocations[0].locationid;
    } else {
      // Step 2: Insert the new location
      const insertLocationQuery = `
        INSERT INTO locations (name, latitude, longitude) 
        VALUES (?, ?, ?)
      `;
      const [insertResult] = await connection.promise().query(insertLocationQuery, [LocationName, Latitude, Longitude]);
      locationId = insertResult.insertId; // Get the auto-generated LocationID
    }

    // Step 3: Insert the event with the resolved LocationID
    const insertEventQuery = `
      INSERT INTO events (Name, Category, Description, Time, Date, LocationID, ContactPhone, ContactEmail, Visibility, Approved, AdminID, RSOID, UniversityID) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [eventResult] = await connection.promise().query(insertEventQuery, [
      Name,
      Category,
      Description,
      Time,
      Date,
      locationId, // Use the resolved LocationID
      ContactPhone,
      ContactEmail,
      Visibility || "Public", // Default to "Public" if not provided
      Approved || 1,          // Default to 1 (approved) if not provided
      req.user.userId,        // The ID of the admin creating the event
      RSOID || null,          // Optional: RSO ID
      UniversityID,
    ]);

    res.json({ message: "Event created successfully", eventId: eventResult.insertId });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

export default adminRoutes;