// Vercel Serverless Function - Groq AI Search API
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // ตั้งค่า CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // รับเฉพาะ POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // ตรวจสอบ API Key
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('❌ Missing GROQ_API_KEY');
            return res.status(500).json({ 
                error: 'Server configuration error: API Key not found' 
            });
        }

        // ดึงข้อมูลจาก request
        const { question, model } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'กรุณาระบุคำถาม' });
        }

        if (!model) {
            return res.status(400).json({ error: 'กรุณาเลือก Model' });
        }

        console.log('📤 Calling Groq API with model:', model);

        // เรียก Groq API
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: question
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 1,
                stream: false
            })
        });

        // ตรวจสอบ response
        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error('❌ Groq API Error:', errorText);
            
            return res.status(groqResponse.status).json({ 
                error: `Groq API Error (${groqResponse.status}): ${errorText}` 
            });
        }

        // แปลง response เป็น JSON
        const data = await groqResponse.json();

        // ตรวจสอบโครงสร้างข้อมูล
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ Invalid response structure:', data);
            return res.status(500).json({ 
                error: 'Invalid response from Groq API' 
            });
        }

        const answer = data.choices[0].message.content;

        console.log('✅ Success! Answer length:', answer.length);

        // ส่งผลลัพธ์
        return res.status(200).json({ 
            answer: answer,
            model: model,
            usage: data.usage || null
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return res.status(500).json({ 
            error: `Server error: ${error.message}` 
        });
    }
};
