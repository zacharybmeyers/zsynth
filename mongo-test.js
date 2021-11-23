const { MongoClient } = require('mongodb');

async function main() {
    const username = 'zsynth';
    const password = 'zsynth';
    const uri = `mongodb+srv://${username}:${password}@cluster0.bzqjc.mongodb.net/zsynth_users?retryWrites=true&w=majority`;

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("zsynth");

        const user = {
            user_id: 1
        }

        const patch = {
            patch_name: "sinesfun", 
            patch_config: { waveform: "sine" }
        }

        const note = {
            note_name: "C4",
            audio_string: "alskjekwqjlrjqewr"
        }

        await createUser(db, user);
        await addPatchToUser(db, user.user_id, patch);
        await addNoteToPatch(db, user.user_id, patch.patch_name, note);

    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }

}

main().catch(console.error);

async function createUser(db, user) {
    const result = await db.collection("users").insertOne(user);
    console.log(`new user id: ${result.insertedId}`);
}

// mongosh command to delete all documents from "users" collection: db.users.deleteMany({})

async function addPatchToUser(db, userID, patch) {
    const result = await db.collection("users").updateOne(
        { user_id: userID },
        { $push: { patches: patch } }
    );
    console.log(`patch: ${patch.patch_name} added`);
}

async function addNoteToPatch(db, userID, patchName, note) {
    const result = await db.collection("users").updateOne(
        { user_id: userID, 
        "patches.patch_name": patchName },
        { $push: { "patches.$.notes": note } }
    );
    console.log(`note: ${note.note_name} added`);
}

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();
    
    console.log("Databases:");
    databasesList.databases.forEach(db => {
        console.log(`- ${db.name}`);
    })
}

/* 
overall mongodb schema: embedded (nested) documents

const user = {
    _id: some unique object id (primary key),
    user_id: userID (from Oliver's login service?),
    patches: [
        {
            patch_name: patchName,
            patch_config: patchConfig,
            notes: [
                {
                    note_name: noteName,
                    audio_string: audioString
                },
                {
                    note_name: noteName,
                    audio_string: audioString
                }
            ]
        },
        {
            ANOTHER PATCH HERE
        }
    ]
}
*/