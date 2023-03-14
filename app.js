import * as dotenv from 'dotenv';
dotenv.config()
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMogoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);

/* --------------- "connection to MongoDB" ---------------- */

async function connect() {
    try {
    await mongoose.connect(process.env.URI);
    console.log("Connected to MongoDB");
    } catch (error) {
    console.log(error);
    }
}; 

/* --------------- "Schema & Models" ---------------- */


const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String 
});

userSchema.plugin(passportLocalMogoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


/* passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
 */
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err,user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
    });
    }
));

/* --------------- "/home" ---------------- */

app.get("/", function(req, res){
    res.render("home");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


/* --------------- "/register" ---------------- */

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function (req, res){

    User.register({username: req.body.username}, req.body.password)
    .then((user)=>{
            passport.authenticate("local")(req,res, function(){
            res.redirect("secrets");
            })
    })
    .catch((error)=>{
        console.log(error);
    }); 

});


/* --------------- "/login" ---------------- */

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function (req, res){
    
    const user = new User ({
        username: req.body.username,
        password: req.body.password
        });

    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            });
        };
    })
});

/* --------------- "secrets" ---------------- */

app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    };
});

/* --------------- "submit" ---------------- */

app.get("/submit", function(req, res){
    res.render("submit");
});


/* --------------- "log out" ---------------- */

app.get("/logout", function(req, res){
    req.logout((err)=>{
        if (!err){
            res.redirect("/");
        } else {
            console.log(err)
        }
    });
    
});



/* --------------- "listen" ---------------- */


app.listen("3000", function(){
    console.log("Server running in port 3000");
    connect();
});
