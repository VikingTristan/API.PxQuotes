//Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env
require("dotenv").config();
//Fast, unopinionated, minimalist web framework for node.
const express = require("express");
const cookieParser = require("cookie-parser");
//Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
const bodyParser = require("body-parser");
//CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
const cors = require("cors");
//HTTP request logger middleware for node.js
const morgan = require("morgan");
//use sessions for tracking logins
const session = require("express-session");
//We'll use this to actually store sessions
const MongoStore = require("connect-mongo")(session);
//Passport middleware
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();

const port = process.env.PORT || 8082;

app.listen(port, () => {
    console.log("Server running at port: " + port);
});

//Database connection
require("./config/db");

//Get models
const Quote = require("./models/quote");
const User = require("./models/user");

app.use(morgan("combined"));
app.use(bodyParser.json());

//CORS
const corsOptions = {
    origin: ["http://localhost:8080", "http://app.quotes.vikingtom.ninja/"],
    allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept"],
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

app.use(cookieParser("supersecret"));

//Set up Sessions
//use sessions for tracking logins
app.use(session({
    saveUninitialized: false,
    resave: false,
    // store: new MongoStore({
    //     host: "127.0.0.1",
    //     port: "27017",
    //     db: "session",
    //     url: process.env.DB_URI 
    // }),
    secret: "supersecret",
    name: "VikingAuthentication",
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: (4 * 60 * 60 * 1000)
    }
}));
app.use(passport.initialize());
app.use(passport.session());

//Passport setup -- authentication 
passport.use(new LocalStrategy({
        usernameField: "username",
        passwordField: "password"
    },
    function (username, password, done) {
        if (username && password) {
            User.authenticate(username, password, (error, user) => {
                if (error || !user) {
                    return done(null, false, {
                        message: "Incorrect username or password."
                    });
                } else {
                    return done(null, user);
                }
            });
        } else {
            return done(null, false, {
                message: "All fields are required."
            });
        }
    }
));

/* Each subsequent request will not contain credentials,
but rather the unique cookie that identifies the session. 
In order to support login sessions,  Passport will serialize 
 and deserialize user instances to and from the session. */
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

/****************
   Q U O T E S 
****************/
//FETCH ALL
app.get("/", (req, res) => {
    Quote.find({}, "text author", function (error, quotes) {
        if (error) {
            console.error("Error: ", error);
        }
        res.send({
            quotes: quotes
        });
    }).sort({
        _id: -1
    });

});

//FETCH SINGLE
app.get("/quote/:id", requiresLogin, (req, res) => {
    Quote.findById(req.params.id, "text author", function (error, quote) {
        if (error) {
            console.log("Error: ", error);
            res.status(500).send({
                success: false,
                message: "Unable to fetch quote."
            });
            return;
        }
        res.send(quote);
    });
});

//CREATE
app.post("/quotes", (req, res) => {
    const text = req.body.text;
    const author = req.body.author;

    const newQuote = new Quote({
        text: text,
        author: author
    });

    newQuote.save(function (e) {
        if (e) {
            console.log("Error: ", e);
        }

        res.send({
            success: true,
            message: "Quote created!"
        });
    });
});

//UPDATE
app.put("/quotes/:id", requiresLogin, (req, res) => {
    Quote.findById(req.params.id, "text author", function (error, quote) {
        if (error)
            console.log("Error updating quote:", error);

        quote.text = req.body.text;
        quote.author = req.body.author;
        quote.save(function (error) {
            if (error)
                console.log("Error:", error);

            res.send({
                success: true
            });
        });
    });
});

//DELETE
app.delete("/quotes/:id", requiresLogin, (req, res) => {
    Quote.remove({
        _id: req.params.id
    }, function (err, quote) {
        if (err)
            res.send(err);
        res.send({
            success: true
        });
    });
});

/****************************
A U T H E N T I C A T I O N 
****************************/
//LOGIN
app.post("/login",
    passport.authenticate("local"),
    function (req, res) {
        res.redirect("/quotes");
    }
);

//CUSTOM LOGIN CHECK MIDDLEWARE
function requiresLogin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }        
    else {
        const err = new Error("You must be logged in to do this.");
        err.status = 401;
        return next(err);
    }
}