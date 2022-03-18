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

//serve HTML file
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
  date: String
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new Schema({
  username: {type: String, required: true}
});

const User = mongoose.model("User", userSchema);

const logSchema = new Schema({
  username: {type: String, required: true},
  count: Number,
  log: [{description: String, duration: Number, date: String }],

});

const Log = mongoose.model("Log", logSchema);

//Check for user, create new users
app.post("/api/users", (req,res, next)=> {
  let checkName = req.body.username;
  //console.log(checkName);
  User.findOne({username: checkName}).select("-__v").exec((err, data) => {
    if (err){
      res.send("User search error, please try again");
      //console.log("Error username search", err);
    }
    //If a user object was returned
    if(data){
      //console.log("User search data", data);
      res.send({username: data.username, _id: data._id});
    } else {
      //Create new user
      // - Might have to change the values around so name is first
      let addUser = new User({username: checkName});
      //console.log("addUser", addUser);
      addUser.save((err, newUserData) => {
        if(err) res.send("User creation error, please try again");
        res.send({username: newUserData.username, _id: newUserData._id })
      });
    }
  });
  
});

//Get an array of all users
app.get("/api/users", (req, res) => {
  User.find({}).select("-__v").exec((err, allUsersData) => {
    if(err) res.send("There was an error getting user data, try agin.");
    //This might not pass, check if it needs to say name then id
    res.send(allUsersData);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  let userId = req.body[':_id'];
  let enteredDate = req.body.date;
  let current

  if(enteredDate.match(/(\d{4})-(\d{2})-(\d{2})/)){
    current = new Date(enteredDate);
    enteredDate = current.toDateString();
  } else {
    
    current = new Date();
    enteredDate = current.toDateString();
    //console.log("fixed date no", enteredDate);
  }

  //console.log("all exercise", req.body);
  //For some reason using findById wouldn't work and returned a null no matter what
  //Had to use findOne and add the obj to get it to return user
  User.findOne({ObjectId: userId}).then(data => {
    //console.log("dataFinish", data);
    let workout = new Exercise({username: data.username, description: req.body.description, duration: req.body.duration, date: enteredDate});
    workout.save().then(saveData => {
      let exerciseInfo = {username: saveData.username, description: saveData.description, duration: saveData.duration, date: saveData.date, _id: saveData['_id']}
      res.send(saveData);
    });
  }).catch(err => {
    console.log(err);
    res.send("This user ID doesn't exist. Please try again.");
  });
  
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
