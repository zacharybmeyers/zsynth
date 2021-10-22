function playNote(note) {
    // create a synth
    const synth = new Tone.Synth().toDestination();
    // play a note from that synth
    synth.triggerAttackRelease(note, "8n");
}

function recordAudio(note) {
    const recorder = new Tone.Recorder();
    const synth = new Tone.Synth().connect(recorder);
    // start recording
    recorder.start();
    // generate a note
    synth.triggerAttackRelease(note, "8n");
    // wait for the notes to end and stop the recording
    setTimeout(async () => {
        // the recorded audio is returned as a blob
        const recording = await recorder.stop();
        // download the recording by creating an anchor element and blob url
        const url = URL.createObjectURL(recording);
        const anchor = document.createElement("a");
        anchor.download = note + ".webm";
        anchor.href = url;
        anchor.click();
    }, 4000);
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

function sendNote(note) {
    const recorder = new Tone.Recorder();
    const synth = new Tone.Synth().connect(recorder);
    // start recording
    recorder.start();
    // generate a note
    synth.triggerAttackRelease(note, "8n");
    // wait for the notes to end and stop the recording
    setTimeout(async () => {
        // the recorded audio is returned as a blob
        const recording = await recorder.stop();
        fetchNotePost(recording).catch(err => console.log(err));
    }, 4000);
}

async function fetchNotePost(recording) {
    let options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: recording
    }
    let response = await fetch("/upload", options);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
}

document.getElementById("submit").addEventListener('click', () => sendNote("C4"));