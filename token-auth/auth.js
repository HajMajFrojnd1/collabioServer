const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
	const token =
		req.body.token || req.query.token || req.headers["x-access-token"];

	if (!token) {
		return res.status(403).send({ message: "A token is required for authentication" });
	}
	try {
		const decoded = jwt.verify(token, config.ACESS_TOKEN_KEY);
		req.user = decoded;
	} catch (err) {
		return res.status(401).send({ message: "Invalid Token" });
	}
	return next();
};

const verifyTokenSocket = (socket, next) => {
	const token = socket.handshake.auth.token;

	if (!token) {
		let err = new Error("not authorized");
		err.data = { message: "No token recieved" };
		return next(err);
	}
	try {
		const decoded = jwt.verify(token, config.ACESS_TOKEN_KEY);
		socket.user = decoded;
		socket.token = token;
	} catch (err) {
		const e = new Error("not authorized");
		e.data = { message: "Invalid token" };
		return next(e);
	}
	return next();
};

module.exports = { verifyToken, verifyTokenSocket };