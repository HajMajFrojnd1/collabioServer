const mongoose = require('mongoose');

const ProjectCollaboratorSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Project"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    role: {
        type: String,
        required: true,
        default: "reader",
        enum: ["owner", "coowner", "editor", "reader"]
    }
});


const ProjectCollaborator = mongoose.models.ProjectCollaborator || mongoose.model("ProjectCollaborator", ProjectCollaboratorSchema);
module.exports = ProjectCollaborator;