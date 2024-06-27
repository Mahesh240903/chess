const express = require('express')
const app =express()
const socket = require('socket.io')
const http = require('http')
const { Chess } = require('chess.js')
const path = require('path')

const server=http.createServer(app);
//socket requires http server which is based on express server
const io = socket(server);

//all rules of chess is now in chess-const from chess.js
const chess=new Chess();
let players={};
let currentPlayer="w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")))

app.get('/',(req,res)=>{
    res.render('index')
})

io.on("connection",function(uniquesocket){
    console.log("connected");
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
        io.emit("render","yes")
    }else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    })

    uniquesocket.on("move",(move)=>{
        try{
            if(chess.turn()==='w' && uniquesocket.id !=players.white)   return;
            if(chess.turn()==='b' && uniquesocket.id !=players.black)   return;
            
            const result = chess.move(move)
            if(chess.isGameOver()){
                io.emit("gameover","true")
            }
            if(result){
                currentPlayer=chess.turn();
                io.emit("move",move);
                //FEN->current state of board
                io.emit("boardState",chess.fen())
            }
            else{
                console.log("Invalid move:",move);
                uniquesocket.emit("Invalid move:",move);
            }
        }
        catch(err){
            console.log(err);
            uniquesocket.emit("Invalid move",move);
        }
    })
})



server.listen(3000/*,function(){
    console.log("listening on port 3000");
}*/)