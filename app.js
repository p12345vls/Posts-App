var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Post = require("./models/post"),
    Comment = require("./models/comment"),
    User = require("./models/user"),
    Member = require('./models/member'),
    async = require('async'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto');


require('dotenv').config();//to hide the cloudinary values

const PORT = process.env.PORT || 5000;//for heroku

mongoose.set('useNewUrlParser', true);
mongoose.set('useCreateIndex', true);
//requiring routes
var commentRoutes = require("./routes/comments"),
    postRoutes = require("./routes/posts"),
    indexRoutes = require("./routes/index"),
    userRoutes = require('./routes/userPosts'),
    memberRoutes = require('./routes/members'),
    admin1Routes = require('./routes/admin1'),
    flash = require('connect-flash');

// mongoose.connect(" mongodb://localhost/test1", {
//     useNewUrlParser: true
// });

mongoose.connect("mongodb://heroku_snvwlvg8:h16n608skv8gsi4lti5gtv9cl0@ds153495.mlab.com:53495/heroku_snvwlvg8", {
    useNewUrlParser: true
});
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

app.locals.moment = require('moment');

// static pages routes ----------------------------------
app.get("/", (req, res) => {
    res.render('landing');
});
app.get("/contact", (req, res) => {
    res.render('contact-us');
});
app.get('/hippocrates', (req, res) => {
    res.render('Hippocrates');
});
app.get('/about',(req,res)=>{
    res.render('about');
});
app.get('/case',(req,res)=>{
    res.render('orthopedic-case');
});
app.get('/admin2',(req,res)=>{
    res.render('admin2Login');
});
// end static pages routes -------------------------------

app.use("/", indexRoutes);
app.use("/posts", postRoutes);
app.use("/posts/:id/comments", commentRoutes);
app.use('/userPosts', userRoutes);
app.use('/members', memberRoutes);
app.use('/admin1',admin1Routes);


app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// app.listen(8000, () => {
//     // eslint-disable-next-line no-console
//     console.log('App listening on port 8000!');
// });