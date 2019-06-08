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

var async = require('async'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto');


var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});


var imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov)$/i)) {
        return cb(new Error('Only image files are allowed or videos (mp4, mov'), false);
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

    // Posts.find({}).sort([['_id', -1]]).populate("comments").exec(function (err, allPosts) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //
    //         User.find({}, (err, foundUsers) => {
    //
    //             if (err) {
    //                 console.log(err);
    //             } else {
    //
    //                 res.render('posts/index', ({posts: allPosts,users:foundUsers}))
    //             }
    //         })
    //     }
    // })


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
        // TODO uncomment
        // sentEmails(req, res, post); =====================================================
        req.flash('success', 'New Post Created');
        res.redirect('/posts');
    });
}


function createPost1(post, req, res) {
    Posts.create(post, function (err, post) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        // TODO uncomment
        // sentEmails(req, res, post); =====================================================
        req.flash('success', 'New Post Created');
        res.redirect('/posts');
    });
}


//CREATE - add new post to DB
router.post("/", middleware.isLoggedIn, upload.array("image", 5), (req, res) => {

    const post = new Posts();
    post.name = req.body.post.name;
    post.description = req.body.post.description;
    post.author = {
        id: req.user._id,
        username: req.user.username
    };

    if (req.files.length === 0) {
        createPost1(post, req, res);
    } else if (req.files[0].path.substring(req.files[0].path.length - 3) === 'mov' ||
        req.files[0].path.substring(req.files[0].path.length - 3) === 'mp4') {
        uploadVideo(req, res);
    } else {
        uploadImages(req, post, res);
    }

});

function sentEmails(req, res, post) {

    // var allMail = ['pavlospapadonikolakis@yahoo.com', 'p.pp256@yahoo.com', 'ppapadonikolakis@csumb.edu'];
    var allMail = [];
    User.find({}, 'email', function (err, docs) {

        docs.forEach(function (user) {
            allMail.push(user.email)
        })
    });
    // req.headers.host

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
        bcc: allMail,
        subject: 'Message from the H. A. Hippocratic Society',
        // html: '<h3>A new post has been created by </h3>',
        text: 'A new post has been created by the user: ' + req.user.username + '\nPlease click on the following link ' +
            'http://' + req.headers.host + '/posts/' + post._id + ' to see the post in context\n\n'

    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

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
router.put('/:id',
    middleware.checkPostOwnership,
    upload.array("image", 6),
    (req, res) => {

        // if it was a video and only text updated
        if (req.body.videoOriginal !== undefined && req.files[0]===undefined) {

            req.body.post.image = req.body.videoOriginal;
            Posts.findByIdAndUpdate(req.params.id, req.body.post, function (err, updatedPost) {
                console.log("updatedPost " + updatedPost);
                if (err) {
                    res.redirect("/posts");
                } else {
                    //redirect somewhere(show page)
                    res.redirect("/posts/" + req.params.id);
                }
            });

            // if it was a video, and video updated or and text
        } else if (req.body.videoOriginal !== undefined && (req.files[0].path.substring(req.files[0].path.length - 3) === 'mov' ||
            req.files[0].path.substring(req.files[0].path.length - 3) === 'mp4')) {
            updateWithVideo(req, res)

        } else {

            const post = new Posts();
            post.name = req.body.post.name;
            post.description = req.body.post.description;
            post.author = {
                id: req.user._id,
                username: req.user.username
            };


            // if no images on initially created post
            if (req.body.image1 === '') {
                updatePost(req, res);
            }

            // if there are no images selected to be updated
            // put the same images

            if (req.body.image1 !== undefined) {
                post.image.push(req.body.image1);
            }
            if (req.body.image2 !== undefined) {
                post.image.push(req.body.image2);
            }
            if (req.body.image3 !== undefined) {
                post.image.push(req.body.image3);
            }
            if (req.body.image4 !== undefined) {
                post.image.push(req.body.image4);
            }
            if (req.body.image5 !== undefined) {
                post.image.push(req.body.image5);
            }

            console.log(req.files.length);

            // if there is a new file uploaded
            if (req.files.length > 0) {

                var files = 0;
                for (let i = 0; i < req.files.length; i++) {

                    cloudinary.v2.uploader.upload(req.files[i].path, {
                            eager: [
                                {
                                    secure: true,
                                    angle: "exif",
                                    quality: "auto:low"
                                }],
                            eager_async: true,
                        },
                        (error, result) => {
                            files++;
                            console.log(result.eager[0].secure_url)
                            post.image.push(result.eager[0].secure_url);
                            if (files === req.files.length) {
                                updateWithImages(post, req, res);
                            }
                        });
                }
            } else {
                updateWithImages(post, req, res);
            }
        }

    });

function updateWithImages(post, req, res) {
    req.body.post.image = post.image;

    Posts.findByIdAndUpdate(req.params.id, req.body.post, function (err, updatedPost) {
        console.log("updatedPost " + updatedPost);
        if (err) {
            res.redirect("/posts");
        } else {
            //redirect somewhere(show page)
            res.redirect("/posts/" + req.params.id);
        }
    });

}

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
        //transform the image in order to not rotate when uploading
        req.body.post.image = cloudinary.image(`${result.public_id}.${result.format}`, {
            secure: true,
            angle: "exif",
            quality: "auto:low"
        }).split(/'/)[1];

        // console.log(req.body.post.image)
        // console.log(result)

        // add author to post
        req.body.post.author = {
            id: req.user._id,
            username: req.user.username
        };
        createPost(req, res);
    });
}


function uploadVideo(req, res) {
    cloudinary.v2.uploader.upload_large(req.files[0].path, {resource_type: "video"},
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

function updatePost(req, res) {
    Posts.findByIdAndUpdate(req.params.id, req.body.post, function (err, updatedPost) {
        console.log("updatedPost " + updatedPost);
        if (err) {
            res.redirect("/posts");
        } else {
            //redirect somewhere(show page)
            res.redirect("/posts/" + req.params.id);
        }
    });
}

function updateWithVideo(req, res) {
    cloudinary.v2.uploader.upload_large(req.files[0].path, {resource_type: "video"},
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
                updatePost(req, res);
            }
        });
}

function updateWithImage(req, res) {
    cloudinary.uploader.upload(req.file.path, function (result) {
        // add cloudinary url for the image to the post object under image property
        req.body.post.image = result.secure_url;
        // add author to post
        req.body.post.author = {
            id: req.user._id,
            username: req.user.username
        };
        updatePost(req, res);
    });
}

function uploadImages(req, post, res) {
    var files = 0;
    for (let i = 0; i < req.files.length; i++) {

        cloudinary.v2.uploader.upload(req.files[i].path, {
                eager: [
                    {
                        secure: true,
                        angle: "exif",
                        quality: "auto:low"
                    }],
                eager_async: true,
            },
            (error, result) => {
                files++;
                post.image.push(result.eager[0].secure_url);
                if (files === req.files.length) {
                    createPost1(post, req, res);
                }
            });
    }
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
