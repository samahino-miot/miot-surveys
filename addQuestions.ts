import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function addQuestions() {
    try {
        const surveyRef = doc(db, 'surveys', 'test-survey-1774431512613');
        const surveySnap = await getDoc(surveyRef);
        if (surveySnap.exists()) {
            const data = surveySnap.data();
            let questions = data.questions || [];
            
            // Generate IDs
            const now = Date.now();
            const q12Id = `q_12_${now}`;
            const q13Id = `q_13_${now}`;
            
            const newQuestions = [
                { 
                    id: `q_11_${now}`, 
                    text: '11. How long have you been consulting in MIOT?', 
                    type: 'multiple_choice', 
                    options: ['1st Visit', '<1 month', '1 month – 5yrs', '>5yrs'], 
                    required: true 
                },
                { 
                    id: q12Id, 
                    text: '12. How did you know about MIOT?', 
                    type: 'checkbox', 
                    options: ['Newspaper', 'Magazine', 'Television', 'Radio', 'Theatre Ads', 'Newspaper Inserts', 'Apartment posters', 'Friends', 'Relatives', 'Colleagues', 'Outdoor Hoardings/ Bus Shelters', 'Corporate Tie-up', 'Outreach Clinics', 'Referred by Doctor', 'Digital (Website/Google/Social Media)', 'Others'], 
                    required: true 
                },
                { 
                    id: `q_12_other_${now}`, 
                    text: 'Please specify other source:', 
                    type: 'text', 
                    required: true, 
                    condition: { dependsOnId: q12Id, equals: 'Others' } 
                },
                { 
                    id: q13Id, 
                    text: '13. Who/What influenced your decision to choose MIOT?', 
                    type: 'checkbox', 
                    options: ['Newspaper', 'Magazine', 'Television', 'Radio', 'Newspaper Inserts', 'Apartment posters', 'Neighbourhood', 'Friends', 'Relatives', 'Colleague', 'Outdoor Hoardings/ Bus Shelters', 'Corporate tie-up', 'Theatre Ads', 'Outreach clinics', 'Referred by Doctor', 'Treating Doctor', 'Emergency', 'Digital (Website/Google/Social Media)', 'Brand Name', 'Others'], 
                    required: true 
                },
                { 
                    id: `q_13_other_${now}`, 
                    text: 'Please specify other influence:', 
                    type: 'text', 
                    required: true, 
                    condition: { dependsOnId: q13Id, equals: 'Others' } 
                }
            ];
            
            // Append new questions
            questions = [...questions, ...newQuestions];
            
            await updateDoc(surveyRef, { questions });
            console.log("Questions added successfully!");
        } else {
            console.log("Survey not found");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
addQuestions();
