//Mongoose is a MongoDB object modeling tool designed to work in an asynchronous environment.
const mongoose = require("mongoose");

const options = {
    reconnectTries: Number.MAX_VALUE,    
    poolSize: 10
};

console.log("Attempting to connect to " + process.env.DB_URI );

mongoose.connect(process.env.DB_URI, options).then(
    () => {
        console.log("Database connection established.");
    },
    err => {
        console.log("Error connecting to database instance due to: ", err);
    }
);