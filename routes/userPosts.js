var express = require('express');
var router = express.Router({mergeParams: true});
var Post = require('../models/post');
var Comment = require('../models/comment');
var locus = require("locus");
var middleware = require('../middleware/index');
var User = require('../models/user');
var func = require('../js/functions');


var tags;

router.get('/', middleware.isLoggedIn, (req, res) => {
    // Get all posts from DB

    Post.find({}).sort([['_id', -1]]).populate("comments").exec(function (err, allPosts) {
        if (err) {
            console.log(err);
        }

        tags = func.allFields(allPosts);

        User.find({}, (err, foundUsers) => {
            if (err) {
                console.log(err);
            } else {

                res.render("userPosts/index", {
                    posts: allPosts,
                    users: foundUsers,
                    availableTags: tags,
                    uiid: require('uniqid')

                });
            }
        });
    });
});


//list all
router.get('/comments', middleware.isLoggedIn, (req, res) => {

    Post.find({}).sort([['_id', -1]]).populate("comments").exec(function (err, all) {

        tags = func.allFields(all);

        if (err) {
            console.log(err);
        } else {

            let commentPost = [];
            let unique_array = [];

            all.forEach(function (post) {
                post.comments.forEach(function (comment) {
                    if (post.comments && comment.author && comment.author.id.equals(req.user.id)) {
                        commentPost.push(post);
                    }
                });
            });

            for (let i = 0; i < commentPost.length; i++) {
                if (unique_array.indexOf(commentPost[i]) === -1) {
                    unique_array.push(commentPost[i])
                }
            }

            User.find({}, (err, foundUsers) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render("userPosts/comments", {
                        posts: unique_array,
                        users: foundUsers,
                        availableTags: tags,
                        uiid: require('uniqid')
                    });
                }
            });
        }
    });
});




module.exports = router;