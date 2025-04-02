import express from "express"
import { authenticate } from "./auth.js"
import connection from "../db/connection.js"
import bodyParser from "body-parser" // Import the MySQL connection
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const recordRoutes = express.Router()

// Middleware for parsing JSON and URL-encoded data
recordRoutes.use(bodyParser.json())
recordRoutes.use(bodyParser.urlencoded({ extended: true }))

// Helper function to extract the domain from an email
const getDomainFromEmail = (email) => {
  const domain = email.split("@")[1] // Extract the part after "@"
  if (!domain) throw new Error("Invalid email format")
  return domain
}

recordRoutes.post("/create-rso", authenticate, async (req, res) => {
  const { name, members, adminUsername } = req.body // `members` is an array of usernames
  const userId = req.user.userId // Get the current user's ID

  // **Step 1: Basic Validation for Input**
  if (!name || !members || members.length !== 5 || !adminUsername) {
    return res.status(400).json({ error: "Invalid input. Provide a name, 4 members, and an admin username." })
  }

  // **Ensure unique usernames (admin + 4 members)**
  const allUsernames = [...new Set([...members, adminUsername])]
  if (allUsernames.length !== 5) {
    return res.status(400).json({ error: "All usernames must be unique. Ensure there are exactly 5 distinct members." })
  }

  try {
    await connection.promise().query("START TRANSACTION")

    // **Step 2: Check if RSO name already exists**
    const [existingRso] = await connection.promise().query("SELECT RSOID FROM rsos WHERE Name = ?", [name])
    if (existingRso.length > 0) {
      await connection.promise().query("ROLLBACK")
      return res.status(400).json({ error: "An RSO with this name already exists." })
    }

    // **Step 3: Resolve Usernames to UserIDs**
    const [userResults] = await connection
      .promise()
      .query("SELECT UserID, Username, UniversityID FROM users WHERE Username IN (?)", [allUsernames])

    if (userResults.length !== 5) {
      await connection.promise().query("ROLLBACK")
      return res.status(400).json({ error: "One or more usernames do not exist." })
    }

    // **Ensure all users belong to the same university**
    const universityIds = new Set(userResults.map((user) => user.UniversityID))
    if (universityIds.size !== 1) {
      await connection.promise().query("ROLLBACK")
      return res.status(400).json({ error: "All members must belong to the same university." })
    }
    const universityId = userResults[0].UniversityID // Since all are the same, pick the first

    // **Find the admin's UserID**
    const adminUser = userResults.find((user) => user.Username === adminUsername)
    if (!adminUser) {
      await connection.promise().query("ROLLBACK")
      return res.status(400).json({ error: "Admin username does not exist." })
    }
    const adminId = adminUser.UserID

    // Clear the temporary table
    await connection.promise().query("DELETE FROM temp_rso_members")

    // Insert member IDs into the temporary table (excluding admin who will be added by the trigger)
    const memberUsers = userResults.filter((user) => user.Username !== adminUsername)
    for (const user of memberUsers) {
      await connection.promise().query("INSERT INTO temp_rso_members (UserID) VALUES (?)", [user.UserID])
    }

    // Set the current user ID for the trigger
    await connection.promise().query("SET @current_user_id = ?", [userId])

    // **Step 4: Insert RSO**
    // Note: We don't need to set MemberCount here as it's handled by the trigger
    const insertRsoQuery = `INSERT INTO rsos (Name, UniversityID, PendingAdminID) VALUES (?, ?, ?)`
    const [insertResult] = await connection.promise().query(insertRsoQuery, [name, universityId, adminId])
    const rsoId = insertResult.insertId
    await connection.promise().query("UPDATE rsos SET MemberCount = MemberCount + 5 WHERE RSOID = ?", [rsoId])
    // **Commit Transaction**
    await connection.promise().query("COMMIT")

    res.json({ message: "RSO creation request sent to super admin", rsoId })
  } catch (error) {
    console.error("Error creating RSO:", error)
    await connection.promise().query("ROLLBACK")

    if (error.code === "ER_SIGNAL_EXCEPTION") {
      return res.status(400).json({ error: error.sqlMessage || "Database validation failed." })
    }

    res.status(500).json({ error: "Failed to create RSO" })
  }
})

