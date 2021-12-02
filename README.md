# zsynth

Interactive and customizable synthesizer built with Tone.js, with a server that can function as a microservice to provide custom audio.

Video demo:

[![zsynth final demo](https://i.imgur.com/hJWq6UJ.png)](https://youtu.be/7UgykQw2z3A "zsynth final demo")

# local server setup

Contact me for access to the MongoDB instance.

Clone the repo, use ``npm install`` for all dependencies.

You can run the server with ``npm run start`` which will browserify/bundle any changes to the client side JS, start the server, connect to MongoDB, and launch the web app on ``localhost``.

To save a patch you must be signed in. Create a new account or sign in with...

* email: tuser1@gmail.com
* password: tuser1

Feel free to play the keyboard, select a waveform, change the ADSR sliders, and save a patch with any name of your choice.

# microservice instructions

Once you have saved a patch, you can query the service for a note (while the server is running) with

``curl http://localhost:8080/download/{email}/{patch name}/{note name} --output {file name}.ogg``

This will save the file from your saved patch in .ogg format to the directory of your choice (where you run the command from).

`{email}` must have the "@" sign escaped with "%40".

``{note name}`` must be in the following format: capital letter, sharp identifier (optional), and then number.

* ex: "C4", "C%234" = C#4 (%23 is the UTF-8 code for the # character)

For simplicity, all enharmonic spellings make use of sharps (no flats).

As of right now, the range of notes provided is two octaves from C3-B5 (not including C6).

Example request:

`curl http://localhost:8080/download/tuser1%40gmail.com/defaultPatch/C4 --output C4.ogg`
