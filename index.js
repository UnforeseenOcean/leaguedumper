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


const BinaryFile = require('binary-file');
var ffi = require('ffi');
var ref = require('ref');
var smartBuffer = require('smart-buffer');
var mcrypt = require('mcrypt');

var intPtr = ref.refType('int');
var Compression = ffi.Library('Compression.dll', {
  'decompress': [ 'uint8*', [ 'string', 'int', intPtr ] ],
  'free_mem': [ 'void', [] ]
});
var BlowfishLib = ffi.Library('BlowfishLib.dll', {
	'BlowFishCreate': [ 'int', ['uint8*'] ],
	'Decrypt': [ 'void', ['int','uint8*','int'] ]
});

function ParseReplay(file,addCallback,callback) {
	var bf;
	var html = '';
	var json;
	var buffer;
	const myBinaryFile = new BinaryFile('./replay.lrf', 'r',true);
	myBinaryFile.open().then(function () {
	  console.log('File opened');
	  return myBinaryFile.readUInt32();
	}).then(function (version) {
		html += 'Version: '+version+'<br>';
		return myBinaryFile.readInt32();
	}).then(function (jsonLen) {
		return myBinaryFile.readString(jsonLen);
	}).then(function (_json) {
		json = JSON.parse(_json);
		//bf = new Blowfish(json.encryptionKey);
		bf = BlowfishLib.BlowFishCreate(Buffer.from(json.encryptionKey, 'base64'));
		return myBinaryFile.size();
	}).then(function (_size) {
		var size = _size-myBinaryFile.tell();
		return myBinaryFile.read(size);
	}).then(function (_buffer) {
		buffer = _buffer;
	}).then(function () {
		var vFrags = {};
		var outNumber = ref.alloc('int'); // allocate a 4-byte (32-bit) chunk for the output datae
		var fBuffer = Compression.decompress(buffer,buffer.length,outNumber);
		var actualNumber = outNumber.deref();
		var buf = new smartBuffer(fBuffer.reinterpret(actualNumber));
		//do stuff?
		var bDone = false;
			  var packets = [];
			  while(buf.remaining()) {
				  var p = {};
				  var packetTime = buf.readFloatLE();
				  p.t = packetTime;
				  p.l = buf.readUInt32LE();
				  if(buf.remaining() < p.l) {
					  console.log('zomg');
					buf.readInt8();
					p.t = buf.readFloatLE();
				  	p.l = buf.readUInt32LE();
				  }
				  //skip enet?
				  p.data = buf.readBuffer(p.l);
				  p.GetHeader = function() { return this.data.readUInt8(0); };
				  p.Parse = function() { 
					  var buf = new smartBuffer(this.data);
					  buf.readUInt32LE();
					  buf.readUInt32LE();
					  var nOpCode = buf.readInt8() & 0x0F;
					  buf.readInt8();
					  buf.readUInt16LE();
					  if(nOpCode == 6) { //Reliable
						  var nLen = buf.readInt16BE();
						  if(nLen >= 8) {
							  if(buf.remaining() < nLen || nLen == 8) {
								return;
							  }
							  var _b = buf.readBuffer(nLen);
							  BlowfishLib.Decrypt(bf,_b,nLen);
							  var pBuf = new smartBuffer(_b);
							  this.buffer = pBuf;
							  var pHeader = pBuf.readUInt8();
							  this.header = pHeader;
							  if(pHeader == 0xFF) { //batched
								  var nCount = pBuf.readUInt8();
								  var nSize = pBuf.readUInt8();
								  var nOpcode = pBuf.readUInt8();
					  			  var netId = pBuf.readUInt32LE();
								  
								  var firstPacket = new Buffer(5);
								  firstPacket.writeUInt8(nOpcode,0);
								  firstPacket.writeUInt32LE(netId,1);
								  if(nSize > 5) {
									  if(pBuf.remaining() < nSize-5) {
										 console.log('too big');
										 }
									  var payload = pBuf.readBuffer(nSize-5);
									  firstPacket = Buffer.concat([firstPacket,payload],firstPacket.length+payload.length);
								  }
								  var obj = {header:nOpcode,data:firstPacket.toString('hex'),time:packetTime};
								  obj.Debug = function() {
									return 'B '+this.header.toString(16);
								  }
								  packets.push(obj);
								  addCallback(obj);
								  //iter
								  for(var i = 1; i < nCount;i++) {
									  var newId = 0;
									  var netIdChanged = false;
									  var command;
									  var flagsAndLength = pBuf.readUInt8();
									  var size = flagsAndLength >> 2;
									  if ((flagsAndLength & 0x01) > 0) { // additionnal byte, skip command
											command = nOpcode;
											if ((flagsAndLength & 0x02) > 0) {
												pBuf.readUInt8();
											} else {
												newId = pBuf.readUInt32LE();
												netIdChanged = true;
											}
										}
										else {
											command = pBuf.readUInt8();
											if ((flagsAndLength & 0x02) > 0) {
												pBuf.readUInt8();
											} else {
												newId = pBuf.readUInt32LE();
												netIdChanged = true;
											}
										}

										if (size == 0x3F) {
											size = pBuf.readUInt8(); // size is too big to be on 6 bits, so instead it's stored later
										}
									  var pBuffer = new Buffer(5);
									  pBuffer.writeUInt8(command,0);
									  if (netIdChanged) {
											netId = newId;
										}
									  pBuffer.writeUInt32LE(netId,1);
									  var payload = pBuf.readBuffer(size);
									  pBuffer = Buffer.concat([pBuffer,payload],pBuffer.length+payload.length);
									  //console.log(pBuffer);
									  var obj = {header:command,data:pBuffer.toString('hex'),time:packetTime};
									  obj.Debug = function() {
										return 'B1 '+this.header.toString(16);
									  }
									  packets.push(obj);
									  addCallback(obj);
								  }
							  } else if(pHeader == 0xFE) { //extended
								  var obj = {header:pHeader,data:_b.toString('hex'),time:packetTime};
								  obj.Debug = function() {
									return 'Ext '+this.header.toString(16);
								  }
								  packets.push(obj);
								  addCallback(obj);
							  } else {
								  var obj = {header:pHeader,data:_b.toString('hex'),time:packetTime};
								  obj.Debug = function() {
									return this.header.toString(16);
								  }
								  packets.push(obj);
								  addCallback(obj);
							  }
						  }
					  } else if(nOpCode == 8) { //Fragment
						  var fragmentGroup = buf.readUInt16LE();
						  var nLen = buf.readInt16BE();
						  //check len?
						  if(buf.remaining() < nLen+16) {
							  console.log(buf.remaining()+' - fragment too big - '+nLen);
							return;
						  }
						  //console.log('frag ok');
						  var totalFragments  = buf.readUInt32BE();
						  var currentFragment   = buf.readUInt32BE();
						  var totalLen   = buf.readUInt32BE();
						  buf.readUInt32BE(); //offset
						  var payload = buf.readBuffer(nLen);
						  //process payload
						  var vFrag = vFrags[fragmentGroup] || {};
						  vFrag[currentFragment] = payload;
						  vFrags[fragmentGroup] = vFrag;
						  if(Object.keys(vFrag).length == totalFragments) {
							  var _b = new Buffer(vFrag[0]);
							  for(var i = 1; i < vFrag.length;i++) {
								  var payload = vFrag[i];
									_b = Buffer.concat([_b,payload],_b.length+payload.length);
							  }
							  BlowfishLib.Decrypt(bf,_b,_b.length);
							  var pBuf = new smartBuffer(_b);
							  var obj = {header:pBuf.readUInt8(),data:_b.toString('hex'),time:packetTime};
								  obj.Debug = function() {
									return 'F '+this.header.toString(16);
								  }
								  packets.push(obj);
							  addCallback(obj);
							  //add packet
							delete vFrags[fragmentGroup];
						  }
					  } else if(nOpCode == 0x0C) { //Count - unknown command...
					  }
				  };
				  
				  buf.readInt8();
				  //check l?
				  if(packets.length < 1000) {
				  	p.Parse();
				  }
				  //packets.push(p);
			  }
			/*html += 'JSon: '+ json+'<br>';
			html += 'Packets: '+ packets.length +'<br>';
			for(var i = 0; i < packets.length;i++) {
				html += packets[i].Debug()+'<br>';
			}*/
		
		
		Compression.free_mem();
		callback(null,packets,json);
		
		return myBinaryFile.close();
	}).catch(function (err) {
	  console.log(`There was an error: ${err}`);
		callback(err,null,null);
	});
}

bio.on("connection", function(socket) { //BROWSER IO
    //console.log("new browser connection");
    socket.on('disconnect', function() {
    	//console.log("browser disconnect");
    });
    socket.on('parseReplay', function() {
		ParseReplay('replay.lrf',function(obj) {
			bio.emit('replayPacket',obj);
		},function(err,packets,json) {
			bio.emit('replayParsed');
		});
    	console.log('parsing replay..');
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
	res.sendFile(__dirname+'/hexedit.html');
});
app.get('/style.css', function (req, res) {
	res.sendFile(__dirname+'/style.css');
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