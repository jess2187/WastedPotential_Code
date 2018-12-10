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


const determineOptimalTimes = function(id, callback){
	/*
	Take the time left before due date and subtract estimate of hours to complete. 
	Call that the assignments "score."
	Assignments with the smallest score are those that you don't have much time to complete, 
	but take a lot of work to do.
	We can sort a list of assignments based on that score. The assignments with the smallest score will be first.
	We can then break the amount of time that the assignment is going to take into chunks.
	Then we can go through a list of open work times and assign the chunks in any open spots before the due date.
	*/
	getAssignments(id, function(assignments){
		for (var i = 0; i < assignments.length; i++) {
			var date = new Date();
			var current_day = date.getDate();
			var due_date = assignments[i].due.getDate();
			var time_left = due_date - current_day;
			var priority = (time_left * 24) - (assignments[i].numhours);
			assignments.priority = priority

			assignments.sort(function(a,b){
				return b.priority - a.priority;
			});
		}
		getPreferences(id, function(preferences){
			var start_hour = preferences.startstudy;
			var end_hour = preferences.endstudy;

			var today = new Date();
			var current_date = new Date()
			start_work = start_hour;
			current_date =  new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate(), parseInt(start_work.split(':')[0])-7, parseInt(start_work.split(':')[1]))
			console.log(current_date)
			for (var i = 0; i < assignments.length; i++){ console.log(i)
				var numDays = assignments[i].due.getDate() - today.getDate();
				var hours_to_complete = numDays * (end_hour - start_hour);
				if (hours_to_complete < assignments[i]["numhours"]){
					console.log('not enough hours to complete assignmetn')
					return "Not enough hours to complete assignment.";
				}
				study_left = end_hour - start_hour;
				//current_date.setHours(start_work);
				if (assignments[i].numhours < study_left){console.log('lolwohalol')
					var start_date = current_date.setHours(start_work);
					var end_date = current_date.setHours(start_work + assignments[i].numhours);
					console.log(start_date)
					console.log(end_date)
					var worktime = {'start_time': start_date, 'end_time': end_date};
					assignments[i].worktime[0] = worktime;
					start_work = start_work + assignments[i].numhours;
				} else {
					hours_to_assign = assignments[i].numhours;
					index = 0;
					while (hours_to_assign > 0){
						if (index > 0){
							start_work = start_hour;
						}
						
						hours_left = (parseInt(end_hour.split(':')[0])-7 + parseInt(end_hour.split(':')[1])/60) - (current_date.getHours() + current_date.getMinutes()/60);
					
						
						var start_date = new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate(), current_date.getHours(), current_date.getMinutes())
						var end_time;
						console.log('hours')
						console.log(parseInt(end_hour.split(':')[0])-7 + parseInt(end_hour.split(':')[1])/60)
						console.log(current_date.getHours() + current_date.getMinutes()/60)
						console.log(hours_to_assign)
						console.log(hours_left)
						if (hours_to_assign > hours_left){ console.log('hihihi')
							end_time = new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate(),  parseInt(end_hour.split(':')[0])-7, end_hour.split(':')[1])
							hours_to_assign = hours_to_assign - hours_left;
							current_date = new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate()+1,  parseInt(start_work.split(':')[0])-7, start_work.split(':')[1])
						} else {
							end_time = new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate(),  current_date.getHours()+hours_to_assign , current_date.getMinutes())
							hours_to_assign = 0;
							current_date = end_time
						}

						console.log('----------')
						console.log(assignments[i])
						
						console.log(current_date)
						var worktime = {'start_time': start_date, 'end_time': end_time};
						console.log(worktime)
						assignments[i].worktime[index] = worktime;
						index++;
						console.log(end_time)
						
						console.log(current_date)
					}
				}
			}
			console.log(assignments)
			callback(assignments)
		});
	});

	//A bunch of junkyard code that I originally wrote but ended up changing my approach.
	//I was using it as a reference so I haven't deleted it yet.
	/*
	Assignment:
	[0] title
	[1] due date
	[2] num hours needed
	[3] priority
	[4] work date
	[5] work time
	*/
	/*
	for (var i = 0; i < assignments.length; i++) {
		var single_assign = [];
		single_assign.push(assignments[i].title);
		single_assign.push(assignments[i].due);
		single_assign.push(assignments[i].numhours);
		single_assign.push(0);
		single_assign.push(0);
		assign_arr.push(single_assign);
	}

	var assign_arr = [];
	var date = new Date();
	var current_day = date.getDate();
	for (var i = 0; i < assign_arr.length; i++) {
		due_date = assign_arr[i][1].getDate();
		var time_left = due_date - current_day;
		var priority = (time_left * 24) - (assign_arr[i][2]);
		assign_arr[i][3] = priority;
	}

	var assign_sorted = assign_arr.sort(sort_by_priority);



	var current_date = new Date();
	for (var i = 0; i < assign_sorted.length; i++){
		while (assign_sorted[i][2] > 0){
			study_left = end_hour - start_hour;
			var start_work = start_hour;
			if (assign_sorted[i][2] < study_left){
				current_date.setHours(start_work);
				assign_sorted[i][4] = current_date;
				start_work = start_work + assign_sorted[i][2];
				assign_sorted[i][2] = 0;
			} else {
				

				current_date.setDate(current_date.getDate()+1)
				start_work = start_hour;
				if (assign_sorted[i][2] < study_left){
					current_date.setHours(start_hour);
					assign_sorted[i][4] = current_date;
					start_hour = start_hour + assign_sorted[i][2];
				}
			}
		}
	}

					additional_hours = assignments[i].numhours - hours_left;
					end_date = start_date.setDate(start_date.getDate() + 1);
					end_date.setHours(start_hour + additional_hours)
					assignments.worktime[1] = end_date;
					start_work = end_date.getHours();*/

}

