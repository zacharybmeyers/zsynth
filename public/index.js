function playNote(note) {
    // create a synth
    const synth = new Tone.Synth().toDestination();
    // play a note from that synth
    synth.triggerAttackRelease(note, "8n");
}

//attach a click listener to a play button
document.getElementById("play-button").addEventListener('click', async () => {
	await Tone.start()
	console.log('audio is ready')
})

// get all notes, make them playable based on their unique id
var allNotes = document.getElementsByClassName("note");
for (let note of allNotes) {
    note.addEventListener('click', () => playNote(note.id));
}

document.getElementById("submit").addEventListener('click', () => {

})

function createRecording(note) {
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

document.getElementById("submit").addEventListener('click', () => createRecording("C4"));


function createRecording2(note) {
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
            sendBase64(base64data, note).then(text => console.log(text)).catch(err => console.log(err));
        }
    }, 4000);
}

async function sendBase64(base64data, note) {
    // myBlob = new Blob(["This is my blob content"], {type : "text/plain"});
    // wrap recordingBlob in FormData
    let options = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
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

document.getElementById("submit2").addEventListener('click', () => createRecording2("C4"));