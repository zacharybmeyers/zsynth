let audioContext = new (window.AudioContext || window.webkitAudioContext)();

const masterVolume = audioContext.createGain();
masterVolume.connect(audioContext.destination);
masterVolume.gain.value = .75;

const startButton = document.querySelector('#start');

startButton.addEventListener('click', function () {
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(220, 0);
    oscillator.connect(masterVolume);
    oscillator.start(0);
    oscillator.type = sine;
})