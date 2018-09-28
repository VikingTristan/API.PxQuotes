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
// const LocalStrategy = require("passport-local").Strategy;
const jwt = require("express-jwt");
const jwtAuthz = require("express-jwt-authz");
const jwksRsa = require("jwks-rsa");

// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and 
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: process.env.AUTH0_DOMAIN + "/.well-known/jwks.json"
    }),

    // Validate the audience and the issuer.
    audience: process.env.AUDIENCE,
    issuer: process.env.AUTH0_DOMAIN,
    algorithms: ["RS256"]
});

const Auth0Strategy = require("passport-auth0");

const app = express();

const port = process.env.PORT || 8082;

app.listen(port, () => {
    console.log("Server running at port: " + port);
});

//Database connection
require("./config/db");

//Get models
const Quote = require("./models/quote");
// const User = require("./models/user");

app.use(morgan("combined"));
app.use(bodyParser.json());

// Configure Passport to use Auth0
const strategy = new Auth0Strategy({
        domain: process.env.AUTH0_DOMAIN,
        clientID: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        callbackURL: process.env.AUTH0_CALLBACK_URL
    },
    (accessToken, refreshToken, extraParams, profile, done) => {
        return done(null, profile);
    }
);

passport.use(strategy);
//CORS
const corsOptions = {
    origin: ["http://localhost:8080", "http://app.quotes.vikingtom.ninja"],
    allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept"],
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// app.use(cookieParser("supersecret"));

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
// passport.use(new LocalStrategy({
//         usernameField: "username",
//         passwordField: "password"
//     },
//     function (username, password, done) {
//         if (username && password) {
//             User.authenticate(username, password, (error, user) => {
//                 if (error || !user) {
//                     return done(null, false, {
//                         message: "Incorrect username or password."
//                     });
//                 } else {
//                     return done(null, user);
//                 }
//             });
//         } else {
//             return done(null, false, {
//                 message: "All fields are required."
//             });
//         }
//     }
// ));

/* Each subsequent request will not contain credentials,
but rather the unique cookie that identifies the session. 
In order to support login sessions,  Passport will serialize 
 and deserialize user instances to and from the session. */
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

require("./routes/index");


// This route doesn't need authentication
app.get("/public", function (req, res) {
    res.json({
        message: "Hello from a public endpoint! You don't need to be authenticated to see this."
    });
});

// This route need authentication
app.get("/private", checkJwt, function (req, res) {
    res.json({
        message: "Hello from a private endpoint! You need to be authenticated to see this."
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
app.get("/quote/:id", (req, res) => {
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
app.put("/quotes/:id", (req, res) => {
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
app.delete("/quotes/:id", (req, res) => {
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
// LOGIN
// app.post("/login",
//     passport.authenticate("auth0", {
//         clientID: process.env.AUTH0_CLIENT_ID,
//         domain: process.env.AUTH0_DOMAIN,
//         redirectUri: process.env.AUTH0_CALLBACK_URL,
//         audience: "https://" + process.env.AUTH0_DOMAIN + "/userinfo",
//         responseType: "code",
//         scope: "openid"
//     }),
//     function (req, res) {
//         res.redirect("/");
//     }
// );

// app.get("/login",
//     passport.authenticate("auth0", {
//         clientID: process.env.AUTH0_CLIENT_ID,
//         domain: process.env.AUTH0_DOMAIN,
//         redirectUri: process.env.AUTH0_CALLBACK_URL,
//         audience: "https://" + process.env.AUTH0_DOMAIN + "/userinfo",
//         responseType: "code",
//         scope: "openid"
//     }),
//     function (req, res) {
//         res.redirect("/");
//     }
// );

// app.post("/logout", (req,res)=>{
//     req.logout();
//     res.redirect("/");
// });
app.get(
    "/login",
    passport.authenticate("auth0", {
        clientID: process.env.AUTH0_CLIENT_ID,
        domain: process.env.AUTH0_DOMAIN,
        redirectUri: process.env.AUTH0_CALLBACK_URL,
        audience: "https://" + process.env.AUTH0_DOMAIN + "/userinfo",
        responseType: "code",
        scope: "openid"
    }),
    function (req, res) {
        res.redirect("/");
    }
);

app.get(
    "/checklogin",
    passport.authenticate("auth0", {}),
    function (req, res) {
        console.log("I guess I am here with req: ", req);
        // res.redirect("/");
    }
);

// Perform session logout and send response
app.get("/logout", (req, res) => {
    req.logout();
    res.send({
        success: true,
        message: "Successfully logged out"
    });
});

// Perform the final stage of authentication
// app.get(
//     "/callback",
//     passport.authenticate("auth0", {
//         failureRedirect: "/"
//     }),
//     function (req, res) {
//         res.redirect(req.session.returnTo);
//     }
// );

//CUSTOM LOGIN CHECK MIDDLEWARE
// function requiresLogin(req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     } else {
//         const err = new Error("You must be logged in to do this.");
//         err.status = 401;
//         return next(err);
//     }
// }