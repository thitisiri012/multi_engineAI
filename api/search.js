const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'GROQ_API_KEY not configured in Vercel Environment Variables' 
        });
    }

    const { question, model } = req.body;

    if (!question || !model) {
        return res.status(400).json({ error: 'Missing question or model' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: question }],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: `Groq API error: ${errorText}` 
            });
        }

        const data = await response.json();
        return res.status(200).json({ 
            answer: data.choices[0].message.content 
        });

    } catch (error) {
        return res.status(500).json({ 
            error: `Server error: ${error.message}` 
        });
    }
};
