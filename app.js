import { moveFile } from "move-file";
import express from 'express';
import handlebars from 'express-handlebars';
import Tone from 'tone';

handlebars.create({defaultLayout:'main'});
var app = express();
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.set('port', 8080);

// body parser deprecated, use express
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// use public folder to serve client-side html and js
app.use(express.static('public'));

// move file out of downloads 
async function moveDownload(filename) {
    await moveFile('/Users/zachary/Downloads/' + filename, 
    '/Users/zachary/Documents/OSU/CS361/zsynth/audio/' + filename);
    console.log('The file has been moved');
}

app.get('/', (req, res) => {
    res.render('home');
})

app.post('/upload', (req, res) => {
    console.log(req.body.recording);
})

app.listen(app.get('port'), function () {
    console.log(`Express started on http://localhost:${app.get('port')}; press Ctrl-C to terminate.`)
})