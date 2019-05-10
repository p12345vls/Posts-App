var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin2: {type: Boolean, default: false},
    avatar: String,
    firstName:String,
    lastName: String,
    city:String,
    email:String,
    joinedSince: { type: Date, default: Date.now}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);