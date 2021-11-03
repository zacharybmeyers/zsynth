var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var multer = require('multer');
var fs = require('fs');
var path = require('path');

var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 8080);

// body parser deprecated, use express to parse...
//  application/xwww-form-urlencoded
//  application/json
// use multer to parse multipart/form-data
// use public folder to serve client-side html and js
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
var upload = multer({ dest: "audio/" });
var type = upload.single('upl');
app.use(express.static('public'));

// MongoDB setup
var MongoClient = require('mongodb').MongoClient;
const username = 'zsynth';
const password = 'zsynth';
const uri = `mongodb+srv://${username}:${password}@cluster0.bzqjc.mongodb.net/zsynth_users?retryWrites=true&w=majority`;

MongoClient.connect(uri)
.then(client => {
    console.log('connected to mongodb');
    const db = client.db("zsynth");

    // main server code here
    app.get('/', (req, res) => {
        res.render('home');
    })
    
    app.get('/login', (req, res) => {
        res.render('login');
    })

    app.get('/createUser', (req, res) => {
        db.collection("users").insertOne({user_id: 1});
        res.send('user added to db!');
    })

    // mongodb method for note upload
    app.post('/upload/base64', (req, res) => {
        // mongo.createUser()?
    
        // strip metadata from audio string, write to .ogg file
        var rawAudioString = req.body.audioString.replace('data:audio/webm;codecs=opus;base64,', '')
    
        res.send('base64 added to db');
    })

    // single file GET request
    app.get('/download/:patchName/:fileName', (req, res) => {
        res.sendFile(path.resolve(`./audio/${req.params.patchName}/${req.params.fileName}.ogg`));
        // res.download(path.resolve(`./audio/${req.params.fileName}.ogg`));
        // res.attachment(path.resolve(`./audio/${req.params.fileName}.ogg`));
    })
    
    // // TODO: refactor for lighter DB storage -> store rawAudioString in DB, only convert to .ogg file when GET request comes in
    // app.post('/upload/base64', (req, res) => {
    //     // strip metadata from audio string, write to .ogg file
    //     var rawAudioString = req.body.audioString.replace('data:audio/webm;codecs=opus;base64,', '')
    //     fs.writeFileSync(`./audio/${req.body.parentDir}/${req.body.name}.ogg`, Buffer.from(rawAudioString, 'base64'));
    //     res.send('base64 received by server');
    // })
    
    app.post('/patch', type, (req, res) => {
        fs.mkdirSync(path.resolve(`./audio/${req.body.pname}`), { recursive: true })
        res.end();
    })
    
    // error handling
    app.use( (req, res) => {
        res.status(404);
        // res.render('404');
        });
        
        app.use( (req, res) => {
        res.status(500);
        // res.render('500');
        });
    
    app.listen(app.get('port'), function () {
        console.log(`Express started on http://localhost:${app.get('port')}; press Ctrl-C to terminate.`)
    })
})
.catch(e => console.error(e))