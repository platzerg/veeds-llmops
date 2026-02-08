import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const key = process.env.OPENAI_API_KEY;
    console.log('Testing key starting with:', key ? key.substring(0, 10) : 'MISSING');

    try {
        const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 5
        }, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Success! Response:', resp.data.choices[0].message.content);
    } catch (err) {
        console.error('❌ Failed:', err.response?.status, err.response?.data || err.message);
    }
}

test();
