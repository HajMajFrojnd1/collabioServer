const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email already exists"],
    },
    password: {
        type: String,
    },
    token: {
        type: String
    }
})

UserSchema.pre("save", async function save(next){

    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error) {
        return next(error);
    }
});

//method to validate hashed password
UserSchema.methods.validatePassword = async function validatePassword(password){
    return bcrypt.compare(password, this.password);
}

const User = mongoose.models.User || mongoose.model("User", UserSchema);
module.exports = User;