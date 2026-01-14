// ⚠️ ไฟล์นี้รันบน Vercel Serverless Function
// API Key จะถูกเก็บใน Environment Variables (ไม่รั่วไหล)

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // ตั้งค่า CORS (ป้องกันการเรียกใช้จากเว็บอื่น)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // รับเฉพาะ POST request
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question, model } = req.body;

        // ตรวจสอบ input
        if (!question || !model) {
            return res.status(400).json({ error: 'ต้องระบุ question และ model' });
        }

        // ดึง API Key จาก Environment Variable (ปลอดภัย 100%)
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error('❌ GROQ_API_KEY not found in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // เรียก Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Groq API Error:', errorData);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const answer = data.choices[0].message.content;

        // ส่งคำตอบกลับ
        return res.status(200).json({ answer });

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ 
            error: 'เกิดข้อผิดพลาดในการประมวลผล: ' + error.message 
        });
    }
};
