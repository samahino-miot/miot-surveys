import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  try {
    const surveyId = "test-survey-" + Date.now();
    const surveyRef = doc(collection(db, 'surveys'), surveyId);
    
    await setDoc(surveyRef, {
      id: surveyId,
      title: "MIOT Patient Feedback Survey",
      description: "Please help us improve our services by providing your valuable feedback.",
      isActive: true,
      createdAt: new Date().toISOString(),
      questions: [
        { id: `q_11_${Date.now()}`, text: '11. How long have you been consulting in MIOT?', type: 'multiple_choice', options: ['1st Visit', '<1 month', '1 month – 5yrs', '>5yrs'], required: true },
        { id: `q_12_${Date.now()}`, text: '12. How did you know about MIOT?', type: 'checkbox', options: ['Newspaper', 'Magazine', 'Television', 'Radio', 'Theatre Ads', 'Newspaper Inserts', 'Apartment posters', 'Friends', 'Relatives', 'Colleagues', 'Outdoor Hoardings/ Bus Shelters', 'Corporate Tie-up', 'Outreach Clinics', 'Referred by Doctor', 'Digital (Website/Google/Social Media)', 'Others'], required: true },
        { id: `q_16_${Date.now()}`, text: '16. I will return to MIOT for further treatment: (Trust)', type: 'multiple_choice', options: ['Yes', 'No'], required: true }
      ]
    });
    console.log("Successfully created test survey with ID:", surveyId);
    process.exit(0);
  } catch (error) {
    console.error("Error creating survey:", error);
    process.exit(1);
  }
}

seed();
