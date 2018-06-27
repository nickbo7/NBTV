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
//var queue = [];
//var rooms = [];
var games = [];        

var players = {};

//app.set('port', 5000);
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

//voting timer
function voteTimer(room) {
    setTimeout(endVote, 5000, room);
    //timer display
    io.to(room).emit('timerStart');
}



function endVote(room) {
    io.to(room).emit('beginScore', games, room);
    console.log("voting over");
}

io.on('connection', function (socket) {
    io.sockets.emit('updateView', games);
    socket.on('new player', function () {
        players[socket.id] = {
//            x: 300,
//            y: 300,
            username: null,
            host: false
        };
    });
//    socket.on('movement', function (data) {
//        var player = players[socket.id] || {};
//        if (data.left) {
//            player.x -= 5;
//        }
//        if (data.up) {
//            player.y -= 5;
//        }
//        if (data.right) {
//            player.x += 5;
//        }
//        if (data.down) {
//            player.y += 5;
//        }
//    });
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
            socket.username = username;
            socket.host = true;
            socket.room = roomcode;
            console.log(username + " created room " + roomcode);
            socket.join(roomcode);
            games.push({
                "room_id": roomcode,
                "active": false,
                "round": 1,
                "host": {"id": username, "answers": [], "score": 0},
                "players": [],
                "spectators": []
            });
            console.log(username + " has joined " + roomcode);
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
                //player join
                if (games[z].room_id === roomcode) {
                    if (games[z].active === false) {
                        socket.join(roomcode);
                        socket.room = roomcode;
                        console.log(username + " has joined " + socket.room);
                        games[z].players.push({"id": username, "answers": [], "score": 0});                        
//                        io.sockets.emit('updateView', games);
                        io.to(roomcode).emit('updateGameLobby', roomcode, games);                        
                        console.log(JSON.stringify(games));
                    } else {
                        for (var x in games[z].players) {
                            if (games[z].players[x].id === socket.username) {
                                socket.join(roomcode);
                                socket.room = roomcode;
                                io.to(roomcode).emit('updateGameLobby', roomcode, games);
                                socket.emit('rejoin', games, username);
                                console.log(username + " has rejoined " + socket.room);                                
                                console.log(JSON.stringify(games));                                
                            } else {
                                socket.join(roomcode);
                                socket.spectator = true;
                                games[z].spectators.push({"id": username});
                                io.to(roomcode).emit('updateGameLobby', roomcode, games);
                                console.log(username + " is spectating " + roomcode);
                                console.log(JSON.stringify(games));                                
                            }
                        }
                    }
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
                games[x].active = true;
                console.log(room + " starting game");
                io.to(room).emit('beginGame');                
            }
        }
    });
    socket.on('submitResponse', function(room, response) {
        for (var x in games) {
            if (games[x].room_id === room) {
                var limit = games[x].players.length + 1;
                var playerAnswers = 0;
                var hostAnswer = 0;
                for (var y in games[x].players) {
                    if (games[x].players[y].id === socket.username) {
                        games[x].players[y].answers.push(response);
                    }
                    if (games[x].players[y].answers.length > 0) {
                        playerAnswers += 1;
                    }
                }
                if (games[x].host.id === socket.username) {
                    games[x].host.answers.push(response);
                }
                if (games[x].host.answers.length > 0) {
                    hostAnswer += 1;
                }
                if ((hostAnswer + playerAnswers) === limit) {
                    io.to(room).emit('beginVote', games);
                    voteTimer(room);
                    console.log("Round complete");
                }
            }
        }        
    });
    socket.on('userVote', function(vote, username) {
        console.log(username + " voted " + vote);
        var roomcode = socket.room;
        for (var x in games) {
            if (games[x].room_id === roomcode) {
                if (games[x].host.answers[games[x].round - 1] === vote) {
                    games[x].host.score += 100;
                    console.log(games[x].host.id + " score: " + games[x].host.score);
                }
                for (var y in games[x].players) {                    
                    if (games[x].players[y].answers[games[x].round - 1] === vote) {
                        games[x].players[y].score += 100;
                        console.log(games[x].players[y].id + " score: " + games[x].players[y].score);
                    }                    
                }
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
            console.log(socket.username + " is closing " + socket.room);
            console.log(JSON.stringify(games));
        } else if (socket.spectator === true) {
            for (var y in games) {
                for (var z in games[y].players) {
                    if (games[y].spectators[z].id === socket.username) {                    
                    games[y].spectators.splice(games[y].spectators.indexOf(socket.username), 1);
//                    socket.leave(roomcode);
                    io.to(roomcode).emit('updateGameLobby', roomcode, games);                    
                    console.log(socket.username + " stopped spectating");
                    console.log(JSON.stringify(games));
                    }
                }
            }
        } else {
            for (var y in games) {
                for (var z in games[y].players) {
                    if (games[y].players[z].id === socket.username) {                    
                        if (games[y].active === false) {
                            games[y].players.splice(games[y].players.indexOf(socket.username), 1);
//                          socket.leave(roomcode);
                            io.to(roomcode).emit('updateGameLobby', roomcode, games);                    
                            console.log(socket.username + " left");
                            console.log(JSON.stringify(games));
                        } else {
                            console.log(socket.username + " left active game");
                            console.log(JSON.stringify(games));
                        }
                    }
                }
            }
        }
    });
});

//setInterval(function () {
//    io.sockets.emit('state', players);
//}, 1000 / 60);