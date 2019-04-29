var express = require('express');
var router = express.Router({mergeParams: true});
var Member = require('../models/member');
var locus = require('locus');

var isAdmin = false;

//INDEX - show all members
router.get("/", (req, res) => {

    Member.find({}, null, {sort: {name: 1}}, (err, members) => {

        if (err) {
            console.log(err);
        } else {
            // eval(locus);
            res.render("members/index", {members: members});
        }
    });
});


module.exports = router;
