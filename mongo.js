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

// ALL MongoDB FUNCTIONS
async function createUser(db, userID, email) {
    const existingUser = await db.collection("users").findOne({user_id: userID});
    if (!existingUser) {
        const user = {
            user_id: userID,
            email: email
        }
        console.log(user);
        const result = await db.collection("users").insertOne(user);
        console.log(`user added with id: ${result.insertedId}`);
    } else {
        console.log('cannot create user: already exists')
    }
}

async function addPatchToUser(db, userID, patchName, patchConfig) {
    const patch = {
        patch_name: patchName,
        patch_config: patchConfig
    }
    const result = await db.collection("users").updateOne(
        { user_id: userID },
        { $push: { patches: patch } }
    )
    console.log(`patch added with name: ${patchName}`)
}

async function addNoteToPatch(db, userID, patchName, noteName, audioString) {
    const note = {
        note_name: noteName,
        audio_string: audioString
    }
    const result = await db.collection("users").updateOne(
        { user_id: userID, 
        "patches.patch_name": patchName },
        { $push: { "patches.$.notes": note } }
    );
    console.log(`note added with name: ${noteName}`)
}

async function getNoteFromPatch(db, userID, patchName, noteName) {    
    const user = await db.collection("users").findOne(
        { user_id: userID }
    )

    // TODO: refactor this into a mongo query (can't figure it out right now)
    for (const patch of user.patches) {
        if (patch.patch_name == patchName) {
            for (const note of patch.notes) {
                if (note.note_name == noteName) {
                    return note;
                }
            }
        }
    }

    throw `Unable to find note: ${noteName}`;
}

async function getUID(db, email) {
    const user = await db.collection("users").findOne({email: email})
    return user.user_id
}

module.exports = {
    createUser,
    addPatchToUser,
    addNoteToPatch,
    getNoteFromPatch,
    getUID
}