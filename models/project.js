const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    privacy: {
        type: String,
        required: true,
        enum: ["private", "public"]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now()
    }
});


const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);
module.exports = Project;