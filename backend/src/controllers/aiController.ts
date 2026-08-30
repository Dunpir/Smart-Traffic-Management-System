import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export const handleAiChat = async (req: Request, res: Response) => {
  try {
    const { messages, clientContext } = req.body;
    const customApiKey = (req.headers['x-groq-api-key'] as string) || req.body.apiKey;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    const result = await aiService.chat(messages, customApiKey, clientContext);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('AI Controller Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
};

export const getAiStatus = async (req: Request, res: Response) => {
  const hasServerKey = Boolean(process.env.GROQ_API_KEY);
  return res.json({
    success: true,
    data: {
      hasServerKey,
      model: 'llama-3.3-70b-versatile',
      ttsEngine: 'Edge-TTS / Web Speech Indian Female',
    },
  });
};
