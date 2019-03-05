var Post = require("../models/post");
var Comment = require("../models/comment");


var middlewareObj = {};

middlewareObj.checkPostOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Post.findById(req.params.id, function(err, foundPost){
            if(err){
                res.redirect("back");
            }  else {
                // does user own the post?
                if(foundPost.author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect("back");
                }
            }
        });
    } else {
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                req.flash('error','Post not found ');
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundComment.author.id.equals(req.user._id)) {

                    next();
                } else {
                    req.flash('error','Permission Denied ');
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash('error','Please Log In' );
        res.redirect("back");
    }
}


middlewareObj.isLoggedIn = function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error','Please Login First');
    res.redirect("/login");
}

module.exports = middlewareObj;