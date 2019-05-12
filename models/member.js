var mongoose = require("mongoose");

var MemberSchema = new mongoose.Schema({
    name: String,
    lastname:String,
    role: String,
    address:String
});


module.exports = mongoose.model("Member", MemberSchema);