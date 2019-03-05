var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/post");
var Comment = require("../models/comment");
var middleware = require('../middleware/index');

//Comments New
router.get("/new",middleware.isLoggedIn, function (req, res) {

    Campground.findById(req.params.id, function (err, post) {
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
    Campground.findById(req.params.id, function (err, post) {
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



module.exports = router;