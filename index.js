var express = require('express');
var app = express();
var socketIo = require('socket.io');

var bio = socketIo.listen(3001); //browser io
var dio = socketIo.listen(3002); //daemon io

bio.on("connection", function(socket) { //BROWSER IO
    //console.log("new browser connection");
    socket.on('disconnect', function() {
    	//console.log("browser disconnect");
    });
});
dio.on("connection", function(socket) { //DAEMON IO
    socket.on('disconnect', function() {
      console.log('daemon disconnected ');
    });
    socket.on('init', function(daemonKey) {
            console.log('init daemon key.. '+daemonKey);
            socket.emit('init ack');
    });
     socket.on('emit', function(data) {
         bio.emit('onEmit',data);
		 bio.emit(data.msg,data);
    });
     socket.on('recv', function(data) {
         bio.emit('recv',{data:data.toString('hex'),size:data.length});
    });
     socket.on('send', function(data) {
         bio.emit('send',{data:data.toString('hex'),size:data.length});
    });
});

app.get('/', function (req, res) {
	res.sendFile(__dirname+'/home.html');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});