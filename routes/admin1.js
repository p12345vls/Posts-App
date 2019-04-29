var express = require('express');
var router = express.Router({mergeParams: true});
var Member = require('../models/member');
var locus = require('locus');


// login admin for members in Hellenic American Hippocratic
var isAdmin = false;
router.get('/', (req, res) => {
    res.render('adminLogin', {isAdmin: isAdmin, message: ""})
});

router.post('/', (req, res) => {

    if (req.body.password === 'secure') {
        isAdmin = true;

        Member.find({}, (err, members) => {
            if (err) {
                console.log(err);
            } else {
                res.render('members/admin', {members: members, isAdmin: isAdmin, message: ''})
            }
        });
    } else {
        isAdmin = false;
        message = 'wrong password please try again';
        res.render('adminLogin', {isAdmin: false, message: message})
    }
});

router.get('/members', (req, res) => {
    var message = "";
    if (isAdmin) {
        Member.find({}, (err, members) => {
            if (err) {
                console.log(err);
            } else {
                res.render('members/admin', {members: members, isAdmin: isAdmin, message: ''})
            }
        });
    } else {
        isAdmin = false;
        message = 'wrong password please try again';
        res.render('adminLogin', {isAdmin: false, message: message})
    }
});


router.post('/newMember', (req, res) => {
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
router.get("/new", (req, res) => {
    if (isAdmin) {
        res.render("members/new");
    } else {
        isAdmin = false;
        res.render('adminLogin', {isAdmin: false, message: ''})
    }
});


//edit
router.get('/:id/edit', (req, res) => {
    //is the admin logged in
    if (isAdmin) {

        Member.findById(req.params.id, (err, member) => {
            if (err) {
                res.redirect('back');
            } else {
                res.render("members/edit", {member: member});
            }
        });
    } else {
        isAdmin = false;
        res.render('adminLogin', {isAdmin: false, message: ''})
    }
});

//update
router.put('/:id', (req, res) => {
    if (isAdmin) {
        Member.findByIdAndUpdate(req.params.id, req.body.member, function (err, updatedMember) {
            console.log("req.body " + updatedMember);
            if (err) {
                res.redirect("back");
            } else {
                Member.find({}, (err, members) => {
                    res.render('members/admin', {members: members, isAdmin: isAdmin, message: ''})
                });
            }
        });
    }
});

router.get('/logoutAdmin', (req, res) => {
    isAdmin = false;
    res.render('adminLogin', {isAdmin: false, message: "logged out"});
});

module.exports = router;