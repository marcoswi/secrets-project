import * as dotenv from 'dotenv';
dotenv.config()
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import md5 from 'md5';

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


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
    password: String
});

const User = new mongoose.model("User", userSchema);



/* --------------- "/home" ---------------- */

app.get("/", function(req, res){
    res.render("home");
});


/* --------------- "/register" ---------------- */

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function (req, res){
    const userName = req.body.username;
    const userPassword = req.body.password;

User.findOne({email: userName})
    .then(function(foundUser){
        if (foundUser) {
            console.log("The email is already being used")
            } else {
                const newUser = new User({
                    email: req.body.username,
                    password: md5(req.body.password)
                });
                newUser.save()
                .then(function(newUser){
                    if (newUser) { 
                        res.render("secrets")
                        }
                })
                .catch(function(err){
                    console.log(err);
            });
        }
    });
});


/* --------------- "/login" ---------------- */

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function (req, res){
    const userName = req.body.username;
    const userPassword = md5(req.body.password);

    User.findOne({email: userName})
    .then(function(foundUser){
        if (!foundUser) {
            console.log("User not found")
        } else {
            if (foundUser.password === userPassword) {
                res.render("secrets");
            } else {
                console.log("Incorrect Password")
            };
        };
    })
    .catch(function(error){
        console.log(error);
    });
});

/* --------------- "log out" ---------------- */

app.get("/logout", function(req, res){
    res.render("home");
});


/* --------------- "listen" ---------------- */


app.listen("3000", function(){
    console.log("Server running in port 3000");
    connect();
});
