import express from "express";
import connection from "../db/connection.js";
import { authenticate } from "./auth.js";

const superAdminRoutes = express.Router();

// Middleware to ensure only super admins can access this route
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "Super Admin") {
    return res.status(403).json({ error: "Access denied. Super Admins only." });
  }
  next();
};

// Route to create a new university
superAdminRoutes.route("/universities/add").post(authenticate, isSuperAdmin, async (req, res) => {
    const { Name, Location, Description, NumberOfStudents, Domain } = req.body;
  
    // Validate required fields
    if (!Name || !Location || !Description || !NumberOfStudents || !Domain) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }
  
    try {
      // Insert the university into the database
      const query = `
        INSERT INTO universities (Name, Location, Description, NumberOfStudents, Domain)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [result] = await connection.promise().query(query, [
        Name,
        Location,
        Description,
        NumberOfStudents,
        Domain,
      ]);
  
      res.json({ message: "University created successfully", universityId: result.insertId });
    } catch (error) {
      console.error("Error creating university:", error);
      res.status(500).json({ error: "Failed to create university" });
    }
  });

// Route to approve an event created by an admin
superAdminRoutes.route("/events/approve/:eventId").post(authenticate, isSuperAdmin, async (req, res) => {
  const { eventId } = req.params;

  // Validate event ID
  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required." });
  }

  try {
    // Update the event's approval status in the database
    const query = `
      UPDATE events
      SET Approved = 1
      WHERE EventID = ?
    `;
    const [result] = await connection.promise().query(query, [eventId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Event not found or already approved." });
    }

    res.json({ message: "Event approved successfully" });
  } catch (error) {
    console.error("Error approving event:", error);
    res.status(500).json({ error: "Failed to approve event" });
  }
});

export default superAdminRoutes;