recordRoutes.route("/leave-rso").post(authenticate, async (req, res) => {
  const { RSOName, newAdminUsername } = req.body
  const userId = req.user.userId

  console.log(`User ${userId} is attempting to leave RSO: ${RSOName}`)

  if (!RSOName) {
    console.log("Error: RSO Name is required")
    return res.status(400).json({ error: "RSO Name is required" })
  }

  try {
    await connection.promise().query("START TRANSACTION")
    console.log("Transaction started for leaving RSO")

    // **Step 1: Get RSO ID & Check Membership**
    console.log(`Fetching RSO details for: ${RSOName}`)
    const [rsoResults] = await connection
      .promise()
      .query("SELECT RSOID, AdminID, MemberCount, Approved FROM rsos WHERE Name = ?", [RSOName])

    if (rsoResults.length === 0) {
      console.log(`RSO not found: ${RSOName}`)
      await connection.promise().query("ROLLBACK")
      return res.status(404).json({ error: "RSO not found" })
    }

    const { RSOID, AdminID, MemberCount, Approved } = rsoResults[0]
    console.log(
      `RSO found: ID=${RSOID}, AdminID=${AdminID}, Current MemberCount=${MemberCount}, Approved=${Approved ? "Yes" : "No"}`,
    )

    // **Step 2: Ensure the user is a member**
    console.log(`Checking if user ${userId} is a member of RSO ${RSOID}`)
    const [membershipResults] = await connection
      .promise()
      .query("SELECT * FROM rso_membership WHERE UserID = ? AND RSOID = ?", [userId, RSOID])

    if (membershipResults.length === 0) {
      console.log(`User ${userId} is not a member of RSO ${RSOID}`)
      await connection.promise().query("ROLLBACK")
      return res.status(400).json({ error: "User is not a member of this RSO." })
    }
    console.log(`User ${userId} is confirmed as a member of RSO ${RSOID}`)

    // **Step 3: If user is the admin, transfer admin rights**
    if (userId === AdminID) {
      console.log(`User ${userId} is the admin of RSO ${RSOID} and needs to transfer admin rights`)

      if (!newAdminUsername) {
        console.log("Error: Admin must select a new admin before leaving")
        await connection.promise().query("ROLLBACK")
        return res.status(400).json({ error: "Admin must select a new admin before leaving." })
      }

      // **Find the new admin's UserID**
      console.log(`Looking up new admin username: ${newAdminUsername}`)
      const [newAdminResults] = await connection
        .promise()
        .query("SELECT UserID FROM users WHERE Username = ?", [newAdminUsername])

      if (newAdminResults.length === 0) {
        console.log(`New admin username not found: ${newAdminUsername}`)
        await connection.promise().query("ROLLBACK")
        return res.status(400).json({ error: "New admin username not found." })
      }

      const newAdminID = newAdminResults[0].UserID
      console.log(`New admin UserID: ${newAdminID}`)

      // **Ensure the new admin is a member of the RSO**
      console.log(`Checking if new admin ${newAdminID} is a member of RSO ${RSOID}`)
      const [isMember] = await connection
        .promise()
        .query("SELECT * FROM rso_membership WHERE UserID = ? AND RSOID = ?", [newAdminID, RSOID])

      if (isMember.length === 0) {
        console.log(`Error: Selected new admin ${newAdminID} is not a member of RSO ${RSOID}`)
        await connection.promise().query("ROLLBACK")
        return res.status(400).json({ error: "Selected new admin must be a member of this RSO." })
      }

      // ✅ **Transfer admin rights in `rsos` table**
      console.log(`Transferring admin rights from ${userId} to ${newAdminID}`)
      await connection.promise().query("UPDATE rsos SET AdminID = ? WHERE RSOID = ?", [newAdminID, RSOID])

      // ✅ **Update roles in `users` table**
      console.log(`Updating user roles: ${newAdminID} -> Admin, ${userId} -> Student`)
      await connection.promise().query("UPDATE users SET Role = 'Admin' WHERE UserID = ?", [newAdminID])
      await connection.promise().query("UPDATE users SET Role = 'Student' WHERE UserID = ?", [userId])
      console.log("Admin transfer completed successfully")
    }

    // **Step 4: Remove the user from `rso_membership`**
    console.log(`Removing user ${userId} from RSO ${RSOID}`)
    await connection.promise().query("DELETE FROM rso_membership WHERE UserID = ? AND RSOID = ?", [userId, RSOID])

    // Update member count
    const newMemberCount = MemberCount - 1
    console.log(`Updating member count: ${MemberCount} -> ${newMemberCount}`)
    await connection.promise().query("UPDATE rsos SET MemberCount = ? WHERE RSOID = ?", [newMemberCount, RSOID])

    // Check if RSO should be deactivated
    if (newMemberCount < 5 && Approved) {
      console.log(
        `RSO ${RSOID} member count is now below 5 (${newMemberCount}). Changing approval status from Approved to Pending.`,
      )
      await connection.promise().query("UPDATE rsos SET Approved = 0 WHERE RSOID = ?", [RSOID])
      console.log(`RSO ${RSOID} is now set to Pending status`)
    } else {
      console.log(
        `RSO ${RSOID} still has ${newMemberCount} members, minimum required is 5. Current status remains: ${Approved ? "Approved" : "Pending"}`,
      )
    }

    // **Step 5: If no members remain, delete the RSO**
    if (newMemberCount <= 0) {
      console.log(`RSO ${RSOID} has no members left. Deleting the RSO.`)
      await connection.promise().query("DELETE FROM rsos WHERE RSOID = ?", [RSOID])
    }

    await connection.promise().query("COMMIT")
    console.log(`Transaction committed. User ${userId} has successfully left RSO ${RSOID} (${RSOName})`)

    res.json({ message: `Successfully left RSO: ${RSOName}` })
  } catch (error) {
    console.error("Error leaving RSO:", error)
    await connection.promise().query("ROLLBACK")
    res.status(500).json({ error: "Failed to leave RSO" })
  }
})

