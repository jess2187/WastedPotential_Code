var express = require("express");
var bodyParser = require("body-parser");
var app = express();

var session = require('express-session')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var mongoose = require('mongoose');
var path = require('path');
var bcrypt = require('bcrypt')
mongoose.connect('mongodb://localhost/user');
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
  firstName: {
  	type: String,
  	required: true
  },
  lastName: {
  	type: String,
  	required: true
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

function getEvents(id, callback){
	MongoClient.connect(url, function(e, db){
		var dbd = db.db("events")
		if (e) throw e;
  		dbd.collection(id).find().toArray(function(err, events){
  			if(err) throw err;
  			db.close();
  			callback(events)
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

function getAssignments(id, callback){
	MongoClient.connect(url, function(err, db){
		var dbd = db.db("assignments")
		if (err) throw err;
  		dbd.collection(id).find().toArray(function(err, a){
  			if(err) throw err;
  			db.close();
  			callback(a);
  		});
	})
}


function getPreferences(id, callback){
	MongoClient.connect(url, function(err, db){
		var dbd = db.db("preferences")
		if (err) throw err;
  		dbd.collection(id).find().toArray(function(err, p){
  			if(err) throw err;
  			db.close();
  			callback(p[p.length -1])
  		});
	})
}

function setPreferences(id, data){
	MongoClient.connect(url, function(err, db) {
		var dbd = db.db("preferences")
		if (err) throw err;
  		dbd.collection(id).insertOne(data, function(e, res){ if (e) throw e; });
  		db.close();
	});
}

function addUser(data, callback){
	if (data.email &&
	  data.password) {
	  var userData = {
	    email: data.email,
	    password: data.password,
	    firstName: data.firstName,
	    lastName: data.lastName
	  }
	  
	  User.create(userData, function (err, user) {
	    if (err) {console.log('error--')
	    	console.log(err)
	      	callback(-1)
	    } else {
	    	console.log(user._id)
	        callback(user._id)
	        setPreferences(user._id.toString(), {"startstudy": 15, "endstudy": 19, "updates": null, "minstudytime": 0.5, "maxstudytime": 3})
	    }
	  });


	}
}

app.use('/website', express.static('website'))


app.get('/assignments', function(req, res){console.log('assignments') //sort this by time
	if (req.session && req.session.id && req.session.userId) {
		getAssignments(req.session.userId.toString(), function(assignments){
			res.send(assignments)
		})
	} else {
		res.send('not today')
	}
})

app.get('/events', function(req, res){ //sort this by time
	if (req.session && req.session.id && req.session.userId) {
		getEvents(req.session.userId.toString(), function(assignments){
			res.send(assignments)
		})
	} else {
		res.send('not today')
	}
})

app.get('/preferences', function(req, res){
	if (req.session && req.session.id && req.session.userId) {
		getPreferences(req.session.userId.toString(), function(assignments){
			res.send(assignments)
		})
	} else {
		res.send('not today')
	}
})


app.post('/add_assignment', function(req,res){console.log("add_assignment")
	if (req.session && req.session.id && req.session.userId) {
		data = {"repeating": "",
			"due": new Date(req.body.date),
			"numhours": parseFloat(req.body.time),
			"notes": req.body.notes,
			"title": req.body.title,
			"numhourscompleted": 0.0,
			"worktime": []}
		addAssignment(req.session.userId, data)
	} else {
		res.send('not today')
	}
})

app.post('/set_preferences', function(req, res){console.log('set_preferences')
	if (req.session && req.session.id && req.session.userId) {
		setPreferences(req.session.userId, req.body)
	} else {
		res.send('not today')
	}
})

app.post('/add_event', function(req, res){console.log('add_event')
	if (req.session && req.session.id && req.session.userId) {
		data = {
			"date": req.body.date,
			"description": req.body.description,
			"title": req.body.title,
			"notifications": null,
			"startTime": req.body.startTime ,
			"endTime": req.body.endTime
		}

		data.repeating = ""
		if(data.repmonday){data.repeating += "M"}
		if(data.reptuesday){data.repeating += "T"}
		if(data.repwednesday){data.repeating += "W"}
		if(data.repthursday){data.repeating += "Th"}
		if(data.repfriday){data.repeating += 'F'}
		if(data.repsaturday){data.repeating += 'S'}
		if(data.repsunday){data.repeating += 'Su'}
		addEvent(req.session.userId, data)
	} else {
		res.send('not today')
	}
})

app.post('/sign_up', function(req, res){console.log('sign_up')
	addUser(req.body, function(userId){
		if(userId != -1){
			console.log('sign up worked')
			req.session.userId = userId
		}
	})
	
})

app.post('/sign_in', function(req, res){ console.log('sign_in')
	if (req.body.email && req.body.password) {
	  	UserSchema.statics.authenticate(req.body.email, req.body.password, function(err, user){
			if(!(err || !user)){
				console.log('sign in worked')
				req.session.userId = user._id
				res.redirect('/website/index.html')
			}else{
				res.redirect('/website/login.html')
			}
		})
	}else{
		res.redirect('/website/login.html')
	}
})


app.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/website/login.html');
      }
    });
  }
});


var server = app.listen(8000, function () {
    console.log("Listening on port %s...", server.address().port);
});

function populateDatabase(){
	var today = new Date()
	addUser({firstName: 'Arman', lastName: 'Aydemir', email: 'rr@rr.com', password:'woah', passwordConf:'woah'}, function(usr1_id){
		addAssignment(usr1_id.toString(), {completed:false, due: today, repeating:'', description:'test assignments', title:'test title',
			notifications: null, numhours:5, worktime:null}) //user is yell@yell.com with password yell
		addAssignment(usr1_id.toString(), {completed:false, due:  new Date(today.getFullYear(), today.getMonth(), today.getDate()+7), repeating:'', description:'test assignments 2', title:'test title 2',
				notifications: null, numhours:7, worktime:null})
		addEvent(usr1_id.toString(), {start: new Date(today.getFullYear(), today.getMonth(), today.getDate()+7), end: new Date(today.getFullYear(), today.getMonth(), today.getDate()+8), repeating:'', description:'test assignments 2', title:'test title 2',
				notifications: null})
	})
	
}

// populateDatabase()

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










