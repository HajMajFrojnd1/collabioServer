const verifyTokenSocket = require("../token-auth/auth").verifyTokenSocket;
const FileObjectType = require("../enums/fileObjectType");
const FileObject = require("../models/fileObject");
const Project = require("../models/project");
//returns parent namespace of project namespace

const registerProjectSocket = (io) => {

    const fileTrees = {};

    const parentNamespace = io.of(/^\/socket\/project\/[a-zA-Z0-9]*$/);
    parentNamespace.use(verifyTokenSocket);

    parentNamespace.on("connection", async (socket) => {
        const namespace = socket.nsp;
        const projectId = namespace.name.split("/")[3];
        
        console.log("User: " + socket.user.email + " connected to namespace " + namespace.name);

        
        if(!fileTrees[namespace.name]){
            try {
                const namespaceProject = await Project.findById(projectId);
                const projectFileTree = await FileObject.find({project: namespaceProject._id});
                fileTrees[projectId] = projectFileTree;
                socket.emit("fileTree", projectFileTree.map(fileObject =>fileObject.path));
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
                delete fileTrees[projectId];
            }

        });

        socket.on("chatMessage", (message) => {
            socket.broadcast.emit("chatMessage", {
                user: socket.user,
                message: message,
                timestamp: Date.now()
            });
        });

        socket.on("fileTree", async (change) => {
            try {
                if(change.type === FileObjectType.remove){

                }else{

                    const fileObject = new FileObject({
                        path: change.path,
                        type: change.type,
                        project: projectId
                    });

                    await fileObject.save();

                    fileTrees[projectId].push(fileObject);
                    socket.broadcast.emit("fileTree", fileTrees[projectId].map(fileObject => fileObject.path));

                }
            } catch (error) {
                console.log(error);
            }
        });

    });



    return parentNamespace;
}

module.exports = registerProjectSocket;