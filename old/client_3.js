var socket = io();

var host = false;

var player = false;

var username = null;

var room = null;

var roomInfo = null;

//var score = 0;

//var movement = {
//    up: false,
//    down: false,
//    left: false,
//    right: false
//};

document.getElementById("info").style.display = 'none';
document.getElementById("roomid").style.display = 'none';
document.getElementById("playerList").style.display = 'none';
document.getElementById("host").style.display = 'none';
document.getElementById("gameForm").style.display = 'none';
//document.getElementById("topNav").style.display = 'none';
document.getElementById("gameFooter").style.display = 'none';
document.getElementById("button-submit").style.display = 'none';
document.getElementById("card").style.display = 'none';
document.getElementById("timer").style.display = 'none';
document.getElementById("myBar").style.display = 'none';
document.getElementById("entryForm").style.display = 'flex';
document.getElementById("homeFooter").style.display = 'flex';


//enter button handler join or new
document.getElementById("username").addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13 && document.getElementById('roomcode').value.length > 0) {
        document.getElementById("button-join").click();
    } else if (event.keyCode === 13) {
        document.getElementById("button-new").click();
    }
});

//enter button handler join
document.getElementById("roomcode").addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        document.getElementById("button-join").click();
    }
});

//enter button handler submit
document.getElementById("response").addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        document.getElementById("button-submit").click();
    }
});

//new game button
document.getElementById("button-new").addEventListener('click', function() {
    username = document.getElementById('username').value.toUpperCase();
    socket.emit('newGame', username);
    document.getElementById('username').disabled = true;
    document.getElementById('roomcode').disabled = true;
    document.getElementById('button-new').disabled = true;
    document.getElementById('button-join').disabled = true;
    host = true;
});


//join game button
document.getElementById("button-join").addEventListener('click', function() {
    username = document.getElementById('username').value.toUpperCase();
//    var msg = new SpeechSynthesisUtterance("help me " + username);
//    window.speechSynthesis.speak(msg);
    var roomcode = document.getElementById('roomcode').value.toUpperCase();
    socket.emit('joinGame', username, roomcode);
    document.getElementById('username').disabled = true;
    document.getElementById('roomcode').disabled = true;
    document.getElementById('button-new').disabled = true;
    document.getElementById('button-join').disabled = true;
    player = true;
});

//start game button
document.getElementById("button-start").addEventListener('click', function() {
    socket.emit('startGame', room);
});

//submit button
document.getElementById("button-submit").addEventListener('click', function() {
    if (document.getElementById("response").value.length > 0) {
        var response = document.getElementById("response").value.toUpperCase();
        socket.emit("submitResponse", room, response);
        document.getElementById("button-submit").disabled = true;
        document.getElementById("button-submit").value = "Waiting...";
        document.getElementById("card").style.display = 'none';
    }
});

socket.on('timerStart', function() {
    document.getElementById("timer").style.display = 'block';
    document.getElementById("myBar").style.display = 'block';
    function move() {
        var elem = document.getElementById("myBar");   
        var width = 1;
        var id = setInterval(frame, 50); //about 5 seconds, 333 = 30 seconds        
        
        function frame() {
            if (width >= 100) {
              clearInterval(id);             
            } else {
              width++;
              elem.style.width = width + '%';
            }
        }
    }
    move();
});

//update home view buttons and text entry status
socket.on('updateView', function(games) {
    if (games.length === 0) {
        document.getElementById('button-join').disabled = true;
        document.getElementById('button-new').disabled = false;
        document.getElementById('roomcode').disabled = true;
        document.getElementById('username').disabled = false;        
    } else if (host === false && player === false && games.length >= 0) {
        document.getElementById('button-join').disabled = false;
        document.getElementById('button-new').disabled = false;
        document.getElementById('roomcode').disabled = false;
        document.getElementById('username').disabled = false;
    }
});

