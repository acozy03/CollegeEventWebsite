// Import necessary modules
import express from "express";
import connection from "../db/connection.js";
import { authenticate } from "./auth.js";

const adminRoutes = express.Router();
const getDomainFromEmail = (email) => email.split("@")[1];
// Middleware to ensure only admins can access this route
const isAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// ✅ Route to fetch all RSOs an admin is involved in
adminRoutes.get("/admin-rsos", authenticate, async (req, res) => {
  const userId = req.user.userId;
 console.log(userId)
  try {
    const [results] = await connection.promise().query(
      `SELECT r.RSOID, r.Name, (r.AdminID = ?) AS isAdmin
       FROM rso_membership rm
       JOIN rsos r ON rm.RSOID = r.RSOID
       WHERE rm.UserID = ?`,
      [userId, userId]
    );

    res.json(results);
  } catch (error) {
    console.error("Error fetching admin RSOs:", error);
    res.status(500).json({ error: "Failed to fetch admin RSOs" });
  }
});

adminRoutes.post("/events/add", authenticate, async (req, res) => {
  const {
    Name,
    Category,
    Description,
    Time,
    Date,
    LocationName,
    Latitude,
    Longitude,
    ContactPhone,
    ContactEmail,
    Visibility,
    RSOID, // This is only needed if Visibility = 'rso'
  } = req.body;

  if (!Name || !Category || !Time || !Date || !LocationName || !Latitude || !Longitude) {
    return res.status(400).json({ error: "All required fields must be provided." });
  }

  try {
    await connection.promise().query("START TRANSACTION");

    // **Step 1: Get Admin's Email and Determine UniversityID**
    const [adminResult] = await connection.promise().query(
      "SELECT Email FROM users WHERE UserID = ?",
      [req.user.userId],
    );

    if (adminResult.length === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(404).json({ error: "Admin not found." });
    }

    const adminEmail = adminResult[0].Email;
    const domain = getDomainFromEmail(adminEmail);

    const [domainResults] = await connection.promise().query(
      "SELECT UniversityID FROM universities WHERE domain = ?",
      [domain]
    );

    if (domainResults.length === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(400).json({ error: "University not found for this email domain." });
    }

    const UniversityID = domainResults[0].UniversityID;

    let selectedRSOID = null; // Default to no RSO

    // **Step 2: If Visibility is 'rso', Ensure Admin Selects an RSO**
    if (Visibility === "rso") {

      const [adminRSOs] = await connection.promise().query(
        "SELECT RSOID FROM rsos WHERE AdminID = ?",
       [req.user.userId],
       console.log(req.userId)
      );
    
      if (adminRSOs.length === 0) {
        await connection.promise().query("ROLLBACK");
        return res.status(403).json({ error: "You are not an admin of any RSO." });
      }

      if (adminRSOs.length > 1 && !RSOID) {
        await connection.promise().query("ROLLBACK");
        return res.status(400).json({
          error: "You are an admin of multiple RSOs. Please select an RSO ID.",
          adminRSOs: adminRSOs.map(rso => rso.RSOID),
        });
      }

      selectedRSOID = adminRSOs.length === 1 ? adminRSOs[0].RSOID : RSOID;
    }

    // **Step 3: Insert the new location**
    const insertLocationQuery = `
      INSERT INTO locations (Name, Latitude, Longitude) 
      VALUES (?, ?, ?)
    `;
    const [insertLocation] = await connection.promise().query(insertLocationQuery, [LocationName, Latitude, Longitude]);
    const locationId = insertLocation.insertId;

    // **Step 4: Determine Approval Status Based on Visibility**
    let Approved = 1;
    if (Visibility === "public") {
      Approved = 0; // Requires super admin approval
    }

    // **Step 5: Insert the event**
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
      locationId,
      ContactPhone,
      ContactEmail,
      Visibility,
      Approved,
      req.user.userId,
      selectedRSOID, // If not an RSO event, this remains NULL
      UniversityID,
    ]);

    await connection.promise().query("COMMIT");

    res.json({ message: "Event created successfully", eventId: eventResult.insertId });
  } catch (error) {
    console.error("Error creating event:", error);
    await connection.promise().query("ROLLBACK");
    res.status(500).json({ error: "Failed to create event" });
  }
});

export default adminRoutes;
