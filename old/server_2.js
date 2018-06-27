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

var a = [
    {room_id:"",host:"",players:[]}
];

var sloan = null;


var arr = [];
        

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
//            socket.emit('createGame', roomcode);
            console.log(username + " created room " + roomcode);
            socket.join(roomcode);
            queue.push(username);            
            a[0].host = username;
            a[0].room_id = roomcode;
            function addRoom(roomcode, username) {
                [{"room_id": roomcode,"host": username,"players":[]}].push.call(this, roomcode, username);
        
            //    members: function addMember(username) {
            //            [].push.call(this, username);
            //        }

            };
            //sloan = addRoom(roomcode, username);
            
            arr.push({
                room_id: roomcode,
                host: username,
                players: []
            });

//            sloan.rooms({roomcode});
//            sloan.rooms.host = username;
//            console.log(sloan.length);
            console.log(username + " has joined " + roomcode);
            var roomOccupants = io.sockets.adapter.rooms[roomcode];
            var msg = roomOccupants.length + " connected to " + roomcode;
            io.to(roomcode).emit('servermsg', msg, roomcode);
            io.to(roomcode).emit('newGameLobby', roomcode);
            io.sockets.emit('updateQueue', players, username, queue, rooms);
//            console.log("Games in progress: " + rooms);
//            console.log("Your host is: " + JSON.stringify(a[0].host));
//            console.log("I am " + JSON.stringify(a[0].room_id));
            //sloan.forEach((e)=>console.log("Sloan: " + e.room_id + " Host: " + e.host + " Players: " + e.players));
            console.log(JSON.stringify(arr));
            //a.forEach((e)=>console.log("Room: " + e.room_id + " Host: " + e.host + " Players: " + e.players));
//            console.log("heyy " + arr);
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
            for (var z in arr) {                    
                    if (arr[z].room_id === roomcode) {
                        socket.join(roomcode);
                        socket.room = roomcode;
                        console.log(username + " has joined " + socket.room);
                        queue.push(username);
                        a[0].players[0] = username;
                        arr[z].players.push(username); 
                        //sloan.rooms.player1 = username;
                        socket.emit('queuePlayer', username, queue);
                        io.sockets.emit('updateQueue', players, username, queue, rooms);
                        var roomOccupants = io.sockets.adapter.rooms[roomcode];
                        var msg = roomOccupants.length + " connected to " + roomcode;
                        io.to(roomcode).emit('servermsg', msg, roomcode);
                        io.to(roomcode).emit('joinGameLobby', roomcode);                    
                        //a.forEach((e)=>console.log("Room: " + e.room_id + " Host: " + e.host + " Players: " + e.players));
                        console.log("match " + JSON.stringify(arr));                        
                    } 
//                    else if (!(roomcode in arr)) {
//                        console.log("fail");
//                        socket.emit('failedJoin', players, username, queue, rooms);
//                    }
                }
//            for (var y in rooms) {
//                if (rooms[y] === roomcode) {
//                    socket.join(roomcode);
//                    socket.room = roomcode;
//                    console.log(username + " has joined " + socket.room);
//                    queue.push(username);
//                    a[0].players[0] = username;
//                    //sloan.rooms.player1 = username;
//                    socket.emit('queuePlayer', username, queue);
//                    io.sockets.emit('updateQueue', players, username, queue, rooms);
//                    var roomOccupants = io.sockets.adapter.rooms[roomcode];
//                    var msg = roomOccupants.length + " connected to " + roomcode;
//                    io.to(roomcode).emit('servermsg', msg, roomcode);
//                    io.to(roomcode).emit('joinGameLobby', roomcode);                    
//                    a.forEach((e)=>console.log("Room: " + e.room_id + " Host: " + e.host + " Players: " + e.players));
//                } else if(!(roomcode in rooms)) {
//                    console.log('room not found');
//                    socket.emit('failedJoin', players, username, queue, rooms);
//                }
//            }
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
        if (socket.host === true) {
            console.log(socket.username + " is closing " + socket.room);
            var roomcode = socket.room;
            for (var x in rooms) {
                if (rooms[x] === socket.room) {
                    rooms.splice(rooms.indexOf(socket.room), 1);
                    console.log("A room was closed");
                    io.to(roomcode).emit('emptyRoom');
                }
            }
        } else {
            console.log("A user left");
        }
        for (var x in queue) {
            if (queue[x] === socket.username) {
                queue.splice(queue.indexOf(socket.username), 1);
                socket.leave(roomcode);
            }
        }
        io.sockets.emit('updateQueue', players, username, queue, rooms);
    });
});

//setInterval(function () {
//    io.sockets.emit('state', players);
//}, 1000 / 60);