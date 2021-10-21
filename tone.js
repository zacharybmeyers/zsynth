function playNote(note) {
    // create a synth
    const synth = new Tone.Synth().toDestination();
    // play a note from that synth
    synth.triggerAttackRelease(note, "8n");
}

function recordAudio() {
    const recorder = new Tone.Recorder();
    const synth = new Tone.Synth().connect(recorder);
    // start recording
    recorder.start();
    // generate a few notes
    synth.triggerAttackRelease("C3", 0.5);
    synth.triggerAttackRelease("C4", 0.5, "+1");
    synth.triggerAttackRelease("C5", 0.5, "+2");
    // wait for the notes to end and stop the recording
    setTimeout(async () => {
        // the recorded audio is returned as a blob
        const recording = await recorder.stop();
        console.log(recording);
        // download the recording by creating an anchor element and blob url
        const url = URL.createObjectURL(recording);
        const anchor = document.createElement("a");
        anchor.download = "recording.webm";
        anchor.href = url;
        anchor.click();
    }, 4000);
}