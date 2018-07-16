// const express = require("express");
// const passport = require("passport");
// const app = express();
// // const router = express.Router();

// console.log("Hello I am here and I have been required!");
// // router.get("/", function (req, res, next) {
// //     res.render("index");
// // });
// // Perform the login
// app.get(
//     "/login",
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

// // Perform session logout and redirect to homepage
// app.get("/logout", (req, res) => {
//     req.logout();
//     res.redirect("/");
// });

// // Perform the final stage of authentication and redirect to '/user'
// app.get(
//     "/callback",
//     passport.authenticate("auth0", {
//         failureRedirect: "/"
//     }),
//     function (req, res) {
//         res.redirect(req.session.returnTo || "/user");
//     }
// );