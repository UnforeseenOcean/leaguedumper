var express = require('express');
var app = express();
var socketIo = require('socket.io');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var bio = socketIo.listen(3001); //browser io
var dio = socketIo.listen(3002); //daemon io

bio.on("connection", function(socket) { //BROWSER IO
    //console.log("new browser connection");
    socket.on('disconnect', function() {
    	//console.log("browser disconnect");
    });
});
dio.on("connection", function(socket) { //DAEMON IO
      console.log('daemon connected');
    socket.on('disconnect', function() {
      console.log('daemon disconnected');
    });
    socket.on('init', function(daemonKey) {
            console.log('init daemon key.. '+daemonKey);
            socket.emit('init ack');
    });
     socket.on('emit', function(data) {
         bio.emit('onEmit',data);
		 bio.emit(data.msg,data);
    });
     socket.on('recv', function(msg) {
         bio.emit('recv',{data:msg.data.toString('hex'),size:msg.data.length,time:msg.time});
    });
     socket.on('send', function(msg) {
         bio.emit('send',{data:msg.data.toString('hex'),size:msg.data.length,time:msg.time});
    });
});

app.get('/', function (req, res) {
	res.sendFile(__dirname+'/home.html');
});
app.get('/hexer', function (req, res) {
	res.sendFile(__dirname+'/hexedit.html');
});
app.get('/cfg', function (req, res) {
	res.sendFile(__dirname+'/packetEnum.js');
});
app.get('/save/:cfg', function (req, res) {
	res.send(req.params.cfg);
});
app.get('/packetParser/parser.js', function (req, res) {
	res.sendFile(__dirname+'/packetParser/parser.js');
});
app.get('/packetParser/:header', function (req, res) {
	try {
		res.sendFile(__dirname+'/packetParser/'+req.params.header+'.js');
	} catch(e) {
		
	}
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});