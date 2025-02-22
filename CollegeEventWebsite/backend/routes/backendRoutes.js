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

// Route to get all users
recordRoutes.route("/users").get(authenticate, (req, res) => {
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
// Route to update a user
recordRoutes.route("/update/:id").post((req, response) => {
  const { FirstName, LastName, Username, Email, Role } = req.body;

  if (!FirstName || !LastName || !Username || !Email || !Role) {
    return response.status(400).json({ error: "All fields are required" });
  }

  const query = "UPDATE users SET FirstName = ?, LastName = ?, Username = ?, Email = ?, Role = ? WHERE UserID = ?";
  connection.execute(query, [FirstName, LastName, Username, Email, Role, req.params.id], (err, res) => {
    if (err) {
      console.error("Error updating user:", err);
      return response.status(500).send("Error updating user");
    }
    console.log("1 document updated");
    response.json(res); // Send the result of the update operation
  });
});

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