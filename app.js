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

app.get('/', (req, res) => {
    res.render('home');
})

app.post('/upload', type, (req, res) => {
    console.log(req.body);
    console.log(req.file);
    // do stuff with file here - store in DB?
    // for now multer will process FormData and store in /audio
    res.send('blob received by server');
})

app.get('/download/:fileName', (req, res) => {
    res.sendFile(path.resolve(`./audio/${req.params.fileName}.ogg`));
    // res.download(path.resolve(`./audio/${req.params.fileName}.ogg`));
    // res.attachment(path.resolve(`./audio/${req.params.fileName}.ogg`));
})

app.post('/upload/base64', (req, res) => {
    // strip metadata from audio string, write to .ogg file
    var rawAudioString = req.body.audioString.replace('data:audio/webm;codecs=opus;base64,', '')
    fs.writeFileSync(`./audio/${req.body.parentDir}/${req.body.name}.ogg`, Buffer.from(rawAudioString, 'base64'));
    res.send('base64 received by server');
})

app.post('/patch', type, (req, res) => {
    console.log('patch endpoint reached');
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