// Modified endpoint to fetch user-specific events without relying on event_participants
recordRoutes.get("/events", authenticate, async (req, res) => {
  const userId = req.user.userId

  try {
    // First, check if the event_participants table exists
    const [tables] = await connection.promise().query("SHOW TABLES LIKE 'event_participants'")

    if (tables.length === 0) {
      // If the table doesn't exist, return all visible events for the user
      // Get the user's university ID
      const [userResults] = await connection
        .promise()
        .query("SELECT UniversityID FROM users WHERE UserID = ?", [userId])

      if (userResults.length === 0) {
        return res.status(404).json({ error: "User not found" })
      }

      const universityId = userResults[0].UniversityID

      // Get all RSOs the user is a member of
      const [userRSOs] = await connection.promise().query("SELECT RSOID FROM rso_membership WHERE UserID = ?", [userId])

      const rsoIds = userRSOs.map((rso) => rso.RSOID)
      const rsoCondition = rsoIds.length > 0 ? `OR (e.Visibility = 'RSO' AND e.RSOID IN (${rsoIds.join(",")}))` : ""

      // Get all events the user can see
      const [events] = await connection.promise().query(
        `SELECT e.EventID, e.Name, e.Category, e.Description, e.Date, e.Time, 
                l.Name AS LocationName, l.Latitude, l.Longitude,
                e.ContactPhone, e.ContactEmail, e.Visibility, e.Approved,
                r.Name AS RSOName, u.Name AS UniversityName
         FROM events e
         JOIN locations l ON e.LocationID = l.LocationID
         LEFT JOIN rsos r ON e.RSOID = r.RSOID
         LEFT JOIN universities u ON e.UniversityID = u.UniversityID
         WHERE e.Approved = 1 AND (
           e.Visibility = 'Public'
           OR (e.Visibility = 'Private' AND e.UniversityID = ?)
           ${rsoCondition}
         )
         ORDER BY e.Date ASC, e.Time ASC`,
        [universityId],
      )

      return res.json(events)
    } else {
      // If the table exists, use it to get events the user is registered for
      const [events] = await connection.promise().query(
        `SELECT e.EventID, e.Name, e.Category, e.Description, e.Date, e.Time, 
                l.Name AS LocationName, l.Latitude, l.Longitude,
                e.ContactPhone, e.ContactEmail, e.Visibility, e.Approved,
                r.Name AS RSOName, u.Name AS UniversityName
         FROM events e
         JOIN locations l ON e.LocationID = l.LocationID
         LEFT JOIN rsos r ON e.RSOID = r.RSOID
         LEFT JOIN universities u ON e.UniversityID = u.UniversityID
         JOIN event_participants ep ON e.EventID = ep.EventID
         WHERE ep.UserID = ? AND e.Approved = 1
         ORDER BY e.Date ASC, e.Time ASC`,
        [userId],
      )

      res.json(events)
    }
  } catch (error) {
    console.error("Error fetching user events:", error)
    res.status(500).json({ error: "Failed to fetch user events" })
  }
})

