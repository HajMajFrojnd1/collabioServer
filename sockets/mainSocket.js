const { Server } = require("socket.io");
const io = new Server({});

io.on("connection", (socket) => {
    console.log("connected");
});

io.on("disconnect", (socket) => {
    console.log("disconnected");
});

module.exports = io;


