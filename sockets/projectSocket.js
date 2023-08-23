const verifyTokenSocket = require("../token-auth/auth").verifyTokenSocket;
const FileObject = require("../models/fileObject");
const Project = require("../models/project");
//returns parent namespace of project namespace

const registerProjectSocket = (io) => {

    const fileTrees = {};

    const parentNamespace = io.of(/^\/socket\/project\/[a-zA-Z0-9]*$/);
    parentNamespace.use(verifyTokenSocket);

    parentNamespace.on("connection", async (socket) => {
        const namespace = socket.nsp;
        console.log("User: " + socket.user.email + " connected to namespace " + namespace.name);

        
        if(!fileTrees[namespace.name]){
            try {
                const namespaceProject = await Project.findById(namespace.name.split("/")[3]);
                const projectFileTree = await FileObject.find({project: namespaceProject._id});
                fileTrees[namespace.name] = projectFileTree;
                socket.emit("fileTree", projectFileTree);
            } catch (error) {
                console.log(error);
            }
        }


        socket.broadcast.emit("userConnected", {
            user: socket.user
        });

        socket.on("disconnect", () => {
            console.log("User: " + socket.user.email + " disconnected from namespace " + namespace.name);
            socket.broadcast.emit("userDisconnected", {
                user: socket.user
            });

            if(!namespace.sockets.size){
                delete fileTrees[namespace.name];
            }

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