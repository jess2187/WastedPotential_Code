const index = require('./index');
const uuidv4 = require('uuid/v4');

var _id = -1
var email = uuidv4().toString() +'@test.com'
console.log(email)
var today = new Date();

test('make user', done => {
  var data = {firstName: 'Arman', lastName: 'Aydemir', email: email, password:'test', passwordConf:'test'}
  index.addUser(data, function(usr1_id){
  	_id = usr1_id
  	expect(usr1_id).not.toBe(-1);
  	done()
  })
});


test('make user with duplicate email', done => {
 index.addUser({firstName: 'Arman Duplicate', lastName: 'Aydemir Duplicate', email: email, password:'test', passwordConf:'test'}, function(usr1_id){
  	expect(usr1_id).toBe(-1);
  	done()
  })
})

test('add assignment', done => {
	index.addAssignment(_id.toString(), {completed:false, due:  new Date(today.getFullYear(), today.getMonth(), today.getDate()+7), repeating:'', description:'test assignments 2', title:'test title 2',
				notifications: null, numhours:7, worktime:null})
	setTimeout(function(){index.getAssignments(_id.toString(), function(assignments){
		expect(assignments.length).toBe(1)
		done()
	})}, 1000);
})

test('add event', done => {
	index.addAssignment(_id.toString(), {start: new Date(today.getFullYear(), today.getMonth(), today.getDate()+7), end: new Date(today.getFullYear(), today.getMonth(), today.getDate()+8), repeating:'', description:'test assignments 2', title:'test title 2',
				notifications: null})
	setTimeout(function(){index.getEvents(_id.toString(), function(assignments){
		expect(assignments.length).toBe(1)
		done()
	})}, 1000);
})