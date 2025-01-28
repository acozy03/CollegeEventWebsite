import express from "express";
import cors from "cors";
import connection from "./db/connection.js";  // Import the MySQL connection
import recordRoutes from "./routes/record.js";

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
app.use("/api", recordRoutes);

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
