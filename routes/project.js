const router = require('express').Router();
const verifyToken = require("../token-auth/auth").verifyToken;
const User = require('../models/user');
const Project = require('../models/project');
const ProjectCollaborator = require('../models/projectCollaborator');
const FileObject = require('../models/fileObject');
const conn = require("mongoose").connection;
const {responseMessage, responseOptions, responseBoth} = require("../utils/responseUtils");

router.use(verifyToken);





module.exports = router;