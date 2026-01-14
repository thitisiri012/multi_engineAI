const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
        console.error('Missing GROQ_API_KEY');
        return res.status(500).json({ 
            error: 'Server configuration error: GROQ_API_KEY not set' 
        });
    }

    // Get request body
    const { question, model } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Missing question' });
    }

    if (!model) {
        return res.status(400).json({ error: 'Missing model' });
    }

    try {
        // Call Groq API
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
            const errorText = await response.text();
            console.error('Groq API error:', errorText);
            return res.status(response.status).json({ 
                error: `Groq API error: ${errorText}` 
            });
        }

        const data = await response.json();
        const answer = data.choices[0].message.content;

        return res.status(200).json({ answer });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: `Server error: ${error.message}` 
        });
    }
};
