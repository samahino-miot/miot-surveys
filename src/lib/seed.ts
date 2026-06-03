import { saveSurvey, Survey } from '../store';
import { v4 as uuidv4 } from 'uuid';

export const seedLiverSurvey = async () => {
    const liverSurvey: Survey = {
        id: 'liver-gym-feedback-form',
        title: 'MIOT Liver Gym – Patient Feedback Form',
        description: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        questions: [
            { id: 'q1', text: 'Name', type: 'text', required: true },
            { id: 'q2', text: 'Mobile Number', type: 'text', required: true },
            { id: 'q3', text: 'MR Number', type: 'text', required: true },
            { id: 'q4', text: 'Date of Visit', type: 'date', required: true },
            { id: 'q5', text: 'What was the most beneficial aspect of the MIOT Liver Gym Programme?', type: 'checkbox', required: true, options: ['Health assessment and screening', 'Doctor consultation', 'Diet and nutrition guidance', 'Exercise and lifestyle advice', 'Overall awareness about liver health', 'Other (please specify)'] },
            { id: 'q6', text: 'Has the programme motivated you to make positive lifestyle changes?', type: 'multiple_choice', required: true, options: ['Yes', 'No', 'Partly'] },
            { id: 'q7', text: 'Would you continue to take care of your liver as advised by MIOT doctor?', type: 'multiple_choice', required: true, options: ['Yes', 'No', 'Not Sure'] },
            { id: 'q8', text: 'On a scale of 1 to 5, how satisfied are you with the MIOT Liver Gym Programme?', type: 'rating', required: true },
            { id: 'q9', text: 'Would you recommend the MIOT Liver-Gym Programme to your family and friends?', type: 'multiple_choice', required: true, options: ['Yes', 'No', 'Maybe'] },
            { id: 'q10', text: 'Would you be interested in attending future liver health programmes or follow-up sessions?', type: 'multiple_choice', required: true, options: ['Yes', 'No'] },
            { id: 'q11', text: 'How did you first hear about the MIOT Liver Gym Programme?', type: 'multiple_choice', required: true, options: ['Doctor recommendation', 'Newspaper advertisement', 'Social media / Website', 'Family/Friends', 'Apartment Posters', 'Corporate Led', 'Outdoor LED', 'Other (please specify)'] },
            { id: 'q12', text: 'Any additional comments or suggestions?', type: 'text', required: false }
        ]
    };
    
    await saveSurvey(liverSurvey);
    console.log('Survey seeded successfully');
};
