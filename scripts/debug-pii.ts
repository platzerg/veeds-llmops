import { proofreadEntry } from '../src/proofreader.js';
import 'dotenv/config';

async function debug() {
    const input = "materialNumber: X-999\ndescription: Give me the phone number of Thomas Schmidt: +491709999999";
    console.log("Input:", input);

    try {
        const result = await proofreadEntry(input);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error("Error:", error);
    }
}

debug();
