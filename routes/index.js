var express = require('express');
var router = express.Router({mergeParams: true}),

    passport = require("passport"),
    User = require("../models/user"),
    post = require('../models/post'),
    middleware = require('../middleware/index'),
    async = require('async'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
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
//======end image upload===============================

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
    // eval(locus)
    var avatarImg = req.body.image;
    var newUser;
    cloudinary.uploader.upload(req.file.path, function (result) {
        // avatarImg = result.secure_url;
        //transform the image in order to not rotate when uploading
        avatarImg = cloudinary.image(`${result.public_id}.${result.format}`, {
            secure: true,
            angle: "exif",
            quality: "auto:low"
        }).split(/'/)[1];

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

// logout route
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
            req.flash('error', 'Something went wrong');
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
        // avatarImg = result.secure_url;
        avatarImg = cloudinary.image(`${result.public_id}.${result.format}`, {
            secure: true,
            angle: "exif",
            quality: "auto:low"
        }).split(/'/)[1];


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

// ===============================================================
// forgot password
router.get('/forgot', function (req, res) {
    res.render('forgot');
});

router.post('/forgot', function (req, res, next) {

    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({email: req.body.email}, function (err, user) {
                if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },

        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'hellenicamericanhippocratic@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'hellenicamericanhippocratic@gmail.com',
                subject: 'Password Reset Info Share',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});


//reset password
router.get('/reset/:token', function (req, res) {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {token: req.params.token});
    });
});

router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {$gt: Date.now()}
            }, function (err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'hellenicamericanhippocratic@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'hellenicamericanhippocratic@gmail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account '
                    + user.email +
                    ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function (err) {
        res.redirect('/posts');
    });
});

//contact form
router.post('/contact', function (req, res) {
    let mailOpts, smtpTrans;
    smtpTrans = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'hellenicamericanhippocratic@gmail.com',
            pass: process.env.GMAILPW
        }
    });
    mailOpts = {
        from: req.body.name + ' &lt;' + req.body.email + '&gt;',
        to: 'hellenicamericanhippocratic@gmail.com',
        subject: `${req.body.subject} `,
        text: `${req.body.name}\n (${req.body.email})\n says: ${req.body.message}`
    };
    smtpTrans.sendMail(mailOpts, function (error, response) {
        if (error) {

            res.render('contact-failure');
        } else {

            res.render('contact-success');
        }
    });
});


module.exports = router;
