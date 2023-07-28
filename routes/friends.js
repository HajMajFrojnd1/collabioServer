const router = require('express').Router();
const verifyToken = require("../token-auth/auth");
const FriendRequest = require("../models/friendRequest");
const User = require('../models/user');


router.use(verifyToken);

router.post("", async (req, res) => {

    const user = req.user;

    if(!user){
        return res.status(500).send({message:"Server error"});
    }

    try {
        const friendRequests = await FriendRequest.find({
            fromUser: user.id,
            accepted: true
        })
        .populate("fromUser", "email")
        .map(friendRequest => {
            return {
                email: friendRequest.fromUser.email,
                accepted: friendRequest.accepted,
                timestamp: friendRequest.timestamp
            }
        });
        
        const friendRequestsTwo = await FriendRequest.find({
            toUser: user.id,
            accepted: true
        })
        .populate("toUser", "email")
        .map(friendRequest => {
            return {
                email: friendRequest.toUser.email,
                accepted: friendRequest.accepted,
                timestamp: friendRequest.timestamp
            }
        });

        const friends = friendRequests.concat()
        
        const myFriendRequests = await FriendRequest.find({
            fromUser: user.id,
            accepted: false
        })
        .populate("toUser", "email");
        
        const pendingFriendRequests = await FriendRequest.find({
            toUser: user.id,
            accepted: false
        })
        .populate("fromUser", "email");
        

        res.status(201).send({
            message: "Fetching requests sucessfully.",
            friends: friends, 
            myFriendRequests: myFriendRequests,
            pendingFriendRequests: pendingFriendRequests
        });
    } catch (error) {
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
        return res.status(500).send({message:"Server error"});
    }

});

//accept friend
router.post("/friendRequests", async (req, res) => {

    const {requestId} = req.body;

    if(!requestId){
        return res.status(401).send({message: "Need a request id"});
    }

    try {
        const friendRequest = await FriendRequest.findById(requestId);

        if(!friendRequest){
            return res.status(404).send({message: "Friend request doesnt exit!"});
        }
    
        friendRequest.accepted = true;
        friendRequest.save();

        return res.status(200).send({
            message: "Friend request successfully accepted",
            friendRequest: friendRequest
        });
        
    } catch (error) {
        return res.status(500).send({message:"Server error"});
    }
});

router.post("/sendRequest", async (req, res) => {

    const {user} = req;
    const {userEmail} = req.body;

    if(!userEmail){
        return res.status(404).send({message: "Didnt supply users email address."});
    }
    
    try {

        const friend = await User.findOne({email: userEmail});

        if(!friend){
            return res.status(404).send({message: "User with specified email doesnt exist"});
        }

        const friendRequest = new FriendRequest({
            fromUser: user.id,
            toUser: friend._id,
            accepted: false
        });

        await friendRequest.save();

        return res.status(200).send({
            message: "Friend request successfully created!",
            friendRequest: friendRequest
        });
    } catch (error) {
        return res.status(500).send("Server error");
    }
});

module.exports = router;