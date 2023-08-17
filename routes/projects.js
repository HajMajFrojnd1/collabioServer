const router = require('express').Router();
const verifyToken = require("../token-auth/auth").verifyToken;
const User = require('../models/user');
const Project = require('../models/project');
const ProjectCollaborator = require('../models/projectCollaborator');
const conn = require("mongoose").connection;
const {responseMessage, responseOptions, responseBoth} = require("../utils/responseUtils");

router.use(verifyToken);

router.post("", async (req, res) => {

    const {user} = req;
    const {projectName, privacy} = req.body;

    if(!user) return responseMessage(res, 401, "Invalid user information");
    if(!projectName || !privacy) return responseMessage(res, 401, "Missing project name or privacy information");

    const projectExists = await Project.findOne({name: projectName});

    if(projectExists) return responseMessage(res, 401, "Project with this name already exists");

    try {
        
        const session = await conn.startSession();

        let project = null;
        await session.withTransaction(async () => {

            const _project = (await Project.create([{
                name: projectName,
                privacy: privacy,
                owner: user.id
            }], {session}))[0];
    
            await _project.populate("owner", "firstName lastName");
    
            await ProjectCollaborator.create([{
                project: _project._id,
                user: user.id,
                role: "owner"
            }], {session});
    
            project = _project;
            return _project;
        });

        
        session.endSession();

        res.status(201).send({
            message: "Project created successfully", 
            project: project
        });

    } catch (error) {
        console.error(error);

        await session.abortTransaction();
        session.endSession();

        return res.status(500).send({message: "Server error"});
    }
});

router.delete("", async (req, res) => {

    const {user} = req;
    const {projectId} = req.body;

    try {
        
        const projectExists = await Project.findById(projectId);
        const projectCollaboratorExists = await ProjectCollaborator.findOne({
            project: projectId,
            user: user.id
        });
    
        if(!projectExists) return res.status(401).send({message: "Project doesn't exist."});
        if(!projectCollaboratorExists) return res.status(401).send({message: "User not associated with project."});
        if(projectCollaboratorExists.role !== "owner") return res.status(403).send({message: "User does not have permission to delete project."});
    

        const session = await conn.startSession();

        await session.withTransaction(async () => {

            await ProjectCollaborator.deleteMany({
                project: projectId
            });
            await Project.findByIdAndDelete(projectId);

        });

        session.endSession();

        return res.status(201).send({message: "Project sucessfully deleted"});
    } catch (error) {
        console.error(error);
        return res.status(500).send({message: "Server error."});
    }

});

router.post("/userProjects", async (req, res) => {

    const {user} = req;

    try {
        
        const collaborations = await ProjectCollaborator.find({
            user: user.id
        }).populate([{
            path: "project",
            model: "Project",
            select: "name privacy timestamp",
            populate: {
                path: "owner",
                model: "User",
                select: "firstName lastName"
            }
        }]);

        if (!collaborations) return res.status(401).send({
            message: "No projects found", 
            myProjects: [], 
            latestEdits: []
        });

        const projects = collaborations.map((collaboration) => {
            return {
                ...collaboration.project._doc,
                user: collaboration.user,
                role: collaboration.role,
            }
        });

        return res.status(201).send({
            message: "Projects found", 
            myProjects: projects, 
            latestEdits: projects
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({message: "Server error."});
    }

});

router.post("/project/:project", async (req, res) => {

    const {user} = req;
    const {projectId} = req.body;

    if(!projectId) return res.status(401).send({message: "Project id not defined"});

    try {
        
        const project = await Project.findById(projectId).populate("owner", "firstName lastName email");
        if(!project) return res.status(404).send({message: "Project doesnt exist"});

        const userCollaborator = await ProjectCollaborator.findOne({user: user.id});
        if(project.privacy === "private" && !userCollaborator) return res.status(403).send({message: "Access to this project is restricted"});

        const collaborators = (await ProjectCollaborator.find({project: projectId})
            .populate("user", "firstName lastName email")
        );

        return res.status(201).send({
            message: "Successfully fetched project information",
            project: {
                ...project._doc,
                collaborators: collaborators,
                user: userCollaborator
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({message: "Server error."});
    }

});

router.post("/addCollaborator", async (req, res) => {

    const {user} = req;
    const {email, projectId, role} = req.body;

    if(!email || !projectId || !role) return res.status(404).send({message: "Missing required information"});

    try {
        
        const userPermission = await ProjectCollaborator.findOne({project: projectId, user: user.id});

        if(!userPermission || !(userPermission.role === "owner" || userPermission.role === "coowner")) return res.status(403).send({message: "You are not authorized to add collaborators to this project"});

        const _user = await User.findOne({email: email});
        const collaboratorExists = await ProjectCollaborator.findOne({projectId: projectId, user: _user._id});
        if(collaboratorExists) return res.status(401).send({message: "User is already a collaborator"});
        
        const collaborator = new ProjectCollaborator({
            user: _user._id,
            role: role,
            project: projectId
        });

        await collaborator.save();
        await collaborator.populate("user", "firstName lastName email");
        
        return res.status(201).send({
            message: "Succesfuly added user as collaborator.",
            collaborator: collaborator
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({messasge: "Server error"});
    }


});

router.delete("/addCollaborator", async (req, res) => {

    const {user} = req;
    const {collaboratorId, projectId} = req.body;

    if(!collaboratorId || !projectId) return responseMessage(res,404, "Missing required information");

    try {
        
        const userPermission = await ProjectCollaborator.findOne({project: projectId, user: user.id});

        if(!userPermission || !(userPermission.role === "owner" || userPermission.role === "coowner")){
            return responseMessage(res,403, "You are not authorized to delete collaborators from this project");
        }
        
        const collaborator = await ProjectCollaborator.findOne({project: projectId, user: collaboratorId});
        
        if(!collaborator) return responseMessage(res,404, "Collaborator is not part of the project.");

        if(collaborator.role === "owner") responseMessage(res,400, "You can not remove the owner of the project"); 

        await ProjectCollaborator.findByIdAndDelete(collaborator._id);

        return responseMessage(res, 201, "Succesfuly deleted collaborator.");

    } catch (error) {
        console.error(error);
        return responseMessage(res, 500, "Server error");
    }


});

module.exports = router;