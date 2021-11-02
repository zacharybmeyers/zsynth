var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var multer = require('multer');
var fs = require('fs');
var path = require('path');

const sqlite = require('sqlite3');
const db = new sqlite.Database('./user.sqlite', (err) => console.log(err));
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        userID INT, 
        patchName varchar, 
        noteName varchar, 
        rawAudioString varchar)`);
})

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

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/login', (req, res) => {
    res.render('login');
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

app.post('/upload/base64', (req, res) => {
    // strip metadata from audio string, write to .ogg file
    var rawAudioString = req.body.audioString.replace('data:audio/webm;codecs=opus;base64,', '')
    var stmt = db.prepare('INSERT INTO user (userID, patchName, noteName, rawAudioString) VALUES (?, ?, ?, ?)');
    stmt.run(333, req.body.parentDir, req.body.name, rawAudioString);
    stmt.finalize();
    res.send('base64 added to db');
})


// TODO: keep trying to get download working with database
app.get('/download/:userID/:patchName/:noteName', (req, res) => {
    var row = getAudioFromDB(req.params.userID, req.params.patchName, req.params.noteName);
    console.log(row);
    // audio found, create temp file
    fs.writeFileSync(`./audio/${row.noteName}.ogg`, Buffer.from(row.rawAudioString, 'base64'));
    console.log(`successfully created ./audio/${row.noteName}.ogg`)
    // send to client
    res.sendFile(path.resolve(`./audio/${row.noteName}.ogg`), (err) => {
        if (err) {
            console.log(err);
        }
        // delete temp file
        fs.unlink(`./audio/${row.noteName}.ogg`, (err) => {
            if (err) throw err;
            console.log(`successfully deleted ./audio/${row.noteName}.ogg`);
        })
    });
})

function getAudioFromDB(userID, patchName, noteName) {
    var sql = `SELECT rawAudioString, noteName 
    FROM user 
    WHERE userID = ? 
    AND patchName = ?
    AND noteName = ?`
    db.get(sql, [userID, patchName, noteName], (err, row) => {
        return row;
    })
}

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