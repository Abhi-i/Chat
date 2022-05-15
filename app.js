const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const files = __dirname + '/static'
console.log(files);
let db = {};
app.get('/', (req, res) => {
  res.sendFile(files + '/index.html');
});
app.get('/dashboard', (req, res) => {
  console.log(req);
  res.end();
})
io.on('connection', (socket) => {
    console.log('a user incoming with socketID : ', socket.id);
    socket.on('new-user', username => {
      try{
        if(db[username]){
          socket.emit("userExists");
          return socket.disconnect();
        }
        db[username] = socket.id;
        console.log(username, socket.id);
        socket.emit("connection-success", db, username);
        socket.broadcast.emit("other-user-connects", username, socket.id);
      } catch(error){
        console.log("error:" + error.name + ": " + error.message)
      }
    })
    socket.on("message-privately", (user, msg) => {
      try{
        if(db[user]){
          let sender;
          Object.keys(db).forEach(function(key){
            if (db[key] === socket.id) {
              sender = key;
              return;
            }
          })
          socket.to(db[user]).emit("private-message", sender, msg);
          console.log(`message sent by ${sender} to ${user}.`);
        }
        else socket.emit("error", user+" got disconnected earlier.")
      } catch (error) {
        console.log("error:" + error.name + ": " + error.message)
      }
    })
    socket.on('disconnect', () => {
      try {
        socket.broadcast.emit("other-user-disconnects")
        Object.keys(db).forEach(function(key){
          if (db[key] === socket.id) {
            console.log("disconnected: ", key, socket.id, )
            delete db[key];
            return;
          }
        });
      } catch (error) {
        console.log("error:" + error.name + ": " + error.message)
      }
    });
});
server.listen(3000, () => {
  console.log('listening on http://localhost:3000');
});