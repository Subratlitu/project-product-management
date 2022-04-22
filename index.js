const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const route = require('./routes/route');
const { default: mongoose } = require('mongoose');
const multer=require('multer')


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer().any())




mongoose.connect("mongodb+srv://subrat1234:litu1234@cluster0.h1cfx.mongodb.net/group33Database?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )
app.use('/', route);


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});



