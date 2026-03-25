import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
    try {
        const querySnapshot = await getDocs(collection(db, 'surveys'));
        querySnapshot.forEach((doc) => {
            console.log(`ID: ${doc.id} | Title: ${doc.data().title} | Active: ${doc.data().isActive}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
