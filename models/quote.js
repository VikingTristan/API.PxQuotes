const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuoteSchema = new Schema({
    "text": String,
    "author": String
});

const Quote = mongoose.model("Quote", QuoteSchema);

module.exports = Quote;