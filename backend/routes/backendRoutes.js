import express from "express";
import connection from "../db/connection.js"; // Import the MySQL connection

const recordRoutes = express.Router();

// Route to get all users
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

// Route to add a new user
recordRoutes.route("/users/add").post((req, response) => {
  const { name, email, role } = req.body;
  const query = "INSERT INTO users (name, email, role) VALUES (?, ?, ?)";
  connection.execute(query, [name, email, role], (err, res) => {
    if (err) {
      console.error("Error adding user:", err);
      return response.status(500).send("Error adding user");
    }
    response.json(res); // Send the result of the insert operation
  });
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
