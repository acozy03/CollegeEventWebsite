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
}); 
// Route to fetch pending events
superAdminRoutes.route("/events/pending").get(authenticate, isSuperAdmin, async (req, res) => {
    console.log("Fetching pending events...");
    try {
      const query = `
        SELECT * FROM events
        WHERE Approved = 0
      `;
      const [results] = await connection.promise().query(query);
  
      console.log("Pending events:", results);
      res.json(results);
    } catch (error) {
      console.error("Error fetching pending events:", error);
      res.status(500).json({ error: "Failed to fetch pending events" });
    }
  });
 

export default superAdminRoutes;