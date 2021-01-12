require('dotenv').config();
const express = require(`express`);
const bodyParser = require(`body-parser`);
const cookieParser = require(`cookie-parser`);
const multer = require(`multer`);
const csrf = require(`csurf`);
const path = require(`path`);
const ejs = require(`ejs`);
const bcrypt = require(`bcryptjs`);
const jwt = require(`jsonwebtoken`);
const db = require(`./db/conn`);
const Emp = require(`./models/schema`);
const Doc = require(`./models/file_upl_schema`);
const auth = require(`./middleware/auth`);
const app = express();
const router = express.Router();
const port = process.env.PORT || 3000;

const staticPath = path.join(__dirname, "../public");
const csrfProtection = csrf({ cookie: true });
const parseForm = bodyParser.urlencoded({ extended: false });

app.use(express.static(staticPath));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const fileStorage = multer.diskStorage({
    destination: `./public/docs`,
    filename: function(req, file, cb) {
        const uniquesuffix = Date.now() + `-` + path.extname(file.originalname);
        cb(null, file.fieldname + `-` + uniquesuffix);
    }
});

const upload = multer({
    storage: fileStorage
}).single(`file`);

app.set(`view engine`, `ejs`);

app.get(`/register`, csrfProtection, function(req, res) {
    console.log(`csrf token: ` + req.csrfToken());
    res.render(`register`, {csrfToken: req.csrfToken()});
});

app.get(`/login`, csrfProtection, function(req, res) {
    console.log(`csrf token: ` + req.csrfToken());
    res.render(`login`, {csrfToken: req.csrfToken()});
});

app.get(`/logout`, auth, async function(req, res) {
    try {
        console.log(req.user);
        res.clearCookie(`jwt`);  
        console.log(`Logged out successfully.`);
        await req.user.save();
        res.render(`home`);
    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
});

app.post(`/signup`,parseForm, csrfProtection, async function(req, res) {
    try {
        const pswd = req.body.password;
        const cnfPswd = req.body.conf_password;
        const empId = `EMP102` + Math.floor((Math.random() * 100) + 1);        
        
        if(pswd === cnfPswd) {
            const regEmp = new Emp({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                date_of_birth: req.body.date_of_birth,
                phone: req.body.phone,
                department: req.body.department,
                designation: req.body.designation,
                date_of_joining: req.body.date_of_joining,
                email: req.body.email,
                password: pswd,
                conf_password: cnfPswd,
                gender: req.body.gender,
                emp_id: empId
            })            
            const signupToken = await regEmp.generateAuthToken();
            console.log(`Signup token: ` + signupToken);
            res.cookie(`jwt`, signupToken, {
                expires: new Date(Date.now() + 1000000),
                httpOnly: true
            });
            const result = await regEmp.save();
            res.status(201).render(`alert`, {success: `Account Created Successfully!`});
        } else {
            res.send(`Passwords are not matching.`);
        }
    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
});

app.post(`/signin`, parseForm, csrfProtection,  async function(req, res) {
    try {
        const userEmail = await Emp.findOne({email: req.body.email});
        const match = await bcrypt.compare(req.body.password, userEmail.password);
        const signinToken = await userEmail.generateAuthToken();
        console.log(`Signin token: ` + signinToken);
        console.log(userEmail);
        res.cookie(`jwt`, signinToken, {
            expires: new Date(Date.now() + 1000000),
            httpOnly: true
        });
        if(match) {
            res.render(`empl`);
        } else {
            res.send(`Invalid Email or Password!`);
        }
    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
});

app.get(`/`, function(req, res) {
    res.render(`home`);
});

app.get(`/home`, function(req, res) {
    res.render(`home`);
});

app.get(`/empl`, auth, function(req, res) {
    res.render(`empl`);
});

app.get(`/all_empl`, function(req, res) {
    Emp.find({}, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            res.render(`all_empl`, { records: data });
        }
    });
});

app.get(`/view_empl`, function(req, res) {
    res.render(`view_empl`);
});

app.post(`/find_emp`, function(req, res) {
    const emplId = req.body.emp_id;
    const empFirstName = req.body.firstname;
    if(emplId != `` && empFirstName != ``){
        var filterParam = {
            $and: [
                {emp_id: req.body.emp_id}, {firstname: req.body.firstname}
            ]
        };
    } else if(emplId != `` && empFirstName == ``){
        var filterParam = {
            $or: [
                {emp_id: req.body.emp_id}, {firstname: req.body.firstname}
            ]
        };
    } else if(emplId == `` && empFirstName != ``) {
        var filterParam = {
            $or: [
                {emp_id: req.body.emp_id}, {firstname: req.body.firstname}
            ]
        };
    } else {
        var filterParam = {};
    }
    const viewEmp = Emp.find(filterParam);
    viewEmp.exec({}, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            res.render(`view_empl_details`, { records: data });
        }
    });
});