//manages game lobby and display of game view elements
socket.on('updateGameLobby', function(roomcode, games) {
    document.getElementById('entryForm').style.display = 'none';
    document.getElementById('homeFooter').style.display = 'none';
//    document.getElementById('topNav').style.display = 'block';
    document.getElementById('gameForm').style.display = 'block';
    document.getElementById('gameFooter').style.display = 'block';
    document.getElementById('host').style.display = 'block';        
    document.getElementById('roomid').style.display = 'block';
    document.getElementById('playerList').style.display = 'block';
    document.getElementById('info').style.display = 'inline-block';
    document.getElementById('roomid').innerHTML = roomcode;
    for (var x in games) {
        if (games[x].room_id === roomcode) {
            roomInfo = games[x];
            room = games[x].room_id;
//            console.log(roomInfo);
            if (host === true) {
                var hostSeat = games[x].host.id + "*";
            } else {
                var hostSeat = games[x].host.id;
            }
        }
    }
    document.getElementById("host").innerHTML = hostSeat;
    var playerSeats = [];
    for (var x in games) {
        if (games[x].room_id === roomcode) {
            for (var y in games[x].players) {
                playerSeats.push(games[x].players[y].id);
            }
            document.getElementById("playerList").innerHTML = playerSeats.join("\n");
        }
        if (games[x].players.length === 0) {
            document.getElementById("button-start").disabled = true;    
        } else if (games[x].players.length > 0 && host === true){
            document.getElementById("button-start").disabled = false;    
        } else if (player === true) {
            document.getElementById("button-start").disabled = true;
            document.getElementById("button-start").value = "Waiting...";
        }
    }
});

//game start
socket.on('beginGame', function() {
//    var msg = new SpeechSynthesisUtterance("Welcome to sloan dot T V. Here we go.");
    document.getElementById('button-start').style.display = 'none';
    document.getElementById('button-submit').style.display = 'block';
    document.getElementById('gameForm').style.display = 'block';
    document.getElementById('button-submit').disabled = false;
    document.getElementById('card').style.display = 'block';
    document.getElementById('vote').style.display = 'none';
//    window.speechSynthesis.speak(msg);
});

socket.on('beginVote', function(games) {
    //set voting timer
//    voteTimer();
    document.getElementById('card').style.display = 'block';
    document.getElementById('prompt').style.display = 'block';
    document.getElementById('vote').style.display = 'block';
    document.getElementById('response').style.display = 'none';
    document.getElementById('button-submit').style.display = 'none';
    var answerList = [];
    for (var x in games) {
        if (games[x].room_id === room) {
            if (host === true) {
                for (var y in games[x].players) {
                    answerList.push("<li><a href=\"#\">" + games[x].players[y].answers[games[x].round - 1] + "</a></li>");
                }
            } else if (player === true) {
                answerList.push("<li><a href=\"#\">" + games[x].host.answers[games[x].round - 1] + "</a></li>");
                for (var y in games[x].players) {
                    if (games[x].players[y].id === username) {
                        //don't print my own answer
                    } else {                        
                        answerList.push("<li><a href=\"#\">" + games[x].players[y].answers[games[x].round - 1] + "</a></li>");
                    }
                }                
            } else {
                answerList.push("<li><a href=\"#\">" + games[x].host.answers[games[x].round - 1] + "</a></li>");
                for (var y in games[x].players) {
                    answerList.push("<li><a href=\"#\">" + games[x].players[y].answers[games[x].round - 1] + "</a></li>");
                }
            }
        }
    }
    var voteButtons = document.getElementById('vote-buttons');
    voteButtons.innerHTML = answerList.join("\n");
});

socket.on('beginScore', function(games, room) {
    document.getElementById("button-start").disabled = true;
    document.getElementById("button-start").style.display = 'block';
    document.getElementById("button-start").value = "Waiting...";
    document.getElementById("card").style.display = 'none';
    document.getElementById("timer").style.display = 'none';
    var scoreList = [];
    var sloan = [];
    for (var x in games) {
        if (games[x].room_id === room) {
            sloan.push(games[x].host.score);
            scoreList.push("<li>" + games[x].host.id + ": " + games[x].host.score + "</li>");
            console.log(games[x].host.id + " score: " + games[x].host.score);
            for (var y in games[x].players) {
                sloan.push(games[x].players[y].score);
                scoreList.push("<li>" + games[x].players[y].id + ": " + games[x].players[y].score + "</li>");
                console.log(games[x].players[y].id + " score: " + games[x].players[y].score);            
            }
        }
    }
//    
    var scores = document.getElementById("scores");
    sloan.sort(function(a, b) {
        return b - a;        
    });
    var sorted = [];
    for (var x in games) {
        if (games[x].room_id === room) {
            for (var y in sloan) {
                if (games[x].host.score === sloan[y]) {
                    sorted.push("<li>" + games[x].host.id + ": " + games[x].host.score + "</li>");
                } else {
                    for (var z in games[x].players) {
                        if (games[x].players[z].score === sloan[y]) {
                            sorted.push("<li>" + games[x].players[z].id + ": " + games[x].players[z].score + "</li>");
                        }
                    }
                }
            }
//            for (var y in games[x].players) {
//                scoreList
//            }
        }
    }
    scores.innerHTML = sorted.join("\n");
});

