import mysql from 'mysql2'

// Create a MySQL connection using environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
})

// Make the connection
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err)
    return
  }
  console.log('Connected to MySQL')
})

// Export the connection to be used elsewhere in your app
export default connection
