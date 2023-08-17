require("dotenv").config();
require("./database/database").connect();

const http = require('http');
const app = require("./utils/configureExpress");
const io = require("./sockets/mainSocket");
const projectSocket = require("./sockets/projectSocket")(io);

const server = http.createServer(app);
const { API_PORT } = process.env;

server.listen(API_PORT, () => {
    console.log('listening on port ' + API_PORT);
});

io.listen(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
});