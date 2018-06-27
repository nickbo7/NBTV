var socket = io();

var host = false;

var player = false;

var username = null;

var room = null;

var roomInfo = null;

var scoreList = [];

var winner;

var id;

document.getElementById("info").style.display = 'none';
document.getElementById("roomid").style.display = 'none';
document.getElementById("playerList").style.display = 'none';
document.getElementById("host").style.display = 'none';
document.getElementById("gameForm").style.display = 'none';
document.getElementById("topNav").style.display = 'none';
document.getElementById("gameFooter").style.display = 'none';
document.getElementById("button-submit").style.display = 'none';
document.getElementById("button-restart").style.display = 'none';
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
//    host = true;
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
//    player = true;
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

//restart game button
document.getElementById("button-restart").addEventListener('click', function() {
    socket.emit('restartGame', room);
});

//var id;

socket.on('timerStart', function(time) {
//    document.getElementById("timer").style.display = 'block';
    document.getElementById("myBar").style.display = 'block';
//    document.getElementById("myBar").style.width = 0;
    function progressBar() {
        var elem = document.getElementById("myBar");   
        var width = 0;        
        id = setInterval(frame, time);       
        function frame() {
            if (width >= 100) {
              clearInterval(id);            
            } else {
              width++;
              elem.style.width = width + '%';
            }
        }
    }
    progressBar();
});

//socket.on('timerStop', function() {
////    document.getElementById("myBar").style.display = 'none';
//    id = 0;
////    document.getElementById("myBar").style.width = 0;
//});

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
            if (games[x].host.id === username) {
                host = true;
            } else {
                for (var y in games[x].players) {
                    if (games[x].players[y].id === username) {
                        player = true;
                    }
                }
            }
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
            if (games[x].players.length === 0) {
                document.getElementById("button-start").disabled = true;
                document.getElementById("button-start").value = "Waiting...";
            } else if (games[x].players.length > 0 && host === true){
                document.getElementById("button-start").disabled = false;    
                document.getElementById("button-start").value = "START";
            } else if (player === true) {
                document.getElementById("button-start").disabled = true;
                document.getElementById("button-start").value = "Waiting...";
            } else {
                document.getElementById("button-start").disabled = true;
                document.getElementById("button-start").value = "Waiting...";
            }
        }
    }
});

//game start
socket.on('beginGame', function(prompt) {
    document.getElementById('button-start').style.display = 'none';
    document.getElementById('button-submit').style.display = 'block';
    document.getElementById('gameForm').style.display = 'block';
    document.getElementById('button-submit').disabled = false;
    document.getElementById('button-submit').innerHTML = "SUBMIT";
    document.getElementById('response').style.display = 'inline-block';
    document.getElementById('response').value = "";
    document.getElementById('card').style.display = 'block';
    document.getElementById('prompt').innerHTML = prompt;
    document.getElementById('vote').style.display = 'none';
//    var msg = new SpeechSynthesisUtterance(prompt);
//    window.speechSynthesis.speak(msg);
});

socket.on('restart', function() {
//    var scores = document.getElementById("scores");
//    scores.removeChild(scores.firstChild);
    scoreList = [];
    document.getElementById("winner").style.display = 'none';
    document.getElementById("button-restart").style.display = 'none';
    document.getElementById("button-submit").value = "SUBMIT";
    document.getElementById("scores").innerHTML = "";
    document.getElementById("winner").innerHTML = "";
//    document.getElementById("response").style.display = 'inline-block';
//    document.getElementById("scoreCard").style.display = 'none';
//    document.getElementById("gameForm").style.display = 'block';
    console.log("restarting...");
    socket.emit('startGame', room);
});

