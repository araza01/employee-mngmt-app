const mongoose = require(`mongoose`);

mongoose.connect("mongodb+srv://employee:pass123@cluster0.ew5zw.mongodb.net/test?retryWrites=true&w=majority", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log(`Connection Successfull!`);
}).catch((err) => {
    console.log(`Something went wrong! \n Error: ` + err.message);
});