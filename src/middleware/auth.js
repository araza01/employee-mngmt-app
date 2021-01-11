const jwt = require(`jsonwebtoken`);
const Employee = require(`../models/schema`);

const auth = async function(req, res, next) {
    try {
        const token = req.cookies.jwt;
        const userVerify = jwt.verify(token, process.env.SECRET_KEY);
        const user = await Employee.findOne({_id: userVerify._id});
        req.token = token;
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json(`Please Login!`);
    }
};

module.exports = auth;
