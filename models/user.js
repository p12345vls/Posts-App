var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    // avatar: { type: String, default: 'https://www.mycustomer.com/sites/all/modules/custom/sm_pp_user_profile/img/default-user.png' },
    avatar: String,
    firstName:String,
    lastName: String,
    city:String,
    email:String,
    joinedSince: { type: Date, default: Date.now}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);