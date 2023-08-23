const router = require('express').Router();
const verifyToken = require("../token-auth/auth").verifyToken;
const FriendRequest = require("../models/friendRequest");
const User = require('../models/user');
const emailRegex = require('../utils/regexes').emialRegex;
const friendsUtils = require('../utils/friendsUtils');
const ProjectCollaborator = require('../models/projectCollaborator');

router.use(verifyToken);

router.post("", async (req, res) => {

    const user = req.user;
    

    try {
        const friendRequests = (await FriendRequest.find({
            fromUser: user.id,
            accepted: true
        })
        .populate("toUser", "email firstName lastName"))
        .map(friendRequest => friendsUtils.formatFriendRequest(friendRequest, "toUser"));

        const friendRequestsTwo = (await FriendRequest.find({
            toUser: user.id,
            accepted: true
        })
        .populate("fromUser", "email firstName lastName"))
        .map(friendRequest => friendsUtils.formatFriendRequest(friendRequest, "fromUser"));

        const friends = friendRequests.concat(friendRequestsTwo);
        
        const myFriendRequests = (await FriendRequest.find({
            fromUser: user.id,
            accepted: false
        })
        .populate("toUser", "email"))
        .map(friendRequest => friendsUtils.formatFriendRequest(friendRequest, "toUser"));
        
        const pendingFriendRequests = (await FriendRequest.find({
            toUser: user.id,
            accepted: false
        })
        .populate("fromUser", "email"))
        .map(friendRequest => friendsUtils.formatFriendRequest(friendRequest,"fromUser"));
        

        res.status(201).send({
            message: "Fetching requests sucessfully.",
            friends: friends, 
            myFriendRequests: myFriendRequests,
            pendingFriendRequests: pendingFriendRequests
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({message:"Server error"});
    }

});


router.delete("/friendRequests", async (req, res) => {

    const {requestId} = req.body;

    if(!requestId){
        return res.status(401).send({message: "Need a request id"});
    }

    try {
        await FriendRequest.findByIdAndRemove(requestId);

        return res.status(200).send({message: "Request deleted successfully"});
    } catch (error) {
        console.error(error);
        return res.status(500).send({message:"Server error"});
    }

});

//accept friend
router.post("/friendRequests", async (req, res) => {

    const {requestId} = req.body;
    const {user} = req;

    if(!requestId){
        return res.status(401).send({message: "Need a request id"});
    }

    try {
        const friendRequest = await FriendRequest.findById(requestId).populate("fromUser", "email firstName lastName").populate("toUser", "email firstName lastName");

        if(friendRequest.fromUser._id === user.id){
            return res.status(400).send({message: "You cant accept request created by yourself"});
        }

        if(!friendRequest){
            return res.status(404).send({message: "Friend request doesnt exit!"});
        }
    
        friendRequest.accepted = true;
        friendRequest.save();

        return res.status(200).send({
            message: "Friend request successfully accepted",
            friendRequest: friendsUtils.formatFriendRequest(friendRequest, req.user.id === friendRequest.toUser._id ? "fromUser" : "toUser")
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).send({message:"Server error"});
    }
});

router.post("/sendRequest", async (req, res) => {

    const {user} = req;
    const {userEmail} = req.body;

    
    if(!userEmail){
        return res.status(404).send({message: "Didnt supply users email address."});
    }
    
    if (!userEmail.match(emailRegex)){
        return res.status(404).send({message: "Wrong format of email adress."});
    }
    
    try {

        const friend = await User.findOne({email: userEmail});

        if(!friend){
            return res.status(404).send({message: "User with specified email doesnt exist"});
        }

        const friendRequestExists = await FriendRequest.findOne({fromUser: user.id, toUser: friend._id}) || await FriendRequest.findOne({fromUser: friend._id, toUser: user.id})

        if (friendRequestExists){
            if(friendRequestExists.accepted === true){
                return res.status(400).send({message: "Users are already friends"});
            }
            return res.status(400).send({message: "There is a pending requst between users"});
        }

        const friendRequest = new FriendRequest({
            fromUser: user.id,
            toUser: friend._id,
            accepted: false
        });

        await friendRequest.save();

        await friendRequest.populate("toUser", "email");

        return res.status(200).send({
            message: "Friend request successfully created!",
            friendRequest: friendsUtils.formatFriendRequest(friendRequest, "toUser")
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({messasge: "Server error"});
    }
});

const includesFill = (id, array) => {
    for (let i =0; i< array.length; i++) 
        if (array[i] === id) return true;

    return false;
};

router.post("/friendsOnly", async (req, res) => {

    const user = req.user;
    const {projectId} = req.body;

    try {

        const collaborators = (await ProjectCollaborator.find({project: projectId})).map(collaborator => collaborator.user.toString());
        const friendRequests = (await FriendRequest.find({
            fromUser: user.id,
            accepted: true
        })
        .populate("toUser", "email firstName lastName"))
        .map(friendRequest => friendsUtils.formatFriendRequest(friendRequest, "toUser"));
        
        const friendRequestsTwo = (await FriendRequest.find({
            toUser: user.id,
            accepted: true
        })
        .populate("fromUser", "email firstName lastName"))
        .map(friendRequest => friendsUtils.formatFriendRequest(friendRequest, "fromUser"));

        const friends = friendRequests.concat(friendRequestsTwo).filter(friend => !collaborators.includes(friend.user._id.toString()));
        
        res.status(201).send({
            message: "Fetching requests sucessfully.",
            friends: friends
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({message:"Server error"});
    }

});

module.exports = router;