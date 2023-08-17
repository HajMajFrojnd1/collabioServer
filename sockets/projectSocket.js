const verifyTokenSocket = require("../token-auth/auth").verifyTokenSocket;
//returns parent namespace of project namespace
const registerProjectSocket = (io) => {

    const parentNamespace = io.of(/^\/socket\/project\/[a-zA-Z0-9]*$/);
    parentNamespace.use(verifyTokenSocket);


    parentNamespace.on("connection", (socket) => {
        const namespace = socket.nsp;
        console.log("User: " + socket.user.email + " connected to namespace " + namespace.name);

        socket.broadcast.emit("userConnected", {
            user: socket.user
        });

        socket.on("disconnect", () => {
            console.log("User: " + socket.user.email + " disconnected from namespace " + namespace.name);
            socket.broadcast.emit("userDisconnected", {
                user: socket.user
            });
        });

        socket.on("chatMessage", (message) => {
            console.log(message);
            socket.broadcast.emit("chatMessage", {
                user: socket.user,
                message: message,
                timestamp: Date.now()
            });
        });

    });



    return parentNamespace;
}

module.exports = registerProjectSocket;