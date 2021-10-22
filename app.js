var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});;
var multer = require('multer');

var app = express();
var upload = multer({ dest: "audio/" });
var type = upload.single('upl');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 8080);

// body parser deprecated, use express to parse...
// application/xwww-form-urlencoded, and application/json
// use multer to parse multipart/form-data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// use public folder to serve client-side html and js
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('home');
})

app.post('/upload', type, (req, res) => {
    console.log(req.body);
    console.log(req.file);
    // do stuff with file here
    res.send('file received by server');
})

app.listen(app.get('port'), function () {
    console.log(`Express started on http://localhost:${app.get('port')}; press Ctrl-C to terminate.`)
})