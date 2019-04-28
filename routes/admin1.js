var express = require('express');
var router = express.Router({mergeParams: true});
var Member = require('../models/member');
var locus = require('locus');


// login admin for members in Hellenic American Hippocratic
var isAdmin = false;
router.get('/', function (req, res) {
    res.render('adminLogin', {isAdmin: isAdmin, message: ""})
});

router.post('/', function (req, res) {
    var message = "";
    if (req.body.password === 'secure') {
        isAdmin = true;

        Member.find({}, (err, members) => {
            if (err) {
                console.log(err);
            } else {
                res.render('members/admin', {members: members, isAdmin: isAdmin, message: message})
            }
        });
    } else {
        message = 'wrong password please try again';
        res.render('adminLogin', {isAdmin: false, message: message})
    }
});

router.get('/members', function (req, res) {
    var message = "";
    if (isAdmin) {

        Member.find({}, (err, members) => {
            if (err) {
                console.log(err);
            } else {
                res.render('members/admin', {members: members, isAdmin: isAdmin, message: message})
            }
        });
    } else {
        message = 'wrong password please try again';
        res.render('adminLogin', {isAdmin: false, message: message})
    }
});


router.post('/newMember', function (req, res) {
    if (isAdmin) {
        Member.create(req.body, function (err, member) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            } else {
                Member.find({}, (err, members) => {
                    res.render('members/admin', {members: members, isAdmin: isAdmin, message: ''})
                })
            }
        });
    }
});
//NEW - show form to create new member
router.get("/new", function (req, res) {
    if (isAdmin) {
    res.render("members/new");
    }else{
        res.render('adminLogin', {isAdmin: false, message: ''})
    }
});

router.get('/logoutAdmin', (req, res) => {

    res.render('adminLogin', {isAdmin: false,message:"logged out"});
});

module.exports = router;