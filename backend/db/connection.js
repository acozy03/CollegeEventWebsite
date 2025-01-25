import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, "..", ".env") })

const Db = process.env.ATLAS_URI
const client = new MongoClient(Db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

let _db

export function connectToServer(callback) {
  client.connect((err, db) => {
    // Verify we got a good "db" object
    if (db) {
      _db = db.db("employees")
      console.log("Successfully connected to MongoDB.")
    }
    return callback(err)
  })
}

export function getDb() {
  return _db
}