// New endpoint to get all available events the user can see
recordRoutes.get("/available-events", authenticate, async (req, res) => {
  const userId = req.user.userId

  try {
    // Get the user's university ID
    const [userResults] = await connection.promise().query("SELECT UniversityID FROM users WHERE UserID = ?", [userId])

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const universityId = userResults[0].UniversityID

    // Get all RSOs the user is a member of
    const [userRSOs] = await connection.promise().query("SELECT RSOID FROM rso_membership WHERE UserID = ?", [userId])

    const rsoIds = userRSOs.map((rso) => rso.RSOID)
    const rsoCondition = rsoIds.length > 0 ? `OR (e.Visibility = 'RSO' AND e.RSOID IN (${rsoIds.join(",")}))` : ""

    // Get all events the user can see
    const [events] = await connection.promise().query(
      `SELECT e.EventID, e.Name, e.Category, e.Description, e.Date, e.Time, 
              l.Name AS LocationName, l.Latitude, l.Longitude,
              e.ContactPhone, e.ContactEmail, e.Visibility, e.Approved,
              r.Name AS RSOName, u.Name AS UniversityName
       FROM events e
       JOIN locations l ON e.LocationID = l.LocationID
       LEFT JOIN rsos r ON e.RSOID = r.RSOID
       LEFT JOIN universities u ON e.UniversityID = u.UniversityID
       WHERE e.Approved = 1 AND (
         e.Visibility = 'Public'
         OR (e.Visibility = 'Private' AND e.UniversityID = ?)
         ${rsoCondition}
       )
       ORDER BY e.Date ASC, e.Time ASC`,
      [universityId],
    )

    res.json(events)
  } catch (error) {
    console.error("Error fetching available events:", error)
    res.status(500).json({ error: "Failed to fetch available events" })
  }
})

// Route to get all users
recordRoutes.get("/fetch", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId // Extract user ID from the token
    const [userResults] = await connection
      .promise()
      .query("SELECT UserID, FirstName, Email, Username, UniversityID FROM users WHERE UserID = ?", [userId])

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(userResults[0]) // ✅ Ensure `UserID` is included in the response
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

// Route for user registration (updated to automatically assign Role as "student")
recordRoutes.route("/add").post(async (req, response) => {
  const { FirstName, LastName, Username, Email, Password } = req.body

  if (!FirstName || !LastName || !Username || !Email || !Password) {
    return response.status(400).json({ error: "All fields are required" })
  }

  try {
    // Extract the domain from the email
    const domain = getDomainFromEmail(Email)

    // Check if the domain exists in the universities table
    const checkDomainQuery = "SELECT UniversityID FROM universities WHERE domain = ?"
    const [domainResults] = await connection.promise().query(checkDomainQuery, [domain])

    if (domainResults.length === 0) {
      return response.status(400).json({ error: "Invalid email domain. Your university is not registered." })
    }

    const universityID = domainResults[0].UniversityID

    // Automatically assign the Role as "student"
    const Role = "student"

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password, 10)

    // Insert the user into the users table with the assigned UniversityID and Role
    const addUserQuery =
      "INSERT INTO users (FirstName, LastName, Username, Email, PasswordHash, Role, UniversityID) VALUES (?, ?, ?, ?, ?, ?, ?)"
    const [addUserResult] = await connection
      .promise()
      .query(addUserQuery, [FirstName, LastName, Username, Email, hashedPassword, Role, universityID])

    response.json({ message: "User added successfully", userId: addUserResult.insertId })
  } catch (error) {
    console.error("Error adding user:", error)
    return response.status(500).json({ error: error.message || "Server error" })
  }
})

