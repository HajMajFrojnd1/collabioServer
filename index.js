require("dotenv").config();
require("./database/database").connect();

const http = require('http');
const express = require('express');

const jwt = require("jsonwebtoken");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const serialize = require("cookie").serialize;

const generateTokens = require("./utils/generateTokens");
const verifyRefreshToken = require("./utils/verifyRefreshToken");
const verifyAcessTokenRoute = require("./utils/verifyAcessTokenRoute");

const User = require("./models/user");
const UserToken = require("./models/userToken");

const validation = require("./utils/validation");

const friendsRouter = require("./routes/friends");

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use("/friends", friendsRouter);

app.post("/register", async (req, res) => {
    try {
        const {firstName, lastName, email, password, confirmPassword } = req.body;

        if (!(email && password && firstName && lastName && confirmPassword)) {
            return res
                .status(400)
                .send({message: "All input is required"});
        }

        const errorMessages = validation.validateRegistration(
            firstName, 
            lastName,
            email, 
            password, 
            confirmPassword
        );

        if(errorMessages.length > 0) {
            return res
                .status(400)
                .send({message: errorMessages});
        }

        const oldUser = await User.findOne({email: email});

        if (oldUser){
            return res
                .status(409)
                .send({message: "Email already in use"});
        }

        const user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: password
        });
        user.save();

        const {acessToken, refreshToken} = await generateTokens(user);

        const serialized = serialize(
            "token", 
            refreshToken, 
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30*86400,
                path: '/',
            }
        )
        res.setHeader("Set-Cookie", serialized);

        return res
            .status(201)
            .send({
                message: "Registration sucessful.",
                acessToken: acessToken
            });

    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .send({message: "Server error"});
    }
});

app.post("/login", async (req, res) => {

    try {

        
        const {email, password } = req.body;

        if (!(email && password)) {
            return res
            .status(400)
            .send({message: "Missing input"});
        }
        
        const user = await User.findOne({email: email});

        if (user && user.validatePassword(password)) {
            
            const {acessToken, refreshToken} = await generateTokens(user);

            const serialized = serialize(
                "token", 
                refreshToken, 
                {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 30*86400,
                    path: '/',
                }
            )
            
            res.setHeader("Set-Cookie", serialized);

            return res
                .status(200)
                .send({
                    message: "Login sucessful",
                    acessToken: acessToken
                });
        }


        return res
            .status(401)
            .send({message: "Wrong email or password"});
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .send({message: "Server error"});
    }

});

app.post("/refreshToken", async (req, res) => {

    const {token} = req.cookies;
    if(!token) return res.status(401).send({message: "Refresh token doesnt exist"});


    try {
        
        const details = await verifyRefreshToken(token)
    
        const payload = {
            id: details.id,
            email: details.email
        }
    
        const acessToken = jwt.sign(
            payload,
            process.env.ACESS_TOKEN_KEY,
            {
                expiresIn: "14m"
            }
        );
    
        return res.status(200).send({
            acessToken: acessToken,
            message: "Refresh token still valid"
        });
        
    } catch (error) {
        console.error(error);
        return res.status(401).send({
            message: "Refresh token invalid"
        })
    }




});

app.delete("/refreshToken", async (req,res) => {

    const {token} = req.cookies;

    try {
        await UserToken.findOneAndRemove({token: token});
        const serialized = serialize(
            "token", 
            null, 
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: -1,
                path: '/',
            }
        )
        res.setHeader("Set-Cookie", serialized);
        return res.status(200).send({
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: "Server error"
        });
    }



});



app.post("/authTry", verifyAcessTokenRoute, (req, res) => {

    const {user} = req;
    res.status(200).send({user: user});

});

const server = http.createServer(app);
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

server.listen(port, () => {

    console.log('listening on port ' + port);

});