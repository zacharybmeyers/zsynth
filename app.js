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

const TEST_USER_ID = 2;
const TEST_PATCH_NAME = "triangley";

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

    app.get('/createUser/:userID', (req, res) => {        
        // convert string to int
        const userID = parseInt(req.params.userID, 10)
        createUser(db, userID);
        res.send('user added to db!');
    })

    // create patch
    app.post('/patch', type, (req, res) => {
        addPatchToUser(db, TEST_USER_ID, req.body.pname, { waveform: "sine" });
        res.end();
    })
    
    // mongodb method for note upload
    app.post('/upload/base64', (req, res) => {    
        // strip metadata from audio string, write to .ogg file
        var rawAudioString = req.body.audioString.replace('data:audio/webm;codecs=opus;base64,', '')    
        addNoteToPatch(db, TEST_USER_ID, req.body.parentDir, req.body.noteName, rawAudioString);
        res.send('base64 added to db');
    })

    // single file GET request
    app.get('/download/:patchName/:fileName', (req, res) => {
        getNoteFromPatch(db, TEST_USER_ID, req.params.patchName, req.params.fileName)
        .then(note => {
            const notePath = `./audio/${note.note_name}.ogg`;
            audioStringToFile(notePath, note.audio_string)
            .then(() => res.sendFile(path.resolve(notePath)))
            .catch(e => {
                console.log(e);
                // TODO: can't send error in res here???
                res.end();
            })
        }).catch(e => {
            console.log(e)
            // TODO: can't send error in res here????
            res.end();
        })
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

// ALL MongoDB FUNCTIONS
async function createUser(db, userID) {
    const user = {
        user_id: userID
    }
    const result = await db.collection("users").insertOne(user);
    console.log(`user added with id: ${result.insertedId}`);
}

async function addPatchToUser(db, userID, patchName, patchConfig) {
    const patch = {
        patch_name: patchName,
        patch_config: patchConfig
    }
    const result = await db.collection("users").updateOne(
        { user_id: userID },
        { $push: { patches: patch } }
    )
    console.log(`patch added with id: ${result.insertedId}`)
}

async function addNoteToPatch(db, userID, patchName, noteName, audioString) {
    const note = {
        note_name: noteName,
        audio_string: audioString
    }
    const result = await db.collection("users").updateOne(
        { user_id: userID, 
        "patches.patch_name": patchName },
        { $push: { "patches.$.notes": note } }
    );
    console.log(`note added with id: ${result.insertedId}`)
}

async function getNoteFromPatch(db, userID, patchName, noteName) {    
    const user = await db.collection("users").findOne(
        { user_id: userID }
    )

    // TODO: refactor this into a mongo query (can't figure it out right now)
    for (const patch of user.patches) {
        if (patch.patch_name == patchName) {
            for (const note of patch.notes) {
                if (note.note_name == noteName) {
                    return note;
                }
            }
        }
    }

    throw `Unable to find note: ${noteName}`;
}