// Route for user login (updated to use Username and Password)
recordRoutes.route("/login").post(async (req, res) => {
  const { Username, Password } = req.body

  if (!Username || !Password) {
    return res.status(400).json({ error: "Username and password are required" })
  }

  const query = "SELECT * FROM users WHERE Username = ?"
  connection.execute(query, [Username], async (err, results) => {
    if (err) {
      console.error("Error fetching user:", err)
      return res.status(500).json({ error: "Server error" })
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const user = results[0]
    const isMatch = await bcrypt.compare(Password, user.PasswordHash)

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const token = jwt.sign({ userId: user.UserID, role: user.Role }, process.env.JWT_SECRET, { expiresIn: "1h" })
    res.json({ message: "Login successful", token, role: user.Role })
  })
})
recordRoutes.route("/join-rso").post(authenticate, async (req, res) => {
  const { RSOName } = req.body // Extract the RSO name from request
  const userId = req.user.userId // Get the logged-in user's ID

  console.log(`User ${userId} is attempting to join RSO: ${RSOName}`)

  if (!RSOName) {
    console.log("Error: RSO Name is required")
    return res.status(400).json({ error: "RSO Name is required" })
  }

  try {
    await connection.promise().query("START TRANSACTION")
    console.log("Transaction started for joining RSO")

    // **Step 1: Find the RSO ID by Name**
    console.log(`Searching for RSO: ${RSOName}`)
    const [rsoResults] = await connection
      .promise()
      .query("SELECT RSOID, UniversityID, MemberCount, Approved FROM rsos WHERE Name = ?", [RSOName])

    if (rsoResults.length === 0) {
      await connection.promise().query("ROLLBACK")
      console.log(`RSO not found: ${RSOName}`)
      return res.status(404).json({ error: "RSO not found" })
    }

    const { RSOID, UniversityID, MemberCount, Approved } = rsoResults[0]
    console.log(
      `RSO Found: ID=${RSOID}, UniversityID=${UniversityID}, Current Members=${MemberCount}, Status=${Approved ? "Approved" : "Pending"}`,
    )

    // **Step 2: Ensure the user is in the same university**
    console.log(`Checking user's university for UserID: ${userId}`)
    const [userResults] = await connection
      .promise()
      .query("SELECT UniversityID, Username FROM users WHERE UserID = ?", [userId])

    if (userResults.length === 0) {
      await connection.promise().query("ROLLBACK")
      console.log(`User not found: ${userId}`)
      return res.status(404).json({ error: "User not found" })
    }

    const userUniversityID = userResults[0].UniversityID
    const username = userResults[0].Username
    console.log(`User ${userId} (${username}) belongs to UniversityID: ${userUniversityID}`)

    if (userUniversityID !== UniversityID) {
      await connection.promise().query("ROLLBACK")
      console.log(
        `User ${userId} is not in the same university as RSO ${RSOID}. User: ${userUniversityID}, RSO: ${UniversityID}`,
      )
      return res.status(400).json({ error: "User must belong to the same university as the RSO." })
    }
    console.log(`University match confirmed for user ${userId} and RSO ${RSOID}`)

    // **Step 3: Insert the user into `rso_membership`**
    console.log(`Attempting to insert UserID=${userId} into RSOID=${RSOID}`)
    const insertQuery = "INSERT IGNORE INTO rso_membership (UserID, RSOID) VALUES (?, ?)"
    console.log(`Executing SQL: ${insertQuery.replace("?", userId).replace("?", RSOID)}`)
    const [insertResult] = await connection.promise().query(insertQuery, [userId, RSOID])

    if (insertResult.affectedRows === 0) {
      await connection.promise().query("ROLLBACK")
      console.log(`User ${userId} is already a member of RSO ${RSOID}`)
      return res.status(400).json({ error: "User is already a member of this RSO." })
    }

    console.log(`User ${userId} successfully joined RSO ${RSOID}`)

    // **Step 4: Increment the MemberCount in `rsos`**
    const newMemberCount = MemberCount + 1
    console.log(`Updating member count: ${MemberCount} -> ${newMemberCount}`)
    await connection.promise().query("UPDATE rsos SET MemberCount = ? WHERE RSOID = ?", [newMemberCount, RSOID])

    // **Step 5: Check if MemberCount is 5 or above, and update Approved flag if necessary**
    if (newMemberCount >= 5 && !Approved) {
      console.log(
        `RSO ${RSOID} now has ${newMemberCount} members (minimum 5 required). Changing status from Pending to Approved!`,
      )
      await connection.promise().query("UPDATE rsos SET Approved = 1 WHERE RSOID = ?", [RSOID])
      console.log(`RSO ${RSOID} is now ACTIVATED and Approved!`)
    } else {
      console.log(
        `RSO ${RSOID} now has ${newMemberCount} members. Status remains: ${Approved ? "Approved" : "Pending"}`,
      )
      if (!Approved && newMemberCount < 5) {
        console.log(`Note: RSO needs ${5 - newMemberCount} more members to become approved`)
      }
    }

    await connection.promise().query("COMMIT")
    console.log(`Transaction committed successfully for User ${userId} joining RSO ${RSOID}`)

    res.json({ message: `Successfully joined RSO: ${RSOName}`, RSOID })
  } catch (error) {
    console.error("Error joining RSO:", error)
    await connection.promise().query("ROLLBACK")
    res.status(500).json({ error: "Failed to join RSO" })
  }
})
recordRoutes.route("/user-rsos/:userId").get(authenticate, async (req, res) => {
  const userId = req.params.userId

  try {
    const [results] = await connection
      .promise()
      .query(
        "SELECT r.RSOID, r.Name, r.UniversityID, r.Approved " +
          "FROM rso_membership rm " +
          "JOIN rsos r ON rm.RSOID = r.RSOID " +
          "WHERE rm.UserID = ?",
        [userId],
      )

    res.json(results) // Send all RSOs the user is part of
  } catch (error) {
    console.error("Error fetching user's RSOs:", error)
    res.status(500).json({ error: "Failed to fetch user's RSOs" })
  }
})

// Add an endpoint to register for an event
recordRoutes.post("/register-event", authenticate, async (req, res) => {
  const userId = req.user.userId
  const { eventId } = req.body

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required" })
  }

  try {
    // Check if the event_participants table exists
    const [tables] = await connection.promise().query("SHOW TABLES LIKE 'event_participants'")

    if (tables.length === 0) {
      // Create the event_participants table if it doesn't exist
      await connection.promise().query(`
        CREATE TABLE event_participants (
          ParticipantID int NOT NULL AUTO_INCREMENT,
          UserID int NOT NULL,
          EventID int NOT NULL,
          RegisteredAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (ParticipantID),
          UNIQUE KEY user_event_unique (UserID, EventID),
          KEY UserID (UserID),
          KEY EventID (EventID),
          CONSTRAINT event_participants_ibfk_1 FOREIGN KEY (UserID) REFERENCES users (UserID) ON DELETE CASCADE,
          CONSTRAINT event_participants_ibfk_2 FOREIGN KEY (EventID) REFERENCES events (EventID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `)
    }

    // Check if the event exists and is approved
    const [eventResults] = await connection
      .promise()
      .query("SELECT EventID, Visibility, UniversityID, RSOID FROM events WHERE EventID = ? AND Approved = 1", [
        eventId,
      ])

    if (eventResults.length === 0) {
      return res.status(404).json({ error: "Event not found or not approved" })
    }

    const event = eventResults[0]

    // Check if the user has permission to register for this event
    if (event.Visibility !== "Public") {
      // For private events, check if user belongs to the university
      if (event.Visibility === "Private") {
        const [userResults] = await connection
          .promise()
          .query("SELECT UniversityID FROM users WHERE UserID = ?", [userId])

        if (userResults[0].UniversityID !== event.UniversityID) {
          return res.status(403).json({ error: "You don't have permission to register for this event" })
        }
      }

      // For RSO events, check if user is a member of the RSO
      if (event.Visibility === "RSO" && event.RSOID) {
        const [memberResults] = await connection
          .promise()
          .query("SELECT * FROM rso_membership WHERE UserID = ? AND RSOID = ?", [userId, event.RSOID])

        if (memberResults.length === 0) {
          return res.status(403).json({ error: "You must be a member of the RSO to register for this event" })
        }
      }
    }

    // Check if user is already registered
    const [registrationResults] = await connection
      .promise()
      .query("SELECT * FROM event_participants WHERE UserID = ? AND EventID = ?", [userId, eventId])

    if (registrationResults.length > 0) {
      return res.status(400).json({ error: "You are already registered for this event" })
    }

    // Register the user for the event
    await connection
      .promise()
      .query("INSERT INTO event_participants (UserID, EventID) VALUES (?, ?)", [userId, eventId])

    res.json({ message: "Successfully registered for the event" })
  } catch (error) {
    console.error("Error registering for event:", error)
    res.status(500).json({ error: "Failed to register for event" })
  }
})

