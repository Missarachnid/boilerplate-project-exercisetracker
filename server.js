const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require("body-parser");
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');


app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

/***********************************************/
 /********** Serve HTML/CSS **********/
/*********************************************/

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

  /***********************************************/
 /********** Connect To MongoDB Atlas **********/
/*********************************************/

uri = process.env.MONGO_URI;

mongoose.connect(uri, {useNewUrlParser: true})
.catch((err) => console.log(err));

  /***********************************/
 /********** Schema Setup **********/
/*********************************/

const exerciseSchema = new Schema({
  username: {type:String, required: true},
  description: String,
  duration: Number,
  date: Date,
  id: String
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new Schema({
  username: {type: String, required: true},
  id: String
});

const User = mongoose.model("User", userSchema);


  /********************************************************/
 /********** Post - "/api/users" Create Users ***********/
/******************************************************/

app.post("/api/users", (req, res) => {
  let usernameInput = req.body.username;
  let newId = uuidv4();

  if(usernameInput === "" || usernameInput === undefined){
    res.send("Username is required");
  }

  User.findOne({username: usernameInput}, (err, data) => {
    if(err) return res.send("There was an issue searching for username. Please try again");
    if(data === null){
      let newUser = new User({username: usernameInput, id: newId});
      newUser.save((err, newUserData) => {
        if(err) return res.send("There was an issue registering new user. Please try again");
        res.json({username: newUserData.username, _id: newUserData.id})
      })
    } else {
      return res.json({username: data.username, _id: data.id})

    }
  })

});

  /*******************************************************/
 /********** Get - "/api/users"- Get all users **********/
/*******************************************************/
app.get("/api/users", (req, res) => {
  let userArr = [];
  User.find({}, (err, allUserData) => {
    if(err) return res.send("There was an error retrieving all users. Please try again.");
    for(let i in allUserData){
      userArr.push({username: allUserData[i].username, _id: allUserData[i].id})
    }
    return res.send(userArr);
  })
});

  /********************************************************************/
 /********** Post - "/api/users/:id/exercises" Create Users **********/
/********************************************************************/

app.post("/api/users/:_id/exercises", (req, res) => {
  let userIdInput = req.body[':_id'];
  let durationInput = req.body.duration;
  let descriptionInput = req.body.description;
  let dateInput = req.body.date;
  let dateFormat;
  console.log("Description input", descriptionInput);
  console.log("userId", userIdInput);

//create if date fits date format create date obj, otherwise time is now
  if(dateInput.match(/(\d{4})-(\d{2})-(\d{2})/)){
    dateFormat = new Date(dateInput);
  }else {
    dateFormat = new Date(Date.now());
  }

  //prevent empty inputs
  if(descriptionInput === "" || descriptionInput === undefined){
    return res.send("You must enter exercise details. Please try again.");
  }

  if(durationInput === "" || durationInput === undefined){
    return res.send("You must enter a duration time. Please try again.");
  }
  if(userIdInput === "" || userIdInput === undefined){
    return res.send("You must enter a user id number. Please try again.");
  }
  User.findOne({id: userIdInput}, (err, exerciseData) => {
    if(err) return res.send("There was an issue saving this exercise. Please try again.");
    console.log("exerciseData");
    if(!exerciseData){
      return res.send("Incorrect user id. Please try agaain.");
    }
    let workout = new Exercise({username: exerciseData.username, description: descriptionInput, duration: durationInput, date: dateFormat, id: userIdInput});
    workout.save().then((exerciseSaveData) => {
      return res.json({username: exerciseSaveData.username, description: exerciseSaveData.description, duration: exerciseSaveData.duration, date: exerciseSaveData.date.toDateString(), _id: exerciseSaveData.id});
    }).catch((err) => {
      console.log("Exercise save error", err);
      return res.send("Error saving new exercise. please try again.");
    });
  });

  console.log(typeof durationInput);
  console.log('date', dateFormat)
  console.log("test", userIdInput, durationInput, descriptionInput, dateFormat.toDateString());
  
})
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});




