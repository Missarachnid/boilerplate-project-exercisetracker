const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require("body-parser");
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//connect to mongodb
uri = process.env.MONGO_URI;

mongoose.connect(uri, {useNewUrlParser: true})
.catch((err) => console.log(err));

//schema setup
const exerciseSchema = new Schema({
  username: {type:String, required: true},
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now }
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new Schema({
  username: {type: String, required: true}
});

const User = mongoose.model("User", userSchema);

const logSchema = new Schema({
  username: {type: String, required: true},
  count: Number,
  log: [{description: String, duration: Number, date:{ type: Date, default: Date.now } }]
});

const Log = mongoose.model("Log", logSchema);

//Check for user, create new users
app.post("/api/users", (req,res, next)=> {
  let checkName = req.body.username;
  console.log(checkName);
  User.findOne({username: checkName}, (err, data) => {
    if (err){
      res.send("User search error, please try again");
      console.log("Error username search", err);
    }
    //If a user object was returned
    if(data){
      console.log("User search data", data);
      res.send({username: data.username, _id: data._id});
    } else {
      //Create new user
      let addUser = new User({username: checkName});
      console.log("addUser", addUser);
      addUser.save((err, newUserData) => {
        if(err) res.send("User creation error, please try again");
        res.send({username: newUserData.username, _id: newUserData._id })
      });
    }
  });
  
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
