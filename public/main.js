// USE BROWSERIFY TO BUNDLE: $ browserify main.js -o bundle.js 
// this way the client end JS can make use of node packages and require
// within index.html -> link script to bundle.js (not main.js): <script src="bundle.js"></script>
//
// the npm start script has been configured to bundle, serve, and launch localhost

var Tone = require('tone');

// when page loads add functionality to start audio context and play all notes
window.addEventListener('DOMContentLoaded', () => {
    // attach a click listener to a play button to start audio context
    document.getElementById("play-button").addEventListener('click', async () => {
	    await Tone.start();
	    console.log('audio is ready');
    })
    // get all notes, make them playable based on their unique id
    keys.forEach(key => {
        key.addEventListener('click', playNote(key.dataset.note, synthOptions));
    })
    // get oscillator drop down, make selected option change the synth oscillator
    var oscSelect = document.getElementById("osc-select");
    oscSelect.addEventListener('change', () => changeOscillator(oscSelect.value));
})

// get all keys
const keys = document.querySelectorAll(".key");

// create default synth options
const synthOptions = {
    oscillator: {
        type : "fatsine"
    }
}

// playNote returns a function that creates a new synth with :param:options (oscillator)
// and plays the :param:note
function playNote(note, options) {
    return () => {
        // create a synth
        const synth = new Tone.Synth(options).toDestination();
        // play a note from that synth lasting for an 8th note
        synth.triggerAttackRelease(note, "8n");
    }
}

function changeOscillator(osc) {
    // update synthOptions, remove current listener, add new listener
    synthOptions.oscillator.type = osc;
    keys.forEach(key => {
        key.removeEventListener('click', playNote(key.dataset.note, synthOptions));
        key.addEventListener('click', playNote(key.dataset.note, synthOptions));
    })
}

/* ----- Create recording of a note, send to server as blob -----*/
function createRecordingBlob(note) {
    const recorder = new Tone.Recorder();
    const synth = new Tone.Synth().connect(recorder);
    // start recording
    recorder.start();
    // generate a note
    synth.triggerAttackRelease(note, "8n");
    // wait for the notes to end and stop the recording
    setTimeout(async () => {
        // the recorded audio is returned as a blob
        const recordingBlob = await recorder.stop();
        sendBlob(recordingBlob, note).then(text => console.log(text)).catch(err => console.log(err));
    }, 4000);
}

async function sendBlob(blob, note) {
    // myBlob = new Blob(["This is my blob content"], {type : "text/plain"});
    // wrap recordingBlob in FormData
    var fd = new FormData();
    fd.append("upl", blob, note + ".webm");
    let options = {
        method: "POST",
        body: fd
    }
    let response = await fetch("/upload", options);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
}

document.getElementById("submit-blob").addEventListener('click', () => createRecordingBlob("C4"));
/* ---------- */

/* ----- Create recording of a note, send to server as base64 encoded string -----*/
async function createRecording(note, pDir) {
    const recorder = new Tone.Recorder();
    const synth = new Tone.Synth().connect(recorder);
    // start recording
    recorder.start();
    // generate a note
    synth.triggerAttackRelease(note, "8n");
    // wait for the notes to end and stop the recording
    setTimeout(async () => {
        // the recorded audio is returned as a blob
        const recordingBlob = await recorder.stop();
        var reader = new FileReader();
        reader.readAsDataURL(recordingBlob);
        reader.onloadend = () => {
            var base64data = reader.result;
            sendBase64(base64data, note, pDir).then(text => console.log(text)).catch(err => console.log(err));
        }
    }, 4000);
}

async function sendBase64(base64data, note, pDir) {
    // myBlob = new Blob(["This is my blob content"], {type : "text/plain"});
    // wrap recordingBlob in FormData
    let options = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            parentDir: pDir,
            name: note,
            audioString: base64data
        })
    }
    let response = await fetch("/upload/base64", options);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
}

document.getElementById("submit-base64").addEventListener('click', () => createRecording("C4"));
/* ---------- */

/* ----- Create recordings of all the current note elements, send to the server ----- */
function createAllRecordings(pDir) {
    keys.forEach(key => {
        createRecording(key.dataset.note, pDir);
    })
}

document.getElementById("submit-all-base64").addEventListener('click', () => createAllRecordings(pDir));
/* ---------- */

// get patch form, submit fetch to create directory with given patch name inside /audio/ on the server
// then create recordings for all notes in their current state, send the recordings to the new directory
const form = document.getElementById('patch-form');
form.addEventListener('submit', (event) => {
    const form = event.target;
    var fd = new FormData(form);
    fd.append("upl", form.id);
    fetch(form.action, {
        method: form.method,
        body: fd,
    })

    // TODO: conditional check that directory was made successfully (or already existed)

    // PASS IN PARENT DIRECTORY (CREATED DIRECTORY)
    var parentDir = fd.get('pname');
    // console.log(parentDir);
    createAllRecordings(parentDir);

    const log = document.getElementById('log');
    log.style.display = 'inline-block';
    log.textContent = 'patch saved!';

    // set timeout to make log message disappear
    setTimeout(() => {log.style.display = 'none'}, 5000);

    event.preventDefault();
});
