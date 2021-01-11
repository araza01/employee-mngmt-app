const mongoose = require(`mongoose`);
const bcrypt = require(`bcryptjs`);
const jwt = require(`jsonwebtoken`);
const moment = require(`moment`);

const empSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    date_of_birth: {
      type: String,
      required: true  
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    department: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    date_of_joining: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    conf_password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    emp_id: {
        type: String,
        required: true,
        unique: true
    },
    tokens: [{
        jwtToken: {
            type: String,
            required: true
        }
    }]
});

empSchema.methods.generateAuthToken = async function(req, res) {
    try {
        console.log(this._id);
        const token = jwt.sign({_id: this._id}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({jwtToken : token});
        return token;
    } catch (err) {
        res.status(500).send({ Error: err.message });
    }
}

empSchema.pre(`save`, async function(next) {
    if(this.isModified(`password`)) {
        this.password = await bcrypt.hash(this.password, 10);
        this.conf_password = await bcrypt.hash(this.password, 10);
        this.date_of_birth = moment(this.date_of_birth).format('MMM Do, YYYY');
        this.date_of_joining = moment(this.date_of_joining).format('MMM Do, YYYY');
    }
    next();
});

const Employee = new mongoose.model(`Employee`, empSchema);

module.exports = Employee;