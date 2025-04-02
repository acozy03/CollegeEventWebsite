import express from "express"
import { authenticate } from "./auth.js"
import connection from "../db/connection.js"
import bodyParser from "body-parser"

const eventRoutes = express.Router()

// Middleware for parsing JSON and URL-encoded data
eventRoutes.use(bodyParser.json())
eventRoutes.use(bodyParser.urlencoded({ extended: true }))

eventRoutes.post("/create", authenticate, async (req, res) => {
  const { name, category, description, date, time, locationId, contactPhone, contactEmail, visibility, rsoId } = req.body;
  const userId = req.user.userId; // Get the current user's ID

  try {
    await connection.promise().query("START TRANSACTION");

    // Set the current user ID for the trigger
    console.log(`Setting @current_user_id = ${userId}`);
    await connection.promise().query("SET @current_user_id = ?", [userId]);

    // **Step 1: Get the user's university ID**
    console.log(`Fetching university ID for UserID: ${userId}`);
    const [userResults] = await connection.promise().query("SELECT UniversityID FROM users WHERE UserID = ?", [userId]);

    if (userResults.length === 0) {
      await connection.promise().query("ROLLBACK");
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    const universityId = userResults[0].UniversityID;
    console.log(`User's UniversityID: ${universityId}`);

    // **Step 2: Insert the event**
    const insertQuery = `
      INSERT INTO events (
        Name, Category, Description, Date, Time, LocationID, ContactPhone, 
        ContactEmail, Visibility, RSOID, UniversityID, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log(`Executing SQL: ${insertQuery}`);
    console.log("With Values:", {
      name, category, description, date, time, locationId, 
      contactPhone, contactEmail, visibility, rsoId: rsoId || null, 
      universityId, createdBy: userId
    });

    const [result] = await connection.promise().query(insertQuery, [
      name,
      category,
      description,
      date,
      time,
      locationId,
      contactPhone,
      contactEmail,
      visibility,
      rsoId || null,
      universityId,
      userId,
    ]);

    await connection.promise().query("COMMIT");
    console.log(`Event created successfully! EventID: ${result.insertId}`);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      eventId: result.insertId,
    });

  } catch (error) {
    await connection.promise().query("ROLLBACK");
    console.error("Error creating event:", error);

    if (error.code === "ER_SIGNAL_EXCEPTION") {
      return res.status(400).json({ error: error.sqlMessage || "Database validation failed." });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create event",
    });
  }
});


// Get all events
eventRoutes.get("/", authenticate, async (req, res) => {
  try {
    const [events] = await connection.promise().query(
      `SELECT e.*, l.Name AS LocationName, l.Latitude, l.Longitude, u.Name AS UniversityName, r.Name AS RSOName
       FROM events e
       JOIN locations l ON e.LocationID = l.LocationID
       JOIN universities u ON e.UniversityID = u.UniversityID
       LEFT JOIN rsos r ON e.RSOID = r.RSOID
       WHERE e.Approved = 1
       ORDER BY e.Date ASC, e.Time ASC`,
    )

    res.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

export default eventRoutes

