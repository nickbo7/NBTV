// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var prompts = ["You never know what you can do until you", "If you think you are too small to make a difference, you haven't", "Where we're going, we don't need", "Only a fool tests the depth of water with", "It takes a village to raise a", "Loose lips sink", "A man who chases two rabbits catches", "Nothing is impossible for a", "If you do good, _____ will be done to you", "A wise man makes his own decisions, and an ignorant man", "To try and to fail is", "A fool says what he knows, and a wise man", "There is too much _____ in the world.", "I am protesting against", "If I've learned one thing in life, it is", "Would you like _____ with that?", "The coolest thing about the future will be", "If it wasn't for _____, I wouldn't be here today.", "I was a professional _____ at the age of 10", "Please don't", "The biggest threat to humanity is actually", "L.O.L. stands for", "As punishment for your crimes, you are sentenced to", "To reduce the wealth gap, we just need to", "If I win the lottery, I will spend the money on", "For my Birthday, I'm asking for", "H.O.M.E. stands for", "L.O.V.E. stands for", "The greatest pleasure in life is", "I am strong, I am worthy, I am", "When life knocks you down,", "The virus that wiped out the Internet was called", "My last words were", "The 28th amenment to the U.S. Constitution will grant citizens the right to", "It takes 900 licks to get to the center of _____?", "It's pretty cool that you like", "I was once in a band called", "Last time you did that, I _____ for days", "My biggest fear is", "It's nice when people", "In 100 years, everyone will eat", "My doctor told me _____ will fix my issue", "If you ever go to New York, be sure to check out", "What happened to you?", "I once spent my life savings on", "I could vote for _____ if they run for President", "Which way is it to"];
//var prompts = ["0"];
var games = [];
var players = {};
var t;

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
    t = setTimeout(endVote, 30000, room);
    var time = 300; //50 ~= 5 sec, 300 ~= 30 sec 
    //timer display
    io.to(room).emit('timerStart', time);
}

function stopTimer(roomcode) {
    clearTimeout(t);
}

function endVote(room) {
    io.to(room).emit('beginScore', games, room);            
    timer(5000, room);
}

//scoreboard timer
function timer(ms, room) {
    setTimeout(nextRound, ms, room);
    var time = 50; //50 ~= 5 sec, 300 ~= 30 sec 
    io.to(room).emit('timerStart', time);
}

//shuffle deck
function shuffle(prompts) {
    for (let i = prompts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [prompts[i], prompts[j]] = [prompts[j], prompts[i]];
    }
    return prompts;
}

function nextRound(room) {
    for (var x in games) {
        if (games[x].room_id === room) {
            if (games[x].round === prompts.length) {
                io.to(room).emit('endGame');
                return;
            }
            for (var y in games[x].players) {
                games[x].players[y].answers = [];
            }
            games[x].host.answers = [];
            games[x].round += 1;
            games[x].votes = 0;
            var prompt = prompts[games[x].round - 1];
            io.to(room).emit('nextRound', prompt);
        }
    }        
}

io.on('connection', function (socket) {
    io.sockets.emit('updateView', games);
    socket.on('new player', function () {
        players[socket.id] = {
            username: null
//            host: false
        };
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
            socket.username = username;
            socket.host = true;
            socket.room = roomcode;
            console.log(username + " created room " + roomcode);
            socket.join(roomcode);
            games.push({
                "room_id": roomcode,
                "active": false,
                "round": 1,
                "votes": 0,
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
        shuffle(prompts);
        var prompt = prompts[0];
        for (var x in games) {
            if (games[x].room_id === room) {
                if (games[x].players.length > 0) {
                    games[x].active = true;
                    io.to(room).emit('beginGame', prompt);                    
                }
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
//                    console.log("All answers submitted");
                }
            }
        }        
    });
    socket.on('userVote', function(vote, username) {
//        console.log(username + " voted " + vote);
        var roomcode = socket.room;
        if (socket.spectator === true) {
            for (var x in games) {
                if (games[x].room_id === roomcode) {
                    if (games[x].host.answers[0] === vote) {
                        games[x].host.score += 50;
//                        console.log(games[x].host.id + " score: " + games[x].host.score);
                    }
                    for (var y in games[x].players) {                    
                        if (games[x].players[y].answers[0] === vote) {
                            games[x].players[y].score += 50;
//                            console.log(games[x].players[y].id + " score: " + games[x].players[y].score);
                        }                    
                    }
                }
            }
        } else {
            for (var x in games) {
                if (games[x].room_id === roomcode) {
                    games[x].votes += 1;
                    if (games[x].host.answers[0] === vote) {
                        games[x].host.score += 100;
//                        console.log(games[x].host.id + " score: " + games[x].host.score);
                    }
                    for (var y in games[x].players) {                    
                        if (games[x].players[y].answers[0] === vote) {
                            games[x].players[y].score += 100;
//                            console.log(games[x].players[y].id + " score: " + games[x].players[y].score);
                        }                    
                    }
                    if (games[x].votes === games[x].players.length + 1) {
                        var time = 50;
                        io.to(roomcode).emit('timerStart', time);
                        stopTimer(roomcode);
                        endVote(roomcode);
                    }
                }
            }
        }
    });
    socket.on('restartGame', function(room) {
        console.log(room + " restarting game");
        for (var x in games) {
            if (games[x].room_id === room) {
                games[x].round = 1;
                games[x].votes = 0;
                games[x].host.score = 0;
                games[x].host.answers = [];
                for (var y in games[x].players) {
                    games[x].players[y].score = 0;
                    games[x].players[y].answers = [];
                }
                console.log(games[x]);
            }
        }
        io.to(room).emit('restart');
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