import { NextResponse } from 'next/server'
import connection from './lib.js'

export async function GET() {
  try {
    // Query the MySQL database
    const [rows] = await connection.promise().query('SELECT * FROM users')

    // Return the users as JSON
    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}


export async function POST(request) {
  try {
    const body = await request.json()

    // Insert a new user into the MySQL database
    const { name, email, role } = body
    const [result] = await connection.promise().query(
      'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
      [name, email, role]
    )

    // Return the result of the insert operation
    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 })
  }
}
