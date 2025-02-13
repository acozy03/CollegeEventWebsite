import express from "express";
import connection from "../db/connection.js";
import bodyParser from 'body-parser';  // Import the MySQL connection
import bcrypt from "bcryptjs"; 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { authenticate  } from "./auth.js";

const recordRoutes = express.Router();
recordRoutes.use(bodyParser.json());
recordRoutes.use(bodyParser.urlencoded( { extended: true}));
// Route to get all users

recordRoutes.route("/users").get(authenticate, (req, res) => {
  const query = "SELECT UserID, Name, Email, Role, UniversityID FROM users";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching usersfd:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
});

recordRoutes.route("/users").get((req, res) => {
  const query = "SELECT * FROM users"; // MySQL query to get all users
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).send("Server error");
    }
    res.json(results); // Send the results as JSON
  });
});

recordRoutes.route("/users/login").post(async (req, response) => {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    return response.status(400).json({ error: "Email and password are required" });
  }

  const query = "SELECT * FROM users WHERE Email = ?";
  connection.execute(query, [Email], async (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return response.status(500).json({ error: "Server error" });
    }

    if (results.length === 0) {
      return response.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(Password, user.PasswordHash);
    if (!isMatch) {
      return response.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.UserID, role: user.Role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    response.json({ message: "Login successful", token });
  });
});

recordRoutes.route("/users/add").post(async (req, response) => {
  const { Name, Email, Password, Role, UniversityID } = req.body;

  if (!Name || !Email || !Password || !Role || !UniversityID) {
    return response.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(Password, 10);

    const query = "INSERT INTO users (Name, Email, PasswordHash, Role, UniversityID) VALUES (?, ?, ?, ?, ?)";
    connection.execute(query, [Name, Email, hashedPassword, Role, UniversityID], (err, res) => {
      if (err) {
        console.error("Error adding user:", err);
        return response.status(500).json({ error: "Error adding user" });
      }
      response.json({ message: "User added successfully", userId: res.insertId });
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    return response.status(500).json({ error: "Server error" });
  }
});

// Route to update a user
recordRoutes.route("/users/update/:id").post((req, response) => {
  const { name, email, role } = req.body;
  const query = "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?";
  connection.execute(query, [name, email, role, req.params.id], (err, res) => {
    if (err) {
      console.error("Error updating user:", err);
      return response.status(500).send("Error updating user");
    }
    console.log("1 document updated");
    response.json(res); // Send the result of the update operation
  });
});

// Route to delete a user
recordRoutes.route("/users/:id").delete((req, response) => {
  console.log("Received ID to delete:", req.params.id); // Debugging
  const query = "DELETE FROM users WHERE id = ?";
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