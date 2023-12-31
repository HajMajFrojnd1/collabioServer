const jwt = require("jsonwebtoken");


const verifyAcessTokenRoute = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers["x-access-token"];
  
    if (!token) {
      return res.status(403).send({message: "A token is required for access"});
    }
    try {
      const decoded = jwt.verify(token, process.env.ACESS_TOKEN_KEY);
      req.user = decoded;
    } catch (err) {
      return res.status(401).send({message: "Invalid Token"});
    }
    return next();
  };
  
  module.exports = verifyAcessTokenRoute;