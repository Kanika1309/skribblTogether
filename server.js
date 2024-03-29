// var sitePath = process.argv[2] || ".";
const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config({path: './config.env'});
const port = 7000;
const express = require("express");
const { set } = require("./server/services");
const { setTimeout } = require("timers/promises");
const app = express();

mongoose.connect(process.env.CONN_STR);
mongoose.connection.once("open", () => {
    console.log("DATABASE CONNECTED!");
});

// const path = require('path');
app.set('view engine', 'ejs');
// app.set('views', 'myviews');

const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static('views'));

let team1players = []

var team1 = io.of('/team1Board');
team1
    .on("connect", (socket) => {
        // console.log("new ");
        team1players.push(socket)
        console.log(`${socket.id} has connected.`)

    socket.on("updateMembers", (data) => {
        team1players.forEach(con => {
            if(con.id !== socket.id){
                // console.log(data.user)
                return con.emit("onUpdateMembers", {user: data.user, team: data.team})
            }
        })
    }) 
    socket.on("draw", (data) => {
        // console.log(data)
        team1players.forEach(con => {
            if(con.id !== socket.id){
                // console.log({x: data.x, y: data.y});
                // io.of("board.html")
                return con.emit("ondraw", {x: data.x, y: data.y})
            }
        });
    });
    socket.on("down", () => {
        // console.log("down")
        team1players.forEach(con => {
            if(con.id !== socket.id){
                // console.log("ondown");
                // io.of("board.html")
                return con.emit("ondown")
            }
        })
    })

    socket.on("up", () => {
        // console.log("up")
        team1players.forEach(con => {
            if(con.id !== socket.id){
                // console.log("onup");
                // io.of("board.html")
                return con.emit("onup")
            }
        })
    })

    socket.on("clear", (data) => {
        let i=0;
        team1players.forEach(con => {
            if(con.id !== socket.id){
                // io.of("board.html")
                return con.emit("onclear", {w: data.w, h: data.h})
            }
        })
    })

    socket.on("start", () => {
        team1players.forEach(con => {
            if(con.id !== socket.id){
                // io.of("board.html")
                return con.emit("start",{})
            }else{
                return con.emit("self",{})
            }
        })
        let l=team1players.length;
        let timeLeft = (l-1) * 10;
        var timerId = setInterval(countdown, 1000);
        // console.log("timer")
        function countdown() {
            if (timeLeft == 0) {
                clearTimeout(timerId);
                team1.emit("timeup",{})
            } else {
                for(let i=1;i<l;i++){
                    if(((((i-1)*10)+1) <= timeLeft) && (timeLeft <= (i*10))){
                        if(timeLeft%10==0){
                            team1.emit("colorChange",{i: l-i+1});
                            for(let j=0;j<l;j++){
                                if(j==(l-i)){
                                    team1players[j].emit("canDraw");
                                }else{
                                    team1players[j].emit("canNotDraw");
                                }
                            }
                        }
                    }
                }
                if(timeLeft < 10) {
                    timeLeft = 0 + '' + timeLeft;
                }
                team1.emit("timer",{timeLeft: timeLeft})   
                timeLeft -= 1;
            }
        }
        // team1.emit("timer",{msg: `Players can start drawing!`, team1players: team1players})
    })
    
    socket.on("submit", () => {
        // console.log("submit")
        team1players.forEach(con => {
            return con.emit("onsubmit", "Game Over!");
        });
    });

    socket.on("disconnect", () => {
        console.log(`${socket.id} has disconnected.`)
        team1players = team1players.filter(con => con.id != socket.id);
    });

    })

app.use(express.json());
app.use('/api', require('./server/'));

// app.all('*', (req, res, next) => {
//     res.send(("PAGE NOT FOUND!!!", 404))
// })
// console.log(sitePath);
// console.log("Starting server in: " + __dirname + '/' + sitePath);

http.listen(port, function (res,err) { 
    console.log("Server running at: http://localhost:" + port)
});