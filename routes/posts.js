var express = require('express');
var router = express.Router({mergeParams: true});
var Posts = require('../models/post');
var Comment = require('../models/comment');
var User = require('../models/user');
var middleware = require("../middleware/index");
var func = require('../js/functions');
var locus = require('locus');
var request = require('request');
var multer = require('multer');

var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov|m4v|mpeg-4|3gpp)$/i)) {
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

var tags;
//INDEX - show all posts
router.get("/", function (req, res) {
    // Get all posts from DB

    var search;
    var isSearched = false;
    var comnt, desc, name, campId;


    Posts.find({}).sort([['_id', -1]]).populate("comments").exec(function (err, allPosts) {
        if (err) {
            console.log(err);
        }

        tags = func.allFields(allPosts); //get all available fields


        // check if there is a search
        if (req.query.search) {
            isSearched = true;
            search = JSON.stringify(req.query.search).replace(/"/g, '').trim();

            allPosts.forEach(function (post) {
                if (post.name.toString().replace(/,/g, '').trim() === search) {

                    campId = post.id;
                    name = post.name;

                }


                if (post.description.toString().replace(/,/g, '').trim() === search) {
                    campId = post.id;
                    desc = post.description;
                }

                post.comments.forEach(function (comment) {
                    if (comment.text.replace(/,/g, '').trim() === (search)) {
                        campId = post.id;
                        comnt = comment.id;
                        //   console.log(comment.text)

                    }
                });
            });

            if (isSearched && campId) {

                Posts.findById(campId).populate("comments").exec(function (err, foundPost) {
                    if (err) {
                        console.log(err);
                    }
                    User.find({}, (err, foundUsers) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.render("posts/show", {
                                post: foundPost,
                                users: foundUsers,
                                availableTags: tags,
                                nameSearch: name,
                                descriptionSearch: desc,
                                commentSearch: comnt

                            });
                        }
                    });
                });
            } else {
                //there is an issue with the white spaces when sentence ends and begins other after white space
                res.redirect("/posts");
            }

        }//end of search

        else {


            // console.log(allPosts[6].comments[0].text)

            User.find({}, (err, foundUsers) => {

                if (err) {
                    console.log(err);
                } else {

                    res.render("posts/index", {
                        posts: allPosts,
                        users: foundUsers,
                        availableTags: tags,
                        nameSearch: null,
                        descriptionSearch: null,
                        commentSearch: null,
                        uiid: require('uniqid')
                    });
                }
            });
        }
    });
});



function createPost(req, res) {
    Posts.create(req.body.post, function (err, post) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        req.flash('success', 'New Post Created');
        res.redirect('/posts');
    });
}



//CREATE - add new post to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {
    // all formats (jpg|jpeg|png|gif|mp4|mov|m4v|mpeg-4|3gpp)
  eval(locus)

   if (req.file.path.substring(req.file.path.length - 3) === 'mp4' || req.file.path.substring(req.file.path.length - 3) === 'mov') {
        uploadVideo(req, res);
    } else {
        uploadImage(req, res);
    }

});

//NEW - show form to create new post
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("posts/new", {availableTags: tags});
});

// SHOW - shows more info about one post
router.get("/:id", function (req, res) {
    //find the post with provided ID
    Posts.findById(req.params.id).populate("comments").exec(function (err, foundPost) {
        if (err) {
            console.log(err);
        }
        User.find({}, (err, foundUsers) => {
            if (err) {
                console.log(err);
            } else {
                res.render("posts/show", {
                    post: foundPost,
                    users: foundUsers,
                    availableTags: tags,
                    nameSearch: null,
                    descriptionSearch: null,
                    commentSearch: null
                });
            }
        });
    });
});


//edit
router.get('/:id/edit', middleware.checkPostOwnership, (req, res) => {
    //is the user logged in

    //and owns the post
    Posts.findById(req.params.id, (err, foundPost) => {

        if (err) {

            res.redirect('/posts');
        } else {

            res.render("posts/edit", {post: foundPost, availableTags: tags});
        }
    });
});

//update
router.put('/:id', middleware.checkPostOwnership, upload.single('image'), function (req, res) {

    // Posts.findByIdAndUpdate(req.params.id, req.body.post, function (err, updatedPost) {
    //     console.log("req.body " + updatedPost);
    //     if (err) {
    //         res.redirect("/posts");
    //     } else {
    //         //redirect somewhere(show page)
    //         res.redirect("/posts/" + req.params.id);
    //     }
    // });

    // in case empty image
    if (req.file === undefined) {
        res.redirect('back')
    } else {


        cloudinary.uploader.upload(req.file.path, function (result) {
            // add cloudinary url for the image to the post object under image property
            req.body.post.image = result.secure_url;
            // add author to post
            req.body.post.author = {
                id: req.user._id,
                username: req.user.username
            };
            Posts.findByIdAndUpdate(req.params.id, req.body.post, function (err, updatedPost) {
                console.log("req.body " + updatedPost);
                if (err) {
                    res.redirect("/posts");
                } else {
                    //redirect somewhere(show page)
                    res.redirect("/posts/" + req.params.id);
                }
            });
        });
    }
});

router.delete('/:id', middleware.checkPostOwnership, (req, res) => {
    Posts.findByIdAndRemove(req.params.id, (err, post) => {
        if (err) {
            console.log(err);
            res.redirect('/posts');
        } else {
            res.redirect('/userPosts');
        }
    });
});

function uploadImage(req, res) {
    cloudinary.uploader.upload(req.file.path, function (result) {
        // add cloudinary url for the image to the post object under image property
        req.body.post.image = result.secure_url;
        // add author to post
        req.body.post.author = {
            id: req.user._id,
            username: req.user.username
        };
        createPost(req, res);
    });
}


function uploadVideo(req, res) {
    cloudinary.v2.uploader.upload_large(req.file.path, {resource_type: "video"},
        function (error, result) {
            console.log(result, error);
            if (error) {
                req.flash('error', error.message + "\nMaximum file size limit is 110MB");
                res.redirect('back')
            } else {
                // eval(locus)
                req.body.post.image = result.secure_url;
                // add author to post
                req.body.post.author = {
                    id: req.user._id,
                    username: req.user.username
                };
                createPost(req, res);
            }
        });
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
