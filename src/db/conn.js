const mongoose = require(`mongoose`);

mongoose.connect("mongodb+srv://project1:pass123@cluster0.8ehmh.mongodb.net/ems?retryWrites=true&w=majority", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log(`Connection Successfull!`);
}).catch((err) => {
    console.log(`Something went wrong! \n Error: ` + err.message);
});