// Add an endpoint to unregister from an event
recordRoutes.post("/unregister-event", authenticate, async (req, res) => {
  const userId = req.user.userId
  const { eventId } = req.body

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required" })
  }

  try {
    // Check if the event_participants table exists
    const [tables] = await connection.promise().query("SHOW TABLES LIKE 'event_participants'")

    if (tables.length === 0) {
      return res.status(400).json({ error: "You are not registered for any events" })
    }

    // Check if user is registered
    const [registrationResults] = await connection
      .promise()
      .query("SELECT * FROM event_participants WHERE UserID = ? AND EventID = ?", [userId, eventId])

    if (registrationResults.length === 0) {
      return res.status(400).json({ error: "You are not registered for this event" })
    }

    // Unregister the user from the event
    await connection
      .promise()
      .query("DELETE FROM event_participants WHERE UserID = ? AND EventID = ?", [userId, eventId])

    res.json({ message: "Successfully unregistered from the event" })
  } catch (error) {
    console.error("Error unregistering from event:", error)
    res.status(500).json({ error: "Failed to unregister from event" })
  }
})

// NEW ENDPOINTS FOR COMMENTS AND RATINGS

// Check if event_comments table exists and create it if it doesn't
const ensureEventCommentsTable = async () => {
  try {
    const [tables] = await connection.promise().query("SHOW TABLES LIKE 'event_comments'")

    if (tables.length === 0) {
      await connection.promise().query(`
        CREATE TABLE event_comments (
          CommentID int NOT NULL AUTO_INCREMENT,
          EventID int NOT NULL,
          UserID int NOT NULL,
          Comment text,
          Rating int,
          CreatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UpdatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (CommentID),
          KEY EventID (EventID),
          KEY UserID (UserID),
          CONSTRAINT event_comments_ibfk_1 FOREIGN KEY (EventID) REFERENCES events (EventID) ON DELETE CASCADE,
          CONSTRAINT event_comments_ibfk_2 FOREIGN KEY (UserID) REFERENCES users (UserID) ON DELETE CASCADE,
          CONSTRAINT rating_range CHECK ((Rating between 1 and 5))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `)
      return true
    }
    return false
  } catch (error) {
    console.error("Error ensuring event_comments table:", error)
    throw error
  }
}

