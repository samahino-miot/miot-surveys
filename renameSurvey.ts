import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function rename() {
    try {
        const surveyRef = doc(db, 'surveys', 'test-survey-1774431512613');
        await updateDoc(surveyRef, {
            title: "MIOT International Patient Experience Survey"
        });
        console.log("Renamed successfully!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
rename();
