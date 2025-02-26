import express from "express";
import connection from "../db/connection.js";
import bodyParser from "body-parser"; // Import the MySQL connection
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { authenticate } from "./auth.js";

dotenv.config();

const recordRoutes = express.Router();

// Middleware for parsing JSON and URL-encoded data
recordRoutes.use(bodyParser.json());
recordRoutes.use(bodyParser.urlencoded({ extended: true }));

// Helper function to extract the domain from an email
const getDomainFromEmail = (email) => {
  const domain = email.split("@")[1]; // Extract the part after "@"
  if (!domain) throw new Error("Invalid email format");
  return domain;
};

recordRoutes.post("/create-rso", authenticate, async (req, res) => {
  const { name, members, adminId } = req.body; // `members` is an array of user IDs
  const userId = req.user.userId; // Authenticated user (admin)

  // **Step 1: Basic Validation**
  if (!name || !members || !adminId || members.length !== 4) {
    return res.status(400).json({ error: "Invalid input. Provide a name, 4 members, and an admin ID." });
  }

  // Ensure unique members (remove duplicates)
  const allMembers = [...new Set([...members, userId])];

  if (allMembers.length !== 5) {
    return res.status(400).json({ error: "All members must be unique. Ensure there are exactly 5 distinct members." });
  }

  try {
    await connection.promise().query("START TRANSACTION");

    // **Step 2: Check for Existing RSO Name**
    const [existingRso] = await connection.promise().query(
      "SELECT * FROM rsos WHERE Name = ?",
      [name]
    );
    if (existingRso.length > 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(400).json({ error: "An RSO with this name already exists." });
    }

    // **Step 3: Get Admin's University**
    const [adminUniversityResult] = await connection.promise().query(
      "SELECT UniversityID FROM users WHERE UserID = ?", [adminId]
    );

    if (adminUniversityResult.length === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(400).json({ error: "Admin does not exist." });
    }

    const universityId = adminUniversityResult[0].UniversityID;

    // **Step 4: Ensure All Members Are From the Same University**
    const [memberUniversities] = await connection.promise().query(
      "SELECT DISTINCT UniversityID FROM users WHERE UserID IN (?)", [allMembers]
    );

    if (memberUniversities.length !== 1 || memberUniversities[0].UniversityID !== universityId) {
      await connection.promise().query("ROLLBACK");
      return res.status(400).json({ error: "All members must belong to the same university as the admin." });
    }

    // **Step 5: Insert RSO**
    const insertRsoQuery = "INSERT INTO rsos (Name, UniversityID, AdminID, Approved, MemberCount) VALUES (?, ?, ?, FALSE, 0)";
    const [insertResult] = await connection.promise().query(insertRsoQuery, [name, universityId, adminId]);

    const rsoId = insertResult.insertId;

    // **Step 6: Insert Members (Prevent Duplicates)**
    const memberValues = allMembers.map(userId => [userId, rsoId]);

    const assignMembersQuery = "INSERT IGNORE INTO rso_membership (UserID, RSOID) VALUES " + 
      allMembers.map(() => "(?, ?)").join(", ");
    
    const flattenedValues = allMembers.flatMap(userId => [userId, rsoId]);

    console.log("Final Query: ", assignMembersQuery, flattenedValues);

    await connection.promise().query(assignMembersQuery, flattenedValues);

    // **Commit Transaction**
    await connection.promise().query("COMMIT");

    res.json({ message: "RSO creation request sent to super admin", rsoId });
  } catch (error) {
    console.error("Error creating RSO:", error);
    await connection.promise().query("ROLLBACK");

    if (error.code === "ER_SIGNAL_EXCEPTION") {
      return res.status(400).json({ error: error.sqlMessage || "Database validation failed." });
    }

    res.status(500).json({ error: "Failed to create RSO" });
  }
});

