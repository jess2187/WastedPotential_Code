var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var mongoose = require('mongoose');

var path = require('path');
var bcrypt = require('bcrypt')
mongoose.connect('mongodb://localhost/user');
var url = "mongodb://localhost:27017/";

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  passwordConf: {
    type: String,
    required: true,
  }
});
UserSchema.pre('save', function (next) {
  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash){
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});
UserSchema.statics.authenticate = function (email, password, callback) {
	 		User.findOne({ email: email })
	    	.exec(function (err, user) {
		      if (err) {
		        return callback(err)
		      } else if (!user) {
		        var err = new Error('User not found.');
		        err.status = 401;
		        return callback(err);
		      }
		      bcrypt.compare(password, user.password, function (err, result) {
		        if (result === true) {
		          return callback(null, user);
		        } else {
		          return callback();
		        }
		      })
	    	});
		}
var User = mongoose.model('User', UserSchema);
module.exports = User;


function addEvent(id, data){
	MongoClient.connect(url, function(err, db) {
		var dbd = db.db("events")
		if (err) throw err;
  		dbd.collection(id).insertOne(data, function(e, res){ if (e) throw e; });
  		db.close();
	});
}

function getEvents(id){
	MongoClient.connect(url, function(e, db){
		var dbd = db.db("events")
		if (e) throw e;
  		dbd.collection(id).find().toArray(function(err, events){
  			if(err) throw err;
  			db.close();
  			return events;
  		});
	})
}

function addAssignment(id, data){
	MongoClient.connect(url, function(err, db) {
		var dbd = db.db("assignments")
		if (err) throw err;
  		dbd.collection(id).insertOne(data, function(e, res){ if (e) throw e; });
  		db.close();
	});
}

function getAssignments(id){
	MongoClient.connect(url, function(err, db){
		var dbd = db.db("assignments")
		if (err) throw err;
  		dbd.collection(id).find().toArray(function(err, a){
  			if(err) throw err;
  			db.close();
  			return a;
  		});
	})
}

function getPreferences(id){
	MongoClient.connect(url, function(err, db){
		var dbd = db.db("preferences")
		if (err) throw err;
  		dbd.collection(id).find().toArray(function(err, p){
  			if(err) throw err;
  			db.close();
  			return p;
  		});
	})
}

function addUser(data){
	if (data.email &&
	  data.password) {
	  var userData = {
	    email: data.email,
	    password: data.password,
	    passwordConf: data.passwordConf
	  }
	  User.create(userData, function (err, user) {
	    if (err) {
	      return -1
	    } else {
	      return user._id
	    }
	  });
	}
}

function populateDatabase(){
	user1 = addUser({firstName: 'Arman', lastName: 'Aydemir', email: 'arman.aydemir@colorado.edu', password:'woah', passwordConf:'woah'})
	addAssignment(user1, {completed:false, due: new Date(), repeating:'', description:'test assignments', title:'test title',
			notifications: null, numhours:5, worktime:null})
	addEvent(user1, {start:  new Date(today.getFullYear(), today.getMonth(), today.getDate()+7), end: new Date(today.getFullYear(), today.getMonth(), today.getDate()+8),
			description: 'test events', title: 'test title', repeating: '', notifications: null})
}

console.log(getAssignments("5bff573acbc3ef0f1aa253eb"))


/* DB schema
Every user has one or none preferences, events, and assignments collection. Each preferences, events, and assignments collection has one and only one user.

DB: user
Collection: users
	Docuement: id, email - email, password - hash

DB: preferences
Collection: user.id
	Document: startstudy, endstudy, updates, minstudytime, maxstudytime, 

DB: events
Collection: user.id
	Document: date - datestartTime - time, endTime - time, description - str, title - str , repeating, notifications

DB: assignments
Collection: user.id 
	Document: completed, due - date, repeating-str, description - str, title - str, notifications, numhours - how long they ahve to work on it,  numhourscompleted - amount of hours they ahve worked on it, worktime - one or more free time assigned to working on this 
*/

