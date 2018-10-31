var express = require("express");
var bodyParser = require("body-parser");
var app = express();

var MongoClient = require('mongodb').MongoClient;
var session = require('express-session')
var ObjectId = require('mongodb').ObjectId;
var mongoose = require('mongoose');
var path = require('path');
var bcrypt = require('bcrypt')
mongoose.connect('mongodb://localhost/temp');
var url = "mongodb://localhost:27017/";

console.log('hey hi the server started')

app.use(session({
  secret: 'this is our very secret',
  resave: true,
  saveUninitialized: false
}));

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* DB schema
DB: user
Collection: users
	Docuement: id, email - email, password - hash

Db: prefences
Collection: id
	Document: studytime, updates,

DB: events
Collection: id
	Document: due - date, description - str, title - str, , repeating, notifications

DB: assignments
Collection: id 
	Document: completed - boolean, due - date, repeating, description - str, title - str, notifications, numhours - how long they ahve to work on it, worktime - free time assigned to working on this 
*/

function determineOptimalTimes(id){
	/*
	Take the time left before due date and subtract estimate of hours to complete. 
	Call that the assignments "score."
	Assignments with the smallest score are those that you don't have much time to complete, 
	but take a lot of work to do.
	We can sort a list of assignments based on that score. The assignments with the smallest score will be first.
	We can then break the amount of time that the assignment is going to take into chunks.
	Then we can go through a list of open work times and assign the chunks in any open spots before the due date.
	*/
	print('we gotta do this')
}

function addEvent(id, data){
	MongoClient.connect(url, function(err, db) {
		var dbd = db.db("events")
		if (err) throw err;
  		dbd.collection(id).insertOne(data, function(e, res){ if (e) throw e; });
  		db.close();
	});
}

addEvent('1', {'date': Date(), 'description': 'this is an event', 'title': 'this is my title', 'type': 0, 'notifications': null})

app.get('/sign_up', function(req, res){
	res.sendFile(path.join(__dirname + '/Signuppage.html'));
})

app.post('/sign_up', function(req, res){
	console.log(req.body)
	if (req.body.email &&
	  req.body.password) {
	  var userData = {
	    email: req.body.email,
	    password: req.body.password,
	    passwordConf: req.body.passwordConf
	  }
	  //use schema.create to insert data into the db
	  User.create(userData, function (err, user) {
	  	console.log(user)
	    if (err) {
	      console.log(err)
	      return
	    } else {
	      req.session.userId = user._id
	      return res.redirect('/profile');
	    }
	  });
	}
})

app.get('/calendar', function(req, res){
	if (req.session && req.session.id) {
		res.sendFile(path.join(__dirname + '/calendar.html'));
	} else {
		res.redirect('/sign_in')
	}
})

app.get('/sign_in', function(req, res){
	res.sendFile(path.join(__dirname + '/Signinpage.html'));
})

app.post('/sign_in', function(req, res){
	if (req.body.email && req.body.password) {
		console.log(req.body)
	  	UserSchema.statics.authenticate(req.body.email, req.body.password, function(err, user){
			console.log(err)
			console.log(user)
			req.session.userId = user._id
			res.redirect('/profile')
		})
	}
})



app.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});




var server = app.listen(8000, function () {
    console.log("Listening on port %s...", server.address().port);
});




//use this to authenticate on gets and puts
// UserSchema.statics.authenticate = function (email, password, callback) {
//   User.findOne({ email: email })
//     .exec(function (err, user) {
//       if (err) {
//         return callback(err)
//       } else if (!user) {
//         var err = new Error('User not found.');
//         err.status = 401;
//         return callback(err);
//       }
//       bcrypt.compare(password, user.password, function (err, result) {
//         if (result === true) {
//           return callback(null, user);
//         } else {
//           return callback();
//         }
//       })
//     });
// }








