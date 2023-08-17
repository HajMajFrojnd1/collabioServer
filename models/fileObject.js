const mongoose = require("mongoose");

const FileObjectSchema = new mongoose.Schema({
    path: {
        type: String,
        unique: true
    },
    type: {
        type: Number,
        required: true,
        enum: [0,1]
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    }
});

const FileObject = mongoose.models.FileObject || mongoose.model("FileObject", FileObjectSchema);
module.exports = FileObject;