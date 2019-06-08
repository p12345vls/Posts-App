var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
    name: String,
    image: [{
        type: String
    }],
    video:String,
    description: String,
    createdAt: { type: Date, default: Date.now},
    author: {
        id: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("Post", postSchema);