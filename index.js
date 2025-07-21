import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// connect to mongodb
mongoose.connect(process.env.MONGODB);

const port = process.env.PORT;
const saltRounds = parseInt(process.env.SALT);

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

//serve the public directory
app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.status(200).json({ message: "server is functional" });
});

//define the user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

//create the user model
const User = mongoose.model("User", userSchema);

//post route to create a new user
app.post("/signup", async (req, res) => {
  try {
    // check if username is already taken
    const uniqueUser = await User.findOne({ username: req.body.username });
    // if info is valid
    if (uniqueUser) {
      bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        let userDoc = {
          username: req.body.username,
          password: hash,
        };

        let user = new User(userDoc);

        user.save();

        res.redirect("/");
      });
    }
  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
});

//post route to login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    let userObj = await User.findOne({ username: req.body.username });

    bcrypt.compare(req.body.password, userObj.password, (err, result) => {
      if (err) {
        res.status(403).send("Access denied");
      } else {
        res.redirect(`/dashboard/${userObj.username}`);
      }
    });
  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
});

//get route to show the dashboard depending on the user
app.get("/dashboard/:username", async (req, res) => {
  const { username } = req.params;
  try {
    // display message welcoming user by username
    res.status(200).json({ message: `A warm welcome to you, ${username}` });
  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
