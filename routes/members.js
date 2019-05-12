var express = require('express');
var router = express.Router({mergeParams: true});
var Member = require('../models/member');
var locus = require('locus');

var isAdmin = false;

//INDEX - show all members
router.get("/", (req, res) => {

    Member.find({}, null, {sort: {lastname: 1}}, (err, members) => {

        if (err) {
            console.log(err);
        } else {
            // eval(locus);
            res.render("members/index", {members: members});
        }
    });
});

router.post('/', (req, res) => {

    Member.create(req.body.member, function (err, member) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        } else {
            res.render('landing', {message: 'Welcome to Hellenic American Hippocratic Society ' + req.body.member.name + '!'})
        }
    });
});


module.exports = router;
