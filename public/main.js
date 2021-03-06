// USE BROWSERIFY TO BUNDLE: $ browserify main.js -o bundle.js 
// this way the client end JS can make use of node packages and require
// within index.html -> link script to bundle.js (not main.js): <script src="bundle.js"></script>
//
// the npm start script has been configured to bundle, serve, and launch localhost

var Tone = require("tone");

// when page loads add functionality to start audio context and play all notes
window.addEventListener("DOMContentLoaded", () => {

    // attach a click listener to a play button to start audio context
    document.getElementById("play-button").addEventListener("click", async () => {
	    await Tone.start();
	    console.log("audio is ready");
    })

    // get all notes, make them playable based on their unique id
    const keys = document.querySelectorAll(".key");
    keys.forEach(key => {
        key.addEventListener("click", playNote(key.dataset.note));
    })

    // get oscillator drop down, make selected option change the synth oscillator
    const oscSelect = document.getElementById("osc-select");
    oscSelect.addEventListener("change", () => changeOscillator(oscSelect.value));

    // get ADSR sliders, allow their values to alter the synth
    const adsrSliders = document.querySelectorAll(".adsr");
    adsrSliders.forEach(slider => {
        // init sliders to default values on page load
        slider.value = synthOptions.envelope[slider.id];
        slider.oninput = () => {
            changeEnvelope(slider);
        }
    })

    // attach a click listener to a stop button
    document.getElementById("mute-button").addEventListener("click", () => {
        polySynth.releaseAll();
    })

}) 

// create default synth options
const synthOptions = {
    oscillator: {
        type : "sine"
    },
    envelope: {
        attackCurve: "linear",
        decayCurve: "exponential",
        releaseCurve: "exponential",
        attack: 0.20,
        decay: 2.0,
        sustain: 1.0,
        release: 0.20
    }
}

// create synth
const polySynth = new Tone.PolySynth(Tone.Synth, synthOptions).toDestination();

function playNote(note) {
    return () => {
        // invoke polySynth
        polySynth.volume.value = -20;
        const options = polySynth.get();
        polySynth.triggerAttackRelease(note, options.envelope.release);
    }
}

function changeOscillator(osc) {
    polySynth.set({
        oscillator: {
            type: osc
        }
    });
}

function changeEnvelope(slider) {
    var envelopeOptions = {};
    envelopeOptions[slider.id] = slider.value;
    // update poly synth
    polySynth.set({
        envelope: envelopeOptions
    })
}

/* ----- RECORDING METHODS ----- */
// create recordings for all notes, store in the DB by patch name and userID
async function createAllRecordings(patch, uid) {

    const keys = document.querySelectorAll(".key");
    keys.forEach(async (key) => await createRecording(key.dataset.note, patch, uid));

}

// create recording of a note, send to server as base64 encoded string
async function createRecording(note, patch, uid) {
    
    // create a new temporary synth with polySynth's current options
    const recorder = new Tone.Recorder()
    const options = polySynth.get();
    const tempSynth = new Tone.Synth(options).connect(recorder);
    recorder.start()

    tempSynth.volume.value = -20;
    tempSynth.triggerAttackRelease(note, options.envelope.release);
    setTimeout(async () => {
        
        const recordingBlob = await recorder.stop()
        
        // once recording is done, dispose
        tempSynth.dispose();
        recorder.dispose();
        
        // use file reader helper to process blob
        const base64data = await readBlobAsync(recordingBlob);
        try {
            const response = await sendBase64(base64data, note, patch, uid);
            console.log(response);
        } catch (e) {
            console.log(e);
        }

    }, 4000);

}

// utility function to asynchronously read recording blobs
function readBlobAsync(blob) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onloadend = () => {
            resolve(reader.result);
        }

        reader.onerror = reject;

        reader.readAsDataURL(blob);
    })
}

async function sendBase64(base64data, note, patch, uid) {
    
    let options = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            patchName: patch,
            userID: uid,
            noteName: note,
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

// on patch form save -> 
//      -create user in DB (if necessary)
//      -add patch to user
//      -create recordings for all notes, store in DB
const form = document.getElementById("patch-form");
form.addEventListener("submit", async function (event) {
    
    event.preventDefault();

    const form = event.target;
    var fd = new FormData(form);
    fd.append("upl", form.id);

    var patch = fd.get("pname");
    var uid = fd.get("userID");
    var email = fd.get("email");
    
    // create user in DB (mongo method checks for an existing user)
    await fetch("/createUser", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            userID: uid,
            email: email
        })
    })

    // add patch to user in DB
    await fetch(form.action, {
        method: form.method,
        body: fd,
    })

    // pass in patch name and user_id to create recordings
    await createAllRecordings(patch, uid);

    // TODO: await recording completion to display 'patch saved'
    // TODO: freeze interaction with web app while patch is being saved

    // display save success
    const log = document.getElementById("log");
    log.style.display = "inline-block";
    log.textContent = "patch saved!";

    // reset text input back to blank
    document.getElementById("pname").value = "";

    // set timeout to make log message disappear
    setTimeout(() => {log.style.display = "none"}, 5000);

});
