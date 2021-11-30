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

// import utility functions for MongoDB CRUD operations
const mongo = require('./mongo.js');

// test cases
const TEST_USER_ID = 2;
const TEST_PATCH_NAME = "triangley";

MongoClient.connect(uri)
.then(client => {
    console.log('connected to mongodb');
    const db = client.db("zsynth");

    // main server code here
    app.get('/home', (req, res) => {
        res.render('home');
    })

    app.get('/create-account', (req, res) => {
        res.render('acct');
    })

    app.get('/login', (req, res) => {
        res.render('login');
    })

    app.post('/createUser', async (req, res) => {    
        await mongo.createUser(db, req.body.userID, req.body.email);
        res.send('user added to db!');
    })

    // create patch
    app.post('/patch', type, async (req, res) => {
        await mongo.addPatchToUser(db, req.body.userID, req.body.pname, { waveform: "sine" });
        res.end();
    })
    
    // mongodb method for note upload
    app.post('/upload/base64', async (req, res) => {    
        // strip metadata from audio string, write to .ogg file
        var rawAudioString = req.body.audioString.replace('data:audio/webm;codecs=opus;base64,', '')    
        await mongo.addNoteToPatch(db, req.body.userID, req.body.patchName, req.body.noteName, rawAudioString);
        res.send('base64 added to db');
    })

    // single file GET request
    app.get('/download/:email/:patchName/:fileName', async (req, res) => {
        const uid = await mongo.getUID(db, req.params.email);
        try {
            const note = await mongo.getNoteFromPatch(db, uid, req.params.patchName, req.params.fileName);
            const notePath = `./audio/${note.note_name}.ogg`;
            await audioStringToFile(notePath, note.audio_string)
            res.sendFile(path.resolve(notePath));
            await removeAudioFile(path.resolve(notePath));
        } catch (e) {
            console.log(e);
            res.end();
        } 
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

// utility function for saving audio string to file
async function audioStringToFile(path, audioString) {
    try {
        await fs.promises.writeFile(path, Buffer.from(audioString, 'base64'));
    } catch (error) {
        console.log(error);
    }
}

// utility function for removing a generated audio file
async function removeAudioFile(path) {
    try {
        await fs.promises.rm(path);
    } catch (error) {
        console.log(error);
    }
}