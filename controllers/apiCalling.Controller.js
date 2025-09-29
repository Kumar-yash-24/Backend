const axios = require('axios');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const buildContents = (prompt, history = []) => {
	const mappedHistory = Array.isArray(history)
		? history
				.filter((msg) => typeof msg?.role === 'string' && typeof msg?.text === 'string')
				.map((msg) => ({
					role: msg.role === 'assistant' ? 'model' : 'user',
					parts: [{ text: msg.text }],
				}))
		: [];

	return [
		...mappedHistory,
		{
			role: 'user',
			parts: [{ text: prompt }],
		},
	];
};

exports.generateGeminiResponse = async (req, res) => {
	if (!GEMINI_API_KEY) {
		return res.status(500).json({ message: 'Gemini API key is not configured on the server.' });
	}

	const { prompt, history, generationConfig } = req.body || {};

	if (!prompt || typeof prompt !== 'string') {
		return res.status(400).json({ message: 'Prompt is required.' });
	}

	const model = req.body?.model || DEFAULT_MODEL;
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
	const payload = {
		contents: buildContents(prompt, history),
		generationConfig: {
			temperature: 0.7,
			topP: 0.8,
			topK: 40,
			maxOutputTokens: 2048,
			...generationConfig,
		},
	};

	try {
		const response = await axios.post(url, payload, {
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': GEMINI_API_KEY,
			},
			timeout: 20000,
		});

		const candidate = response.data?.candidates?.[0];
		const text = candidate?.content?.parts
			?.map((part) => part?.text || '')
			.join('')
			.trim();

		if (!text) {
			return res.status(502).json({ message: 'No content returned from Gemini API.' });
		}

		return res.status(200).json({
			text,
			model,
			usage: response.data?.usageMetadata || null,
		});
	} catch (error) {
		console.error('Gemini API error:', error.response?.data || error.message);
		const status = error.response?.status || 500;
		const message =
			error.response?.data?.error?.message ||
			error.response?.data?.message ||
			'Failed to generate response from Gemini API.';
		return res.status(status).json({ message });
	}
};
