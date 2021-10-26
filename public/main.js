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
        // key.addEventListener('click', playNote(key.dataset.note, synthOptions));
        key.addEventListener('click', playNote(key.dataset.note));
    })
    // attach a click listener to a stop button
    document.getElementById("mute-button").addEventListener('click', () => {
        polySynth.releaseAll();
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

// create synth
const polySynth = new Tone.PolySynth(Tone.Synth, synthOptions).toDestination();

// playNote returns a function that creates a new synth with :param:options (oscillator)
// and plays the :param:note
function playNote(note) {
    return () => {
        // invoke polySynth
        polySynth.triggerAttackRelease(note, "8n");
    }
}

function changeOscillator(osc) {
    // update poly synth
    polySynth.set({
        oscillator: {
            type: osc
        }
    });
}

/* ----- Create recordings of all the current note elements, send to the server ----- */
function createAllRecordings(pDir) {
    // create a recording for each key, store in the parent directory (patch name)
    keys.forEach(key => createRecording(key.dataset.note, pDir));
}

// Create recording of a note, send to server as base64 encoded string
async function createRecording(note, pDir) {
    const recorder = new Tone.Recorder()
    // create a new temporary synth with polySynth's current options
    const tempSynth = new Tone.Synth(polySynth.get()).connect(recorder);
    recorder.start()
    tempSynth.triggerAttackRelease(note, "8n");
    setTimeout(async () => {
        const recordingBlob = await recorder.stop()
        // once recording is done, dispose
        tempSynth.dispose();
        recorder.dispose();
        // use file reader to process blob
        var reader = new FileReader();
        reader.readAsDataURL(recordingBlob);
        reader.onloadend = () => {
            var base64data = reader.result;
            sendBase64(base64data, note, pDir).then(text => console.log(text)).catch(err => console.log(err));
        }
    }, 4000);
}

async function sendBase64(base64data, note, pDir) {
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
/* ---------- */

// get patch form, submit fetch to create directory with given patch name inside /audio/ on the server
// then create recordings for all notes in their current state, store the recordings to the new directory
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

    // display save success as alert
    // window.alert(`patch ${parentDir} saved!`);

    const log = document.getElementById('log');
    log.style.display = 'inline-block';
    log.textContent = 'patch saved!';

    // reset text input back to blank
    document.getElementById('pname').value = "";

    // set timeout to make log message disappear
    setTimeout(() => {log.style.display = 'none'}, 5000);

    event.preventDefault();
});