//get user vote
function getEventTarget(e) {
        e = e || window.event;
        return e.target || e.srcElement; 
    }

var ul = document.getElementById('vote-buttons');
ul.onclick = function(event) {
    var target = getEventTarget(event);
    var vote = target.innerHTML;
    socket.emit('userVote', vote, username);
    document.getElementById('vote').style.display = 'none';
    document.getElementById("button-start").disabled = true;
    document.getElementById("button-start").style.display = 'block';
    document.getElementById("button-start").value = "Waiting...";
};

socket.on('rejoin', function(games, username) {
    for (var x in games) {
        for (var y in games[x].players) {
            if (games[x].players[y].id === username) {                                 
                if (games[x].players[y].answers.length === games[x].round) {
                    console.log(games[x].players[y].answers.length + ' Welcome back ' + games[x].round);
                    document.getElementById('card').style.display = 'block';
                    document.getElementById('prompt').style.display = 'block';
                    document.getElementById('response').style.display = 'none';
                } else {
                    console.log(games[x].players[y].answers.length + ' Need your answer ' + games[x].round);
                    document.getElementById('button-start').style.display = 'none';
                    document.getElementById('button-submit').style.display = 'block';
                    document.getElementById('gameForm').style.display = 'block';
                    document.getElementById('button-submit').disabled = false;
                    document.getElementById('card').style.display = 'block';
                }                
            }
        }
    }    
});

//resets to home
socket.on('emptyRoom', function() {
    location.reload();
    console.log('Host has closed this room'); 
});

socket.on('disconnect', function() {
    if (host === true) {
      console.log("Host quit");
    } else {
      console.log("A player quit");
    }
});

//user tried to join nonexistent lobby
socket.on('tryAgain', function(games) {
    host = false;
    player = false;
    if (games.length === 0) {
        document.getElementById('roomcode').disabled = true;
        document.getElementById('button-join').disabled = true;        
    } else {
        document.getElementById('roomcode').disabled = false;
        document.getElementById('button-join').disabled = false;
    }
    document.getElementById('username').disabled = false;
    document.getElementById('button-new').disabled = false;
});

socket.on('failedJoin', function(games) {
    alert("Could not join room");
    host = false;
    player = false;
    if (games.length === 0) {
        document.getElementById('roomcode').disabled = true;
        document.getElementById('button-join').disabled = true;        
    } else {
        document.getElementById('roomcode').disabled = false;
        document.getElementById('button-join').disabled = false;
    }
    document.getElementById('username').disabled = false;
    document.getElementById('button-new').disabled = false;
});

socket.on('servermsg', function(msg) {
    console.log(msg);
});

socket.emit('new player');

//prevent closing game prematurely
//window.onbeforeunload = function() {
//    if (host === true) {
//        return true;
//    }
//};

//document.addEventListener('keydown', function(event) {
//  switch (event.keyCode) {
//    case 65: // A
//      movement.left = true;
//      break;
//    case 87: // W
//      movement.up = true;
//      break;
//    case 68: // D
//      movement.right = true;
//      break;
//    case 83: // S
//      movement.down = true;
//      break;
//  }
//});
//
//document.addEventListener('keyup', function(event) {
//    switch (event.keyCode) {
//        case 65: // A
//            movement.left = false;
//            break;
//        case 87: // W
//            movement.up = false;
//            break;
//        case 68: // D
//            movement.right = false;
//            break;
//        case 83: // S
//            movement.down = false;
//            break;
//    }
//});


//setInterval(function() {
//    socket.emit('movement', movement);
//}, 1000 / 60);

//var canvas = document.getElementById('canvas');
//canvas.width = 800;
//canvas.height = 600;
//var context = canvas.getContext('2d');

//socket.on('state', function(players) {
//    context.clearRect(0, 0, 800, 600);
//    context.fillStyle = 'green';
//    for (var id in players) {
//        var player = players[id];
//        context.beginPath();
//        context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
//        context.fill();
//    }
//});