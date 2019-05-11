var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type:String, unique:true, required:true},
    password: String,
    isAdmin2: {type: Boolean, default: false},
    avatar: String,
    firstName:String,
    lastName: String,
    city:String,
    email:{type:String, unique:true, required:true},
    resetPasswordToken:String,
    resetPasswordExpires:Date,
    joinedSince: { type: Date, default: Date.now}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);