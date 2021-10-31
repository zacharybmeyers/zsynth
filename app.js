var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var multer = require('multer');
var fs = require('fs');
var zlib = require('zlib');
var child_process = require('child_process');
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

// single file .zip GET request
app.get('/zip/:patchName/:fileName', (req, res) => {
    const fileContents = fs.createReadStream(`./audio/${req.params.patchName}/${req.params.fileName}.ogg`);
    const writeStream = fs.createWriteStream(`./audio/${req.params.patchName}/${req.params.fileName}.ogg.gz`);
    const zip = zlib.createGzip();
    fileContents.pipe(zip).pipe(writeStream);
    res.end();
})

// entire directory .zip GET request
app.get('/zip/:patchName', (req, res) => {
    const dir = `./audio/${req.params.patchName}`;
    // Check if the patch name exists as a directory
    fs.access(dir, fs.constants.F_OK, (err) => {
        if (err) { // send error if doesn't exist
            res.send(`patch ${req.params.patchName} does not exist`);
        } else { // otherwise zip directory and send
            child_process.exec(`zip -r ${req.params.patchName} *`, {cwd: `${dir}`}, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                  }
                  console.log(`stdout: ${stdout}`);
                  console.error(`stderr: ${stderr}`);
                  res.sendFile(path.resolve(`${dir}/${req.params.patchName}.zip`))
            });
        }
    });
})


// TODO: refactor for lighter DB storage -> store rawAudioString in DB, only convert to .ogg file when GET request comes in
app.post('/upload/base64', (req, res) => {
    // strip metadata from audio string, write to .ogg file
    var rawAudioString = req.body.audioString.replace('data:audio/webm;codecs=opus;base64,', '')
    fs.writeFileSync(`./audio/${req.body.parentDir}/${req.body.name}.ogg`, Buffer.from(rawAudioString, 'base64'));
    res.send('base64 received by server');
})

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