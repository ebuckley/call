
/**
 * Module dependencies.
 */

var express = require('express'),
	http = require('http'),
	bodyParser = require('body-parser'),
	_ = require('underscore'),
	path = require('path');
	// cfg = require('./package.json');


//setup http
var a = express();

// all environments
a.set('port', process.env.PORT || 3000);
a.set('views', __dirname + '/views');
a.engine('html', require('ejs').renderFile);

//middlleware
a.use(bodyParser.json());
a.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == a.get('env')) {
  a.use(require('errorhandler')());
}


a.get('/', function(req, res) {
	res.render('index.html');
});

//todo
// * add
// * remove
a.get('/people', function (req, res) {
	res.send(people);
});

a.post('/people', function (req, res) {
	if (_.isArray(req.body)) {
		var newPeople = [];
		_.each(req.body, function (person) {
			if (_.isString(person)) {
				newPeople.push({
					name: person,
					isHere: false
				});
			} else {
				newPeople.push(person);
			}
		});
		people = newPeople;
		io.emit('updatePeopleFromServer', people);
		console.log('reset people:', people);
	} else {
		console.log('adding: ',req.body);
		people.push(req.body);
		io.emit('updatePeopleFromServer', people);
	}
	res.send(req.body);
});

var io = require('socket.io')(http.createServer(a).listen(a.get('port'), function(){
  console.log('Express server listening on port ' + a.get('port'));
}));

var people = [];

//socketio
io.on('connection', function(socket){
  console.log('a user connected', socket.client.id);
  socket.emit('updatePeopleFromServer', people);
  socket.on('updatePeopleFromClient', function (data) {
  	people = data;
  	io.emit('updatePeopleFromServer', data);
  });
  socket.on('disconnect', function () {
  	console.log('disconnect', socket.client.id);
  });
});
