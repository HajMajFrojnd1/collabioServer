const mongoose = require("mongoose");
const { MONGODB_URI } = process.env; 

exports.connect = () => {
    mongoose.connect(MONGODB_URI, {
        dbName: "collabio"
    })
    .then(() => {
        console.log("Connected to database");
    })
    .catch((err) => {
        console.log("Error while connecting to database");
        console.error(err);
        process.exit(1);
    })
}