var express = require('express');
var router = express.Router({mergeParams: true}),

    passport = require("passport"),
    User = require("../models/user"),
    post = require('../models/post'),
    middleware = require('../middleware/index'),
    locus = require('locus');


//============= image upload ===========================

var multer = require('multer');


var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
};

var upload = multer({storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'djagznbnb',
    api_key: '159668526228246',
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//======================================================

//  ===========
// AUTH ROUTES
//  ===========

// show register form

var tags;
router.get("/register", function (req, res) {
    res.render("register", {availableTags: tags});
});
//handle sign up logic
router.post("/register", upload.single('image'), function (req, res) {


    var avatarImg = req.body.image;
    var newUser;
    cloudinary.uploader.upload(req.file.path, function (result) {
        avatarImg = result.secure_url;
        newUser = new User({
            username: req.body.username,
            password: req.body.password,
            firstName: '',
            lastName: '',
            avatar: avatarImg,
            city: '',
            email: req.body.email
        });

        //eval(locus);


        User.register(newUser, req.body.password, function (err, user) {
            if (err) {
                req.flash('error', err.message);
                return res.render("register", {message: err.message});
            }

            passport.authenticate("local")(req, res, function () {
                req.flash('success', 'Successfully Singed Up');
                res.redirect("/posts");
            });
        });
    });

});
//==============================================================

// show login form
router.get("/login", function (req, res) {
    res.render("login");
});

//==============================================================

// handling login logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/posts",
        failureRedirect: "/login"
    }), function (req, res) {
});

// logic route
router.get("/logout", function (req, res) {
    req.logout();
    req.flash('success', 'Logged You Out');
    res.redirect("/posts");
});
//==============================================================

//user profile
//show a user
router.get('/users/:id', (req, res) => {

    User.findById(req.params.id, (err, foundUser) => {
        if (err) {
            console.log(err);
            req.flash('err', 'Something went wrong');
        } else {
            res.render("users/show", {user: foundUser});
        }
    });
});

//==============================================================

//edit profile
router.get('/users/:id/edit', (req, res) => {
    res.render('users/edit', {user: req.user});
});


//update user fields except image
router.put('/users/:id', (req, res) => {


    User.findByIdAndUpdate(req.params.id, req.body.user, function (err, updatedUser) {

        if (err) {
            res.redirect("/users/show");
        } else {
            //redirect somewhere(show page)
            res.redirect("/users/" + req.params.id);
        }
    });
});

//==============================================================
//edit picture
router.get('/users/:id/edit/imageEdit', (req, res) => {
    res.render('users/imageEdit', {user: req.user});
});


//update picture with post, instead of put, since body has multipart data
router.post('/users/:id/imageEdit', upload.single('image'), (req, res) => {

    var avatarImg;

    cloudinary.uploader.upload(req.file.path, function (result) {
        avatarImg = result.secure_url;


        User.findByIdAndUpdate(req.params.id, {$set: {avatar: avatarImg}}, {new: true}, function (err, updatedUser) {
            console.log("\nreq.body " + updatedUser);
            if (err) {
                res.redirect("/users/show");
            } else {
                //redirect somewhere(show page)
                res.redirect("/users/" + req.params.id);
            }
        });


    });

});

//================================================================

function allFields(allposts) {
    var availableTags = [];

    allposts.forEach(function (post) {
        availableTags.push(post.name, post.author.username,
            post.description.replace(/,/g, '').trim());
        post.comments.forEach(function (comment) {
            availableTags.push(comment.author.username, comment.text.replace(/,/g, '').trim());
        });
    });

    return availableTags;
}


module.exports = router;
