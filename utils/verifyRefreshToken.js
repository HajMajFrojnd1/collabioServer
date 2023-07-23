const UserToken = require("../models/userToken");
const jwt = require("jsonwebtoken");


module.exports = (refreshToken) => {

    return new Promise(async (resolve, reject) => {
        try {
            let userToken = await UserToken.findOne({
                token: refreshToken
            }); 
            if(!userToken) return reject("Invalid refresh token");
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, tokenDetails) => {
                if (err) return reject(err);

                return resolve(tokenDetails);
            })

        } catch (error) {
            return reject(error);
        }
    });

};