app.get(`/update_empl`, function(req, res) {
    res.render(`update_empl`);
});

app.post(`/update_emp`, function(req, res) {
    const emplId = req.body.emp_id;
    if(emplId != ``){
        var filterParam = {emp_id: req.body.emp_id}
    } else {
        var filterParam = {};
    }
    const updEmp = Emp.find(filterParam);
    updEmp.exec({}, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            res.render(`update_empl_details`, { records: data });
        }
    });
});

app.get(`/edit_emp/:id`, function(req, res) {
    const id = req.params.id;
    console.log(id);
    const editEmp = Emp.findById(id);
    editEmp.exec({}, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            res.render(`edit_empl`, { records: data });
        }
    });
});

app.post(`/update_emp_details`, function(req, res) {
    const updateEmp = Emp.findByIdAndUpdate(req.body.id, {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        date_of_birth: req.body.date_of_birth,
        phone: req.body.phone,
        department: req.body.department,
        designation: req.body.designation,
        date_of_joining: req.body.date_of_joining,
        email: req.body.email,
        gender: req.body.gender
    });
    updateEmp.exec({}, function(err) {
        if(err) {
            console.log(err);
        } else {
            res.render(`alert`, {success: `Records Updated Successfully!`});
        }
    });
});

app.get(`/delete_empl`, function(req, res) {
    res.render(`delete_empl`);
});

app.post(`/delete_emp`, async function(req, res) {
    const emplId = req.body.emp_id;
    if(emplId != ``){
        var filterParam = {emp_id: req.body.emp_id}
    } else {
        var filterParam = {};
    }
    const delEmp = Emp.find(filterParam);
    delEmp.find({}, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            res.render(`delete_empl_details`, { records: data });
        }
    });
});

app.get(`/delete_emp/:id`, function(req, res) {
    const id = req.params.id;
    const deleteEmp = Emp.findByIdAndDelete(id);
    deleteEmp.exec({}, function(err) {
        if(err) {
            console.log(err);
        } else {
            res.render(`alert`, {success: `Record Deleted Successfully!`});
        }
    });
});

app.get(`/upload`, function(req, res) {
    const docList = Doc.find({});
    docList.exec({}, function(err, doc) {
        if(err) {
            console.log(err);
        } else {
            res.render(`upload_doc`, {records: doc, success: ``});
        }
    });
});

app.post(`/upload`, upload, async function(req, res) {
    try {
        const fileName = req.file.filename;
        const docLog = new Doc({
            filename: fileName
        });
        const result = await docLog.save(function (err) {
            if(err) {
                console.log(err);
            } else {
                const docList = Doc.find({});
                docList.find({}, function(err, doc) {
                    if(err) {
                        console.log(err);
                    } else {
                        res.render(`alert`, {records: doc, success: `File Uploaded Successfully`});
                    }
                });
            }
        });
    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server is listening to port ${port}`);
});
