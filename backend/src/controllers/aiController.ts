import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { edgeTtsService, INDIAN_FEMALE_VOICES } from '../services/edgeTtsService';

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

export const handleTtsSynthesis = async (req: Request, res: Response) => {
  try {
    const text = (req.query.text as string) || req.body.text;
    const voice =
      (req.query.voice as string) ||
      req.body.voice ||
      INDIAN_FEMALE_VOICES.HINDI;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text query or body parameter is required' });
    }

    const audioBuffer = await edgeTtsService.synthesize(text, voice);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(audioBuffer);
  } catch (err: any) {
    console.error('TTS Controller Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'TTS synthesis failed' });
  }
};

export const getAiStatus = async (req: Request, res: Response) => {
  const hasServerKey = Boolean(process.env.GROQ_API_KEY);
  return res.json({
    success: true,
    data: {
      hasServerKey,
      model: 'openai/gpt-oss-120b',
      ttsEngine: 'Microsoft Edge-TTS Neural (hi-IN-SwaraNeural & en-IN-NeerjaExpressiveNeural)',
      voices: INDIAN_FEMALE_VOICES,
    },
  });
};