socket.on('beginVote', function(games) {
    document.getElementById('timer').style.display = 'block';
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
                    answerList.push("<li><a href=\"#\">" + games[x].players[y].answers[0] + "</a></li>");
                }
            } else if (player === true) {
                answerList.push("<li><a href=\"#\">" + games[x].host.answers[0] + "</a></li>");
                for (var y in games[x].players) {
                    if (games[x].players[y].id === username) {
                    } else {                        
                        answerList.push("<li><a href=\"#\">" + games[x].players[y].answers[0] + "</a></li>");
                    }
                }                
            } else if (host === false && player === false) {
                answerList.push("<li><a href=\"#\">" + games[x].host.answers[0] + "</a></li>");
                for (var y in games[x].players) {
                    answerList.push("<li><a href=\"#\">" + games[x].players[y].answers[0] + "</a></li>");
                }
            }
        }
    }
    var voteButtons = document.getElementById('vote-buttons');
    voteButtons.innerHTML = answerList.join("\n");
});


socket.on('beginScore', function(games, room) {
    clearInterval(id);
    document.getElementById("button-start").style.display = 'none';
    document.getElementById("button-submit").style.display = 'block';
    document.getElementById("button-submit").disabled = true;
    document.getElementById("button-submit").value = "Waiting...";
    document.getElementById("card").style.display = 'none';
    document.getElementById("timer").style.display = 'block';
    document.getElementById("scoreCard").style.display = 'block';    
    for (var x in games) {
        if (games[x].room_id === room) {
            scoreList.push({"id": games[x].host.id, "score": games[x].host.score});
            console.log(games[x].host.id + " score: " + games[x].host.score);
            for (var y in games[x].players) {
                scoreList.push({"id": games[x].players[y].id, "score": games[x].players[y].score});
                console.log(games[x].players[y].id + " score: " + games[x].players[y].score);            
            }
        }
    }    
    scoreList.sort(function(a, b) {
        return b.score - a.score;        
    });
    for (var i = 0; i < scoreList.length; i++) {
        var name = document.createElement("name");
        name.innerHTML = scoreList[i].id + ": ";
        document.getElementById("scores").appendChild(name);
        var score = document.createElement("score");
        score.innerHTML = scoreList[i].score + " ";
        document.getElementById("scores").appendChild(score);
    }
    //need function for tie game
    winner = scoreList[0];
});

socket.on('nextRound', function(prompt) {
    scoreList = [];
    document.getElementById("scores").innerHTML = null;
    document.getElementById("scoreCard").style.display = 'none';
//    document.getElementById("timer").style.display = 'none';
    clearInterval(id);
    document.getElementById("vote").style.display = 'none';
    document.getElementById("button-start").style.display = 'none';
    document.getElementById('prompt').innerHTML = prompt;
    if (player === true || host === true) {
        document.getElementById("card").style.display = 'block';
        document.getElementById("response").style.display = 'inline-block';
        document.getElementById("response").value = "";
        document.getElementById("button-submit").style.display = 'block';
        document.getElementById("button-submit").disabled = false;
        document.getElementById("button-submit").value = "SUBMIT";    
    } else {
        document.getElementById("button-submit").style.display = 'block';
        document.getElementById("button-submit").disabled = true;
        document.getElementById("button-submit").value = "Waiting...";
    }
    //    var msg = new SpeechSynthesisUtterance(prompt);
//    window.speechSynthesis.speak(msg);
});

socket.on('endGame', function() {
    document.getElementById("winner").style.display = 'block';
    document.getElementById("timer").style.display = 'none';
    document.getElementById("scoreCard").style.display = 'none';
    document.getElementById("button-submit").style.display = 'none';
    document.getElementById("button-restart").style.display = 'block';
    if (player === true) {
        document.getElementById("button-restart").disabled = true;
        document.getElementById("button-restart").value = "Waiting...";
    }
//    document.getElementById("name").style.display = 'none';
    var win = document.createElement("win");
    win.innerHTML = "Winner! " + winner.id + ": " + winner.score;
    document.getElementById("winner").appendChild(win);
//    for (var x in games) {
//        if (games[x].room_id === room) {
//            getWinner();
//        }
//    }
    console.log("Winner " + winner.id + ": " + winner.score);
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
//    document.getElementById("timer").style.display = 'none';
    document.getElementById("vote").style.display = 'none';
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