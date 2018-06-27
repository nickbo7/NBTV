// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var fs = require('fs');

var app = express();
var router = express.Router();
var server = http.Server(app);
var io = socketIO(server);
var queue = [];
var rooms = [];

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.use('/game', express.static(__dirname + '/game'));

// Routing
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//User creates game
app.get('/:roomcode', function (req, res) {
    res.sendFile(path.join(__dirname, 'random.html'));
});

// Starts the server.
server.listen(5000, function () {
    console.log('Starting server on port 5000');
});

//404 response
//function send404Response(response) {
//    response.writeHead(404, { 'Content-Type': 'text/plain' });
//    response.write("Error 404: Page not found");
//    response.end();
//}

var players = {};
io.on('connection', function (socket, username) {
    io.sockets.emit('updateQueue', players, username, queue, rooms);
    socket.on('new player', function () {
        players[socket.id] = {
            x: 300,
            y: 300,
            username: null,
            host: false
        };
    });
    socket.on('movement', function (data) {
        var player = players[socket.id] || {};
        if (data.left) {
            player.x -= 5;
        }
        if (data.up) {
            player.y -= 5;
        }
        if (data.right) {
            player.x += 5;
        }
        if (data.down) {
            player.y += 5;
        }
    });
    //creates new game
    socket.on('newGame', function (username) {
        if(username.length >= 1) {
            function makeid() {
                var text = "";
                var possible = "abcdefghijklmnopqrstuvwxyz";
                for (var i = 0; i < 4; i++)
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                return text.toUpperCase();
            }        
            var roomcode = makeid();
            rooms.push(roomcode);
            socket.username = username;
            socket.host = true;
            socket.room = roomcode;
            socket.emit('createGame', roomcode);
            console.log(username + " created room " + roomcode);
            socket.join(roomcode);
            queue.push(username);
            console.log(username + " has joined " + roomcode);
            var roomOccupants = io.sockets.adapter.rooms[roomcode];
            var msg = roomOccupants.length + " connected to " + roomcode;
            io.to(roomcode).emit('servermsg', msg, roomcode);
            io.sockets.emit('updateQueue', players, username, queue, rooms);
            console.log("Games in progress: " + rooms);
        } else {
            socket.emit('failedJoin', players, username, queue, rooms);
            return;
        }
        io.sockets.emit('updateQueue', players, username, queue, rooms);
        
    });

    //gets username and adds to queue
    socket.on('joinGame', function (username, roomcode) {
        if(username.length >= 1 && roomcode.length === 4) {            
            socket.username = username;        
            for (var y in rooms) {
                if (rooms[y] === roomcode) {
                    socket.join(roomcode);
                    socket.room = roomcode;
                    console.log(username + " has joined " + roomcode);
                    queue.push(username);
                    socket.emit('queuePlayer', username, queue);
                    io.sockets.emit('updateQueue', players, username, queue, rooms);
                    var roomOccupants = io.sockets.adapter.rooms[roomcode];
                    var msg = roomOccupants.length + " connected to " + roomcode;
                    io.to(roomcode).emit('servermsg', msg, roomcode);
                } else if(!(roomcode in rooms)) {
                    console.log('room not found');
                    socket.emit('failedJoin', players, username, queue, rooms);
                }
            }
        } else {
            socket.emit('failedJoin', players, username, queue, rooms);            
        }
    });
        
    socket.on('leaveRoom', function() {
        for (var x in queue) {
            if (queue[x] === socket.username) {
                queue.splice(queue.indexOf(socket.username), 1);
                console.log(socket.username + " has returned to the lobby");                
            }
        }
        io.sockets.emit('updateQueue', players, username, queue, rooms);
    });
    socket.on('disconnect', function() {
//        if (socket.host === true) {
//            console.log(socket.username + " is closing " + socket.room);
//            var roomcode = socket.room;
//            for (var x in rooms) {
//                if (rooms[x] === socket.room) {
//                    rooms.splice(rooms.indexOf(socket.room), 1);
//                    console.log("A room was closed");
//                    io.to(roomcode).emit('emptyRoom');
//                }
//            }
//        } else {
//            console.log("A user left");
//        }
//        for (var x in queue) {
//            if (queue[x] === socket.username) {
//                queue.splice(queue.indexOf(socket.username), 1);
//                socket.leave(roomcode);
//            }
//        }
        io.sockets.emit('updateQueue', players, username, queue, rooms);
    });
});

setInterval(function () {
    io.sockets.emit('state', players);
}, 1000 / 60);