const addEvent = function(id, data){
	MongoClient.connect(url, function(err, db) {
		var dbd = db.db("events")
		if (err) throw err;
  		dbd.collection(id).insertOne(data, function(e, res){ if (e) throw e; });
  		db.close();
	});
}

const getEvents = function(id, callback){
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

const setAssignment = function(id, data){
	MongoClient.connect(url, function(err, db) {
		var dbd = db.db("assignments")
		if (err) throw err;
		var s = new ObjectId(data._id)
		var q = {'_id': s}
		var nv = {$set:data}
		dbd.collection(id).updateOne(q, nv, function(err, result){
			if(err) throw err
			db.close()
		});
	})
}

const addAssignment = function(id, data){
	MongoClient.connect(url, function(err, db) {
		var dbd = db.db("assignments")
		if (err) throw err;
  		dbd.collection(id).insertOne(data, function(e, res){ if (e) throw e; });
  		db.close();
	});
}

const getAssignments = function(id, callback){
	// determineOptimalTimes(id, function(assignments){
	// 	console.log('woah assign')
	// 	console.log(assignments)
		// for(var i = assignments.length-1; i >= 0; i--){
		// 	setAssignment(id, assignments[i])
		// }
		MongoClient.connect(url, function(err, db){
			var dbd = db.db("assignments")
			if (err) throw err;
	  		dbd.collection(id).find().toArray(function(err, a){
	  			if(err) throw err;
	  			db.close();
	  			callback(a);
	  		});
		})
	//})
	
}

const getPreferences = function(id, callback){
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

const setPreferences = function(id, data){
	MongoClient.connect(url, function(err, db) {
		var dbd = db.db("preferences")
		if (err) throw err;
  		dbd.collection(id).insertOne(data, function(e, res){ if (e) throw e; });
  		db.close();
	});
}

const addUser = function(data, callback){console.log(data)
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


	}else{
		callback(-1)
	}
}

app.use('/website', express.static('website'))


// app.get('/calendar', function(req, res){console.log('calendar')
// 	if(req.session && req.session.id && req.session.userId) {
// 		getAssignments(req.session.userId.toString(), function(assignments){
// 			assignments.map(function(x) {
// 				var y = x
// 				y.start = x.due
// 				return y
// 			})
// 			console.log(assignments)
// 			getEvents(req.session.userId.toString(), function(events){
// 				assignments.map(function(x) {
// 					var y = x
// 					y.start = x.startTime
// 					y.end = x.endTime
// 					return y
// 				})
// 				console.log(events)
// 				res.send(assignments.concat(events))
// 			})
// 		})
// 	} else {
// 		res.send('not today')
// 	}
// })

app.get('/assignments', function(req, res){console.log('assignments') 
	if (req.session && req.session.id && req.session.userId) {
		//determineOptimalTimes(req.session.userId.toString())
		getAssignments(req.session.userId.toString(), function(assignments){
			res.send(assignments)
		})
	} else {
		res.send('not today')
	}
})

app.get('/sorted_assignments', function(req, res){console.log('/sorted_assignments')
	if (req.session && req.session.id && req.session.userId) {
		getAssignments(req.session.userId.toString(), function(assignments){
			assignments.sort(function(a,b){
			  return b.due - a.due;
			});
			res.send(assignments)
		})
	} else {
		res.send('not today')
	}
})

app.get('/events', function(req, res){ console.log('events')
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
			"description": req.body.notes,
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
			"date": req.body.eventdate,
			"description": req.body.eventdescription,
			"title": req.body.eventname,
			"notifications": null,
			"startTime": req.body.starttime ,
			"endTime": req.body.endtime
		}

		data.repeating = ""
		if(req.body.repmonday){data.repeating += "M"}
		if(req.body.reptuesday){data.repeating += "T"}
		if(req.body.repwednesday){data.repeating += "W"}
		if(req.body.repthursday){data.repeating += "Th"}
		if(req.body.repfriday){data.repeating += 'F'}
		if(req.body.repsaturday){data.repeating += 'S'}
		if(req.body.repsunday){data.repeating += 'Su'}
		console.log(data)
		addEvent(req.session.userId, data)
	} else {
		res.send('not today')
	}
})

app.post('/sign_up', function(req, res){console.log('sign_up')
	if(req.body.email && req.body.password && req.body.password == req.body.passwordConf){
		console.log('inside')
		addUser(req.body, function(userId){
			if(userId != -1){
				console.log('sign up worked')
				// req.session.userId = userId
				// res.redirect('/website/index.html')
			}else{
				// res.redirect('/website/register.html')
			}
		})
	}
	// res.redirect('/website/register.html')
})

app.post('/sign_in', function(req, res){ console.log('sign_in')
	if (req.body.email && req.body.password) {
	  	UserSchema.statics.authenticate(req.body.email, req.body.password, function(err, user){
			if(!(err || !user)){
				console.log('sign in worked')
				req.session.userId = user._id
				determineOptimalTimes(user._id.toString(), function(a){
					for(var i=0; i < a.length; i ++){
						setAssignment(user._id.toString(), a[i])
					}
				})
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

app.get('*', function(req, res){
  res.status(404).send('404 Error');
});


var server = app.listen(8000, function () {
    console.log("Listening on port %s...", server.address().port);
});

const populateDatabase = function(){
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


// $('#calendar').fullCalendar({
//   schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives'
// });

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

module.exports = { addUser, addEvent, addAssignment, getAssignments, getEvents }





