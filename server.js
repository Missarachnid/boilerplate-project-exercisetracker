const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require("body-parser");
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const res = require('express/lib/response');


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
    return res.send("Username is required");
  }

  User.findOne({username: usernameInput}, (err, data) => {
    if(err) return res.send("There was an issue searching for username. Please try again");
    if(data === null){
      let newUser = new User({username: usernameInput, id: newId});
      newUser.save((err, newUserData) => {
        if(err) return res.send("There was an issue registering new user. Please try again");
        return res.json({username: newUserData.username, _id: newUserData.id})
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

  /****************************************************************************/
 /********** Post - "/api/users/:id/exercises" Create user exercises**********/
/****************************************************************************/

app.post("/api/users/:_id/exercises", (req, res) => {
  let userIdInput = req.params._id;
  let durationInput = req.body.duration;
  let descriptionInput = req.body.description;
  let dateInput = req.body.date;
  console.log("allInputs", {userId: userIdInput, date: dateInput, description: descriptionInput, duration: durationInput});
  let dateFormat;

//create if date fits date format create date obj, otherwise time is now
if(userIdInput === "" || userIdInput === undefined){
  return res.send("You must enter a user id number. Please try again.");
}

  //prevent empty inputs
  if(descriptionInput === "" || descriptionInput === undefined){
    return res.send("You must enter exercise details. Please try again.");
  }

  

  /*if(dateInput.match(/(\d{4})-(\d{2})-(\d{2})/)){
    dateFormat = new Date(dateInput);
  }else {
    dateFormat = new Date(Date.now());
  }
  console.log("dateFormat", dateFormat);
*/
  
  User.findOne({id: userIdInput}, (err, exerciseData) => {
    if(err) return res.send("There was an issue saving this exercise. Please try again.");
    if(!exerciseData){
      return res.send("Incorrect user id. Please try agaain.");
    }
    let workout = new Exercise({username: exerciseData.username, description: descriptionInput, duration: durationInput, date: dateFormat, id: userIdInput});
    if(dateInput && dateInput !== "") {
      workout.date = new Date(dateInput);
    } else {
      workout.date = new Date();
    }
    workout.save().then((exerciseSaveData) => {
      return res.json({username: exerciseSaveData.username, description: exerciseSaveData.description, duration: exerciseSaveData.duration, date: exerciseSaveData.date.toDateString(), _id: exerciseSaveData.id});
    }).catch((err) => {
      console.log("Exercise save error", err);
      return res.send("Error saving new exercise. please try again.");
    });
  });
});

  /**************************************************************************/
 /********** Get - "/api/users/:id/exercises" Get users exercises **********/
/**************************************************************************/

app.get("/api/users/:_id/exercises", (req, res) => {
  let requestId = req.params['_id'];
  
  Exercise.find({id: requestId}).exec((err, exerciseData)=> {
    if(err) res.send("There was an issue finding users exercises, please try again");
    if(exerciseData.length === 0){
      return res.send("This user has no exercises");
    }
    let allExercises = [];
    for(let i in exerciseData){
      allExercises.push({username: exerciseData[i].username, description: exerciseData[i].description, duration: exerciseData[i].duration, date: exerciseData[i].date.toDateString(), _id: exerciseData[i].id })
    }
    res.send(allExercises);
  });
});

  /****************************************************************************/
 /********** Get - "/api/users/:id/logs" Create user log *********************/
/****************************************************************************/

app.get("/api/users/:_id/logs", (req, res) => {
  let logId = req.params._id;
  let toQuery = req.query.to;
  let fromQuery = req.query.from;
  let limitQuery = Number(req.query.limit);
  let count = 0;
  let arr = [];
  let finalLog;
  let searchFilter = {};
  let tempTo = new Date(toQuery);
  let tempFrom = new Date(fromQuery);


  if(fromQuery === undefined){
    searchFilter = {id: logId};
  } else if(fromQuery.match(/(\d{4})-(\d{2})-(\d{2})/) && toQuery.match(/(\d{4})-(\d{2})-(\d{2})/)){
    searchFilter = {id: logId, date: {$gt: tempFrom, $lt: tempTo}};
  } else {
    return res.send("There is an issue with your query format");
  }
  
  Exercise.find({...searchFilter}).exec((err, thisthing) => {
    if(err) return res.send("There was an error finding exercises for this user");

    if(thisthing.length === 0){
      return res.send("This user has no exercises");
    }
    
    for(let l in thisthing){
    arr.push({description: thisthing[l].description, duration: thisthing[l].duration, date: thisthing[l].date.toDateString()});
    count = count += 1;
    }

    if(typeof limitQuery === 'number' && limitQuery < count){
      arr.length = limitQuery;
    }
    finalLog = {
      username: thisthing[0].username,
      count: count,
      _id: logId,
      log: arr
    };
    res.send(finalLog);
  })
  
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});




