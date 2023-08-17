const express = require('express');

const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRouter = require("../routes/auth");
const friendsRouter = require("../routes/friends");
const projectsRouter = require("../routes/projects");
const projectRouter = require("../routes/project");

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use("", authRouter);
app.use("/friends", friendsRouter);
app.use("/projects", projectsRouter);
app.use("/project", projectRouter);

module.exports = app;