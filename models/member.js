var mongoose = require("mongoose");

var MemberSchema = new mongoose.Schema({
    name: String,
    lastname:String,
    role: String,
    address:String,
    email:{type:String, unique:true},
    phone:String
});


module.exports = mongoose.model("Member", MemberSchema);