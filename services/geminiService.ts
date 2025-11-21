import { GoogleGenAI } from '@google/genai';
import { TimeSlot } from '../types.ts';

export const generateMeetingInvite = async (
  slot: TimeSlot, 
  attendeeNames: string[],
  context: string = "A project synchronization meeting"
): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Error: API Key not configured in environment.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const dateStr = slot.start.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = `${slot.start.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})} - ${slot.end.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}`;
    
    const prompt = `
      You are an executive assistant. Write a professional, concise, and friendly email invitation for a meeting.
      
      **Details:**
      - Topic: ${context}
      - Date: ${dateStr}
      - Time: ${timeStr}
      - Attendees: ${attendeeNames.join(', ')}
      
      **Format:**
      Subject: [Subject]
      
      [Body]
      
      Keep it under 100 words.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Could not generate invite.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error generating invite. Please check your API key.";
    }
};