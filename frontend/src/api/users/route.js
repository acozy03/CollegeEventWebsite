import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const collection = await db.collection('users')
    const users = await collection.find({}).toArray()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const collection = await db.collection('users')
    const result = await collection.insertOne(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 })
  }
}