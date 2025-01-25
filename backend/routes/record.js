import express from "express"
import { getDb } from "../db/connection.js"
import { ObjectId } from "mongodb"

const recordRoutes = express.Router()

recordRoutes.route("/users").get((req, res) => {
  const db_connect = getDb()
  db_connect
    .collection("users")
    .find({})
    .toArray((err, result) => {
      if (err) throw err
      res.json(result)
    })
})

recordRoutes.route("/users/add").post((req, response) => {
  const db_connect = getDb()
  const myobj = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  }
  db_connect.collection("users").insertOne(myobj, (err, res) => {
    if (err) throw err
    response.json(res)
  })
})

recordRoutes.route("/users/update/:id").post((req, response) => {
  const db_connect = getDb()
  const myquery = { _id: ObjectId(req.params.id) }
  const newvalues = {
    $set: {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    },
  }
  db_connect.collection("users").updateOne(myquery, newvalues, (err, res) => {
    if (err) throw err
    console.log("1 document updated")
    response.json(res)
  })
})

recordRoutes.route("/users/:id").delete((req, response) => {
  const db_connect = getDb()
  const myquery = { _id: ObjectId(req.params.id) }
  db_connect.collection("users").deleteOne(myquery, (err, obj) => {
    if (err) throw err
    console.log("1 document deleted")
    response.json(obj)
  })
})

export default recordRoutes

