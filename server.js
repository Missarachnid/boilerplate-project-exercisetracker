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

  /***********************************************/
 /********** Helper Functions ******************/
/*********************************************/






  /*******************************************************/
 /********** Post - "/api/users" Create Users **********/
/*****************************************************/

app.post("/api/users", (req,res, next)=> {
  let checkName = req.body.username;
  let newId = uuidv4();

  User.findOne({username: checkName}).select("-__v").exec((err, data) => {
    if (err){
      res.send("User search error, please try again");
    }
    //If a user object was returned
    if(data){
      res.send({username: data.username, _id: data.id});
    } else {
      //Create new user
      // - Might have to change the values around so name is first
      let addUser = new User({username: checkName, id: newId});
      addUser.save((err, newUserData) => {
        if(err) res.send("User creation error, please try again");
        res.send({username: newUserData.username, _id: newUserData.id })
      });
    }
  });
  
});

  /********************************************************/
 /********** Get - "/api/users" - Get user list **********/
/********************************************************/

app.get("/api/users", (req, res) => {
  User.find({}).select("-__v").exec((err, allUsersData) => {
    if(err) res.send("There was an error getting user data, try agin.");
    //This might not pass, check if it needs to say name then id
    let allUsers = [];
    for(let el in allUsersData){
     allUsers.push({username: allUsersData[el].username, _id: allUsersData[el].id});
    }
    res.send(allUsers);
  });
});

  /*******************************************************************************/
 /********** Post - "/api/users/:_id/exercises - Create new Exercises" **********/
/*******************************************************************************/

app.post("/api/users/:_id/exercises", (req, res) => {
  let userId = req.body[':_id'];
  let enteredDate = req.body.date;
  let current

  if(enteredDate.match(/(\d{4})-(\d{2})-(\d{2})/)){
    current = new Date(enteredDate);
    enteredDate = current;
  } else {
    
    current = new Date();
    enteredDate = current;
  }

  //For some reason using findById wouldn't work and returned a null no matter what
  //Had to use findOne and add the obj to get it to return user
  User.findOne({id: userId}).then(data => {
    let workout = new Exercise(
      {username: data.username, 
        description: req.body.description, 
        duration: req.body.duration, date: enteredDate, 
        id: userId});
        console.log('workout data', workout);
    workout.save().then(saveData => {
      let exerciseInfo = {username: saveData.username, description: saveData.description, duration: saveData.duration, date: saveData.date.toDateString(), _id: saveData.id};
      console.log("exercise saved", exerciseInfo);
      res.send(exerciseInfo);
    });
  }).catch(err => {
    console.log(err);
    res.send("This user ID doesn't exist. Please try again.");
  });
  
})
;

  /***************************************************************************/
 /********** Get - "/api/users/:_id/exercises" - Get all exercises **********/
/***************************************************************************/

app.get("/api/users/:_id/exercises", (req, res) => {
  let requestId = req.params._id;
  Exercise.find({id: requestId}).select("-__v").exec((err, exerciseData)=> {
    if(err) res.send("There was an issue finding users exercises, please try again");
    let allExercises = [];
    for(let i in exerciseData){
      allExercises.push({username: exerciseData[i].username, description: exerciseData[i].description, duration: exerciseData[i].duration, date: exerciseData[i].date, _id: exerciseData[i].id })
    }
    res.send(allExercises);
  });
});

  /***************************************************************************/
 /********** Get - "/api/users/:_id/log" - Get user log *********************/
/***************************************************************************/

app.get("/api/users/:_id/logs", (req, res) => {
  let logId = req.params._id;
  let toQuery = req.query.to;
  let fromQuery = req.query.from;
  //let limitQuery = Number(req.query.limit) || 0;
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

  Exercise.find(searchFilter).then((thisthing) => {
    console.log('thisthing', thisthing);
    for(let l in thisthing){
    arr.push({description: thisthing[l].description, duration: thisthing[l].duration, date: thisthing[l].date.toDateString()});
    //console.log("arr", arr);
    count = count += 1;
    }
    console.log('limitQuery', limitQuery);

    //should I add an error return for non numbers for limit query?
    if(typeof limitQuery === 'number' && limitQuery < count){
      arr.length = limitQuery;
      //count = limitQuery;
    }
    
    finalLog = {
      username: thisthing[0].username,
      count: count,
      _id: logId,
      logs: arr
    };
    res.send(finalLog);
  })
  
  
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});




