import { NextResponse } from 'Next/server.js';
import connection from './lib.js';
import bcrypt from 'bcryptjs'; // For password hashing
import jwt from 'jsonwebtoken'; // For authentication

// Helper function to validate user input
const validateUserInput = (user) => {
  const { Name, Email, Password, Role, UniversityID } = user;
  if (!Name || !Email || !Password || !Role || !UniversityID) {
    throw new Error('All fields are required');
  }
  if (!Email.includes('@')) {
    throw new Error('Invalid email format');
  }
  if (Password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
};

// GET: Fetch all users
export async function GET() {
  try {
    // Query the MySQL database
    const [rows] = await connection.promise().query('SELECT * FROM Users');

    // Return the users as JSON
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Handle both login and registration
export async function POST(request) {
  try {
    const body = await request.json();

    // Check if it's a login request
    if (body.action === 'login') {
      const { Email, Password } = body;

      // Fetch user by email
      const [users] = await connection.promise().query(
        'SELECT UserID, Name, PasswordHash, Role FROM Users WHERE Email = ?',
        [Email]
      );

      if (users.length === 0) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const user = users[0];

      // Compare passwords
      const isMatch = await bcrypt.compare(Password, user.PasswordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.UserID, role: user.Role }, 'your_secret_key', { expiresIn: '1h' });

      return NextResponse.json({ message: 'Login successful', token });
    }

    // Otherwise, it's a registration request
    else if (body.action === 'register') {
      validateUserInput(body); // Ensure validation is enforced

      const { Name, Email, Password, Role, UniversityID } = body;

      // Hash the password
      const hashedPassword = await bcrypt.hash(Password, 10);

      // Insert a new user into the MySQL database
      const [result] = await connection.promise().query(
        'INSERT INTO Users (Name, Email, PasswordHash, Role, UniversityID) VALUES (?, ?, ?, ?, ?)',
        [Name, Email, hashedPassword, Role, UniversityID]
      );

      // Generate a JWT token for the new user
      const token = jwt.sign({ userId: result.insertId, role: Role }, 'your_secret_key', { expiresIn: '1h' });

      return NextResponse.json({ message: 'User added successfully', userId: result.insertId, token });
    }

    // If action is not recognized
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}