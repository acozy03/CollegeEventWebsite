import express from "express";
import cors from "cors";
import connection from "./db/connection.js";  // Import the MySQL connection
import recordRoutes from "./routes/backendRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dotenv from 'dotenv';
import axios from 'axios'; 
import superAdminRoutes from "./routes/superAdminRoutes.js";

// Load environment variables from .env file
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(
  cors({
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use("/api/users", recordRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);

app.get('/api/map-style', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.maptiler.com/maps/streets/style.json?key=${process.env.MAPTILER_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error fetching map style ');
  }
});

// Global error handling
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Perform a database connection when the server starts
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit();
  }

  // start the Express server
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });
});
