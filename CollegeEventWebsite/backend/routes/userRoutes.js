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
  const { RSOID } = req.body; // Extract RSO ID from request
  const userId = req.user.userId; // Extract logged-in user ID from token

  if (!RSOID) {
    return res.status(400).json({ error: "RSOID is required" });
  }

  try {
    await connection.promise().query("START TRANSACTION");

    // **Step 1: Check if RSO exists**
    const [rsoResults] = await connection.promise().query(
      "SELECT UniversityID FROM rsos WHERE RSOID = ?", 
      [RSOID]
    );

    if (rsoResults.length === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(404).json({ error: "RSO not found" });
    }

    const rsoUniversityId = rsoResults[0].UniversityID;

    // **Step 2: Ensure the user is in the same university**
    const [userResults] = await connection.promise().query(
      "SELECT UniversityID FROM users WHERE UserID = ?", 
      [userId]
    );

    if (userResults.length === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const userUniversityId = userResults[0].UniversityID;

    if (userUniversityId !== rsoUniversityId) {
      await connection.promise().query("ROLLBACK");
      return res.status(400).json({ error: "User must belong to the same university as the RSO." });
    }

    // **Step 3: Insert the user into `rso_membership` (Ignore if already a member)**
    const insertQuery = 
      "INSERT IGNORE INTO rso_membership (UserID, RSOID) VALUES (?, ?)";
    
    const [insertResult] = await connection.promise().query(insertQuery, [userId, RSOID]);

    if (insertResult.affectedRows === 0) {
      await connection.promise().query("ROLLBACK");
      return res.status(400).json({ error: "User is already a member of this RSO." });
    }

    // **Step 4: Increment the MemberCount in `rsos` table**
    await connection.promise().query(
      "UPDATE rsos SET MemberCount = MemberCount + 1 WHERE RSOID = ?", 
      [RSOID]
    );

    await connection.promise().query("COMMIT");

    res.json({ message: "Successfully joined RSO", RSOID });
  } catch (error) {
    console.error("Error joining RSO:", error);
    await connection.promise().query("ROLLBACK");
    res.status(500).json({ error: "Failed to join RSO" });
  }
});


// Route to get all users
recordRoutes.route("/fetch").get(authenticate, (req, res) => {
  const query = "SELECT UserID, FirstName, LastName, Username, Email, Role, UniversityID FROM users";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
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

// TODO 
// // Route to update a user
// recordRoutes.route("/update/:id").post((req, response) => {
//   const { FirstName, LastName, Username, Email, Role } = req.body;

//   if (!FirstName || !LastName || !Username || !Email || !Role) {
//     return response.status(400).json({ error: "All fields are required" });
//   }

//   const query = "UPDATE users SET FirstName = ?, LastName = ?, Username = ?, Email = ?, Role = ? WHERE UserID = ?";
//   connection.execute(query, [FirstName, LastName, Username, Email, Role, req.params.id], (err, res) => {
//     if (err) {
//       console.error("Error updating user:", err);
//       return response.status(500).send("Error updating user");
//     }
//     console.log("1 document updated");
//     response.json(res); // Send the result of the update operation
//   });
// });

// Route to delete a user
recordRoutes.route("/:id").delete((req, response) => {
  console.log("Received ID to delete:", req.params.id); // Debugging
  const query = "DELETE FROM users WHERE UserID = ?";
  connection.execute(query, [req.params.id], (err, res) => {
    if (err) {
      console.error("Error deleting user:", err);
      return response.status(500).send("Error deleting user");
    }
    console.log("1 document deleted");
    response.json(res); // Send the result of the delete operation
  });
});

export default recordRoutes;