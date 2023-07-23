const jwt = require("jsonwebtoken");
const UserToken = require("../models/userToken");
const serialize = require("cookie").serialize;

module.exports = async (user) => {

    try {

        const payload = {
            id: user._id,
            email: user.email
        };
    
        const acessToken = jwt.sign(
            payload,
            process.env.ACESS_TOKEN_KEY,
            {expiresIn: "14m"}
        )
    
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_KEY,
            {expiresIn: "30d"}
        )
    
        await UserToken.findOneAndRemove({userId: user._id});
    
        (await UserToken.create({
            userId: user._id,
            token: refreshToken
        })).save();
    
        return Promise.resolve({acessToken: acessToken, refreshToken: refreshToken});
        
    } catch (error) {
        return Promise.reject(error);
    }

}