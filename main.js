// Pins4Peace
var fs = require("fs");
var express = require('express');
var app = express();

var http = require('http').createServer(function (req, res) {
	res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
	res.end();
});
// var http = require('http').createServer(app);

const privateKey = fs.readFileSync('/etc/letsencrypt/live/pins4peace.space/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/pins4peace.space/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/pins4peace.space/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

var https = require('https').createServer(credentials,app);
var io = require('socket.io')(https);

const path = require('path');

const axios = require('axios')

var md5 = require("blueimp-md5");

var data = require("./data/logs.json");
var fs = require('fs');

const request = require('request');

var FormData = require('form-data');

var multer = require('multer');
const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null,'./videos/');
    },
	filename: function(req, file, cb) {
		cb(null, data["logs"].length + path.extname(file.originalname));
	}
});
var upload = multer({storage: storage})


io.on('connection',(socket) => {
	console.log('a user connected');
	socket.on('disconnect',() => {
		console.log('user disconnected');
	});

	socket.on('reportVideo',(id) => {
		data["logs"][id]["ban"]++;
		updateJSON();
	});

});

app.use("/videos", express.static(__dirname + '/videos'));
app.use("/data", express.static(__dirname + '/data'));
app.use("/Photos", express.static(__dirname + '/UI/Photos'));
app.use("/css", express.static(__dirname + '/UI/css'));

app.get('/',(req,res) => {
	res.sendFile(__dirname + '/Client/map.html');
});

app.post('/addStory', upload.single("video"), function (req, res, next) {
	addStory(req.body.Address,req.body.Name,req.body.Title,path.extname(req.file.originalname));
	return res.redirect('/');
});

http.listen(80,() => {
	console.log('listening on *:80');
});
https.listen(443,() => {
 	console.log('listening on *:443');
});

// File system

function writeFile(location,name,value) {
	fs.writeFile(location + '/' + name,value,function writeJSON(err) {
		if(err) {
			return console.log(err);
		}
	});
}

function writeJSON(location,name,jsonOBJ) {
	writeFile(location,name,JSON.stringify(jsonOBJ));
}

//========================================================

function updateJSON() {
	writeJSON("./data/","logs.json",data);
}

// Each story has:
// ID
// Address - (Longtitude/Latitude)
// Name of person
// Title
// Ban Counter

function addStory(address, name, title, ext) {
	request({url: "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyADkEWk0rw92U2RLe3_8z0ejK1MQ-mUs9w&language=en&address=" + address},
	(error,res,body) => {
		if(error) {
			console.log("Error with google map: " + error);
			return;
		}else{
			var jsonObj = JSON.parse(body);
			
			data["logs"].push({
				"id": data["logs"].length,
				"lat": jsonObj.results[0].geometry.location.lat,
				"lng": jsonObj.results[0].geometry.location.lng,
				"name": name,
				"title": title,
				"ext": ext,
				"ban": 0,
				"echoar": -1
			});
			updateJSON();

		}
	});
}