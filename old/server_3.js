// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
//var fs = require('fs');

var app = express();
//var router = express.Router();
var server = http.Server(app);
var io = socketIO(server);
var queue = [];
var rooms = [];
var games = [];        

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.use('/css', express.static(__dirname + '/css'));

// Routing
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
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

io.on('connection', function (socket) {
    io.sockets.emit('updateView', games);
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
            console.log(username + " created room " + roomcode);
            socket.join(roomcode);
            queue.push(username);
            games.push({
                room_id: roomcode,
                host: username,
                players: []                
            });
            console.log(username + " has joined " + roomcode);
            var roomOccupants = io.sockets.adapter.rooms[roomcode];
            var msg = roomOccupants.length + " connected to " + roomcode;
            io.to(roomcode).emit('servermsg', msg, roomcode);
            io.to(roomcode).emit('updateGameLobby', roomcode, games);
            io.sockets.emit('updateView', games);            
            console.log(JSON.stringify(games));
        } else {
            socket.emit('failedJoin', games);
            return;
        }
        io.sockets.emit('updateView', games);
        
    });

    //gets username and adds to room
    socket.on('joinGame', function (username, roomcode) {
        if(username.length > 0) {            
            socket.username = username;        
            for (var z in games) {                    
                    if (games[z].room_id === roomcode) {
                        socket.join(roomcode);
                        socket.room = roomcode;
                        console.log(username + " has joined " + socket.room);
                        queue.push(username);                        
                        games[z].players.push({"id": username, "answers": [], "score": 0});                        
                        socket.emit('queuePlayer', username, queue);
                        io.sockets.emit('updateView', games);
                        var roomOccupants = io.sockets.adapter.rooms[roomcode];
                        var msg = roomOccupants.length + " connected to " + roomcode;
                        io.to(roomcode).emit('servermsg', msg, roomcode);
                        io.to(roomcode).emit('updateGameLobby', roomcode, games);                        
                        console.log(JSON.stringify(games));                        
                    } else if (games[z].room_id !== roomcode) {                        
                        socket.emit('tryAgain', games);
                    } else {
                        console.log("User join failed");
                        socket.emit('failedJoin', games);                        
                    }
                }
        } else {
            socket.emit('failedJoin', games);            
        }
    });    
    socket.on('startGame', function (room) {
        for (var x in games) {
            if (games[x].players.length > 0) {
                console.log(room + " starting game");
                io.to(room).emit('beginGame');
            }
        }
    });
    socket.on('submitResponse', function(room, response) {
        for (var x in games) {
            for (var y in games[x].players) {
                if (games[x].players[y] === socket.username) {
                    games[x].players[y].answer.push(response);
                    io.to(room).emit('answerLogged', response);
//                    console.log(JSON.stringify(games[x].players[y].answer));
//                    console.log(socket.username + ": " + response + " (" + room + ")");                    
                }
            }               
        }
    });
    socket.on('leaveRoom', function(roomcode) {
        for (var x in queue) {
            if (queue[x] === socket.username) {
                queue.splice(queue.indexOf(socket.username), 1);
                io.to(roomcode).emit('updateGameLobby', roomcode, games);
                console.log(socket.username + " has returned to the lobby");                
            }
        }
    });
    socket.on('disconnect', function() {
        var roomcode = socket.room;
        if (socket.host === true) {
            for (var x in games) {
                if (games[x].room_id === socket.room) {
                    games.splice(games.indexOf(games[x]), 1);
                    io.to(roomcode).emit('emptyRoom');
                }
            }
            //remove this at some point
            for (var x in rooms) {
                if (rooms[x] === socket.room) {
                    rooms.splice(rooms.indexOf(socket.room), 1);
                    //io.to(roomcode).emit('emptyRoom');
                }
            }
            console.log(socket.username + " is closing " + socket.room);
            console.log(JSON.stringify(games));
        } else {
            for (var y in games) {
                for (var z in games[y].players) {
                    if (games[y].players[z] === socket.username) {                    
                    games[y].players.splice(games[y].players.indexOf(socket.username), 1);
                    socket.leave(roomcode);
                    io.to(roomcode).emit('updateGameLobby', roomcode, games);                    
                    console.log(socket.username + " left");
                    console.log(JSON.stringify(games));
                    }
                }
            }
        }
        //io.to(roomcode).emit('updateGameLobby', roomcode, games);
//        io.to(roomcode).emit('updateView', games);
//        console.log(JSON.stringify(games));
    });
});

//setInterval(function () {
//    io.sockets.emit('state', players);
//}, 1000 / 60);