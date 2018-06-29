const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
});

//authenticate input against database
UserSchema.statics.authenticate = function (username, password, callback) {
    User.findOne({
            username: username
        })
        .exec(function (err, user) {
            if (err) {
                return callback(err);
            } else if (!user) {
                const err = new Error("User not found.");
                err.status = 401;
                return callback(err);
            }

            //Compare passwords - ugh
            if (password === user.password) {
                console.log("CHECKED PASSOWRD... IT SEEMS FINE");
                return callback(null, user);
            } else {
                console.log("Checked passowrd... it was not fine");
                return callback();
            }
            //TODO below
            // bcrypt.compare(password, user.password, function (err, result) {
            //     if (result === true) {
            //         return callback(null, user);
            //     } else {
            //         return callback();
            //     }
            // })
        });
};

const User = mongoose.model("User", UserSchema);

module.exports = User;