var express = require("express");
var router = express.Router({mergeParams: true});
var Post = require("../models/post");
var Comment = require("../models/comment");
var middleware = require('../middleware/index');
var User = require('../models/user');

var async = require('async'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto');

//Comments New
router.get("/new",middleware.isLoggedIn, function (req, res) {

    Post.findById(req.params.id, function (err, post) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {post: post});
        }
    });
});

//Comments Create
router.post("/", middleware.isLoggedIn, function (req, res) {
    //lookup post using ID
    Post.findById(req.params.id, function (err, post) {
        if (err) {
            console.log(err);
            res.redirect("/posts");
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    post.comments.push(comment);
                    post.save();
                    // TODO uncomment
                    // sentEmails(req,res,post); //======================================================================
                    req.flash('success','Comment Added ' );
                    res.redirect('/posts/' + post._id);
                }
            });
        }
    });
});


router.get('/:comment_id/edit',middleware.checkCommentOwnership, (req, res) => {

    Comment.findById(req.params.comment_id, (err, foundComment) => {

        if (err) {
            console.log(err);
        } else {
            res.render('userPosts/edit', {post: req.params.id, comment: foundComment});
        }
    });
});

//update route
router.put('/:comment_id',middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, {text: req.body.comment.text}, (err, updated) => {
        if (err) {
            console.log(err);
            res.redirect('/comments');
        } else {
            res.redirect('/userPosts/comments');
        }
    });
});

//delete route
router.delete('/:comment_id', middleware.checkCommentOwnership,( req, res) => {
    Comment.findByIdAndRemove(req.params.comment_id, (err, del) => {
        if (err) {
            console.log(err);
            res.redirect('back');
        } else {
            req.flash('success','Comment Deleted ' );
            res.redirect('/userPosts/comments');

        }
    });
});

function sentEmails(req,res,post) {

    var allMail = [];
    User.find({}, 'email', function (err, docs) {
        docs.forEach(function (user) {
            allMail.push(user.email)
        })
    });

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            port: 465,
            secure: true,
            user: 'hellenicamericanhippocratic@gmail.com',
            pass: process.env.GMAILPW
        }
    });


    var mailOptions = {
        from: 'hellenicamericanhippocratic@gmail.com',
        to: allMail,
        bcc:allMail,
        subject: 'Message from the H. A. Hippocratic Society',
        // html: '<h3>A new post has been created by </h3>',
        text: 'A new comment has been created by the user: '+req.user.username+'\nPlease click on the following link '+
            'http://' + req.headers.host + '/posts/'+post._id + ' to see the post in context\n\n'

    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}



module.exports = router;