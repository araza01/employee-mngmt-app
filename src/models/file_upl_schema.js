const mongoose = require(`mongoose`);

const docSchema = new mongoose.Schema({
    filename: String
});

const Document = new mongoose.model(`Document`, docSchema);

module.exports = Document;