recordRoutes.route("/join-rso").post(authenticate, async (req, res) => {
  const { RSOName } = req.body; // Extract the RSO name from request
  const userId = req.user.userId; // Get the logged-in user's ID

  if (!RSOName) {
    return res.status(400).json({ error: "RSO Name is required" });
  }

  try {
    await connection.promise().query("START TRANSACTION");

    // **Step 1: Find the RSO ID by Name**
    const [rsoResults] = await connection.promise().query(
      "SELECT RSOID, UniversityID FROM rsos WHERE Name = ?",
      [RSOName]
    );

    if (rsoResults.length === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(404).json({ error: "RSO not found" });
    }

    const { RSOID, UniversityID } = rsoResults[0];

    // **Step 2: Ensure the user is in the same university**
    const [userResults] = await connection.promise().query(
      "SELECT UniversityID FROM users WHERE UserID = ?",
      [userId]
    );

    if (userResults.length === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    if (userResults[0].UniversityID !== UniversityID) {
      await connection.promise().query("ROLLBACK");
      return res.status(400).json({ error: "User must belong to the same university as the RSO." });
    }

    // **Step 3: Insert the user into `rso_membership`**
    const insertQuery =
      "INSERT IGNORE INTO rso_membership (UserID, RSOID) VALUES (?, ?)";

    const [insertResult] = await connection.promise().query(insertQuery, [userId, RSOID]);

    if (insertResult.affectedRows === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(400).json({ error: "User is already a member of this RSO." });
    }

    // **Step 4: Increment the MemberCount in `rsos`**
    await connection.promise().query(
      "UPDATE rsos SET MemberCount = MemberCount + 1 WHERE RSOID = ?",
      [RSOID]
    );

    await connection.promise().query("COMMIT");

    res.json({ message: `Successfully joined RSO: ${RSOName}`, RSOID });
  } catch (error) {
    console.error("Error joining RSO:", error);
    await connection.promise().query("ROLLBACK");
    res.status(500).json({ error: "Failed to join RSO" });
  }
});



// Route to get all users
recordRoutes.get("/fetch", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId; // Extract user ID from the token
    const [userResults] = await connection.promise().query(
      "SELECT UserID, FirstName, Email FROM users WHERE UserID = ?", 
      [userId]
    );

    if (userResults.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(userResults[0]); // ✅ Ensure `UserID` is included in the response
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


// Route for user registration (updated to automatically assign Role as "student")
recordRoutes.route("/add").post(async (req, response) => {
  const { FirstName, LastName, Username, Email, Password } = req.body;

  if (!FirstName || !LastName || !Username || !Email || !Password) {
    return response.status(400).json({ error: "All fields are required" });
  }

  try {
    // Extract the domain from the email
    const domain = getDomainFromEmail(Email);

    // Check if the domain exists in the universities table
    const checkDomainQuery = "SELECT UniversityID FROM universities WHERE domain = ?";
    const [domainResults] = await connection.promise().query(checkDomainQuery, [domain]);

    if (domainResults.length === 0) {
      return response.status(400).json({ error: "Invalid email domain. Your university is not registered." });
    }

    const universityID = domainResults[0].UniversityID;

    // Automatically assign the Role as "student"
    const Role = "student";

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Insert the user into the users table with the assigned UniversityID and Role
    const addUserQuery =
      "INSERT INTO users (FirstName, LastName, Username, Email, PasswordHash, Role, UniversityID) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const [addUserResult] = await connection.promise().query(addUserQuery, [
      FirstName,
      LastName,
      Username,
      Email,
      hashedPassword,
      Role,
      universityID,
    ]);

    response.json({ message: "User added successfully", userId: addUserResult.insertId });
  } catch (error) {
    console.error("Error adding user:", error);
    return response.status(500).json({ error: error.message || "Server error" });
  }
});

// Route for user login (updated to use Username and Password)
recordRoutes.route("/login").post(async (req, res) => {
  const { Username, Password } = req.body;

  if (!Username || !Password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const query = "SELECT * FROM users WHERE Username = ?";
  connection.execute(query, [Username], async (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(Password, user.PasswordHash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user.UserID, role: user.Role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token, role: user.Role });
  });
});

recordRoutes.route("/user-rsos/:userId").get(authenticate, async (req, res) => {
  const userId = req.params.userId;

  try {
    const [results] = await connection.promise().query(
      "SELECT r.RSOID, r.Name, r.UniversityID, r.Approved " +
      "FROM rso_membership rm " +
      "JOIN rsos r ON rm.RSOID = r.RSOID " +
      "WHERE rm.UserID = ?",
      [userId]
    );

    res.json(results); // Send all RSOs the user is part of
  } catch (error) {
    console.error("Error fetching user's RSOs:", error);
    res.status(500).json({ error: "Failed to fetch user's RSOs" });
  }
});

export default recordRoutes;