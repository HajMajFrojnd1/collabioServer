

const responseMessage = (res, status, message) => res.status(status).send({message: message});
const responseOptions = (res, status, options) => res.status(status).send(options);
const responseBoth = (res, status, message, options) => res.status(status).send({message: message, ...options});

module.exports = {responseMessage, responseOptions, responseBoth};