// Get comments for an event
recordRoutes.get("/event-comments/:eventId", authenticate, async (req, res) => {
  const eventId = req.params.eventId

  try {
    await ensureEventCommentsTable()

    const [comments] = await connection.promise().query(
      `SELECT ec.CommentID, ec.EventID, ec.UserID, ec.Comment, ec.Rating, 
              ec.CreatedAt, ec.UpdatedAt, u.Username, u.FirstName
       FROM event_comments ec
       JOIN users u ON ec.UserID = u.UserID
       WHERE ec.EventID = ?
       ORDER BY ec.CreatedAt DESC`,
      [eventId],
    )

    res.json(comments)
  } catch (error) {
    console.error("Error fetching event comments:", error)
    res.status(500).json({ error: "Failed to fetch event comments" })
  }
})

recordRoutes.get("/university/:universityId", authenticate, async (req, res) => {
  const universityId = req.params.universityId

  try {
    const [universityResults] = await connection
      .promise()
      .query("SELECT UniversityID, Name, Domain FROM universities WHERE UniversityID = ?", [universityId])

    if (universityResults.length === 0) {
      return res.status(404).json({ error: "University not found" })
    }

    res.json(universityResults[0])
  } catch (error) {
    console.error("Error fetching university information:", error)
    res.status(500).json({ error: "Failed to fetch university information" })
  }
})

// Add a comment to an event
recordRoutes.post("/event-comments", authenticate, async (req, res) => {
  const userId = req.user.userId
  const { eventId, comment, rating } = req.body

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required" })
  }

  if (!comment && !rating) {
    return res.status(400).json({ error: "Either comment or rating is required" })
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" })
  }

  try {
    await ensureEventCommentsTable()

    // Check if the user is registered for the event
    const [registrationResults] = await connection
      .promise()
      .query("SELECT * FROM event_participants WHERE UserID = ? AND EventID = ?", [userId, eventId])

    if (registrationResults.length === 0) {
      return res.status(403).json({ error: "You must be registered for the event to comment or rate" })
    }

    // Check if the user already has a comment for this event
    const [existingComment] = await connection
      .promise()
      .query("SELECT CommentID FROM event_comments WHERE UserID = ? AND EventID = ?", [userId, eventId])

    if (existingComment.length > 0) {
      // Update existing comment
      await connection
        .promise()
        .query("UPDATE event_comments SET Comment = ?, Rating = ? WHERE CommentID = ?", [
          comment,
          rating,
          existingComment[0].CommentID,
        ])

      res.json({ message: "Comment updated successfully", commentId: existingComment[0].CommentID })
    } else {
      // Add new comment
      const [result] = await connection
        .promise()
        .query("INSERT INTO event_comments (EventID, UserID, Comment, Rating) VALUES (?, ?, ?, ?)", [
          eventId,
          userId,
          comment,
          rating,
        ])

      res.json({ message: "Comment added successfully", commentId: result.insertId })
    }
  } catch (error) {
    console.error("Error adding/updating comment:", error)
    res.status(500).json({ error: "Failed to add/update comment" })
  }
})

// Update a comment
recordRoutes.put("/event-comments/:commentId", authenticate, async (req, res) => {
  const userId = req.user.userId
  const commentId = req.params.commentId
  const { comment, rating } = req.body

  if (!comment && !rating) {
    return res.status(400).json({ error: "Either comment or rating is required" })
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" })
  }

  try {
    // Check if the comment exists and belongs to the user
    const [commentResults] = await connection
      .promise()
      .query("SELECT * FROM event_comments WHERE CommentID = ? AND UserID = ?", [commentId, userId])

    if (commentResults.length === 0) {
      return res.status(404).json({ error: "Comment not found or you don't have permission to edit it" })
    }

    // Update the comment
    await connection
      .promise()
      .query("UPDATE event_comments SET Comment = ?, Rating = ? WHERE CommentID = ?", [comment, rating, commentId])

    res.json({ message: "Comment updated successfully" })
  } catch (error) {
    console.error("Error updating comment:", error)
    res.status(500).json({ error: "Failed to update comment" })
  }
})

// Delete a comment
recordRoutes.delete("/event-comments/:commentId", authenticate, async (req, res) => {
  const userId = req.user.userId
  const commentId = req.params.commentId

  try {
    // Check if the comment exists and belongs to the user
    const [commentResults] = await connection
      .promise()
      .query("SELECT * FROM event_comments WHERE CommentID = ? AND UserID = ?", [commentId, userId])

    if (commentResults.length === 0) {
      return res.status(404).json({ error: "Comment not found or you don't have permission to delete it" })
    }

    // Delete the comment
    await connection.promise().query("DELETE FROM event_comments WHERE CommentID = ?", [commentId])

    res.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({ error: "Failed to delete comment" })
  }
})

// Get average rating for an event
recordRoutes.get("/event-rating/:eventId", async (req, res) => {
  const eventId = req.params.eventId

  try {
    await ensureEventCommentsTable()

    const [ratingResults] = await connection.promise().query(
      `SELECT AVG(Rating) as AverageRating, COUNT(Rating) as RatingCount
       FROM event_comments
       WHERE EventID = ? AND Rating IS NOT NULL`,
      [eventId],
    )

    const averageRating = Number.parseFloat(ratingResults[0].AverageRating) || 0
    const ratingCount = Number.parseInt(ratingResults[0].RatingCount) || 0

    res.json({ averageRating, ratingCount })
  } catch (error) {
    console.error("Error fetching event rating:", error)
    res.status(500).json({ error: "Failed to fetch event rating" })
  }
})

export default recordRoutes

