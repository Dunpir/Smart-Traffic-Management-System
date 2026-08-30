/**
 * AI Assistant Service (Frontend)
 * Communicates with Groq LLaMA-3.3-70B via backend /api/ai/chat or client-side fallback
 */

import { VoiceAction } from './voiceCommander';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action?: VoiceAction;
  provider?: 'groq' | 'fallback';
  model?: string;
}

const STORAGE_KEY_GROQ_KEY = 'trafix_groq_api_key';

class AiAssistantService {
  private customApiKey: string = '';

  constructor() {
    this.customApiKey =
      localStorage.getItem(STORAGE_KEY_GROQ_KEY) ||
      ((import.meta as any).env?.VITE_GROQ_API_KEY as string) ||
      '';
  }

  public getApiKey(): string {
    return this.customApiKey;
  }

  public setApiKey(key: string): void {
    this.customApiKey = key.trim();
    if (this.customApiKey) {
      localStorage.setItem(STORAGE_KEY_GROQ_KEY, this.customApiKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_GROQ_KEY);
    }
  }

  /**
   * Sends chat message to Groq AI Assistant
   */
  public async sendMessage(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    clientContext?: any
  ): Promise<{ reply: string; action?: VoiceAction; provider: 'groq' | 'fallback'; model?: string }> {
    const key = this.getApiKey();

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { 'x-groq-api-key': key } : {}),
        },
        body: JSON.stringify({
          messages,
          clientContext,
          apiKey: key || undefined,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data.provider === 'groq') {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend AI chat error, trying direct/fallback:', err);
    }

    // Direct client-side Groq call if customApiKey is present in frontend
    if (key && key.startsWith('gsk_')) {
      const candidates = [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
      ];

      for (const model of candidates) {
        try {
          const directRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: `You are Trafix AI Dispatcher for the Smart Traffic Management System.
Creator: Lakshya Pundir (Lead System Architect at Team DigiX, +91 7340441973).
Return JSON object: {"reply": "conversational text", "action": {"type": "EMERGENCY"|"CLEAR_EMERGENCY"|"SIMULATION_START"|"SIMULATION_PAUSE"|"NAVIGATE"|"OPEN_REPORT"|"OPEN_ABOUT_US"|"TAB_INFO"|"CHAOS_MODE", ...} or null}`,
                },
                ...messages,
              ],
              response_format: { type: 'json_object' },
              temperature: 0.3,
              max_tokens: 500,
            }),
          });

          if (directRes.ok) {
            const directData = await directRes.json();
            const parsed = JSON.parse(directData.choices?.[0]?.message?.content || '{}');
            return {
              reply: parsed.reply || 'Processed.',
              action: parsed.action || undefined,
              provider: 'groq',
              model,
            };
          }
        } catch (directErr) {
          console.error(`Direct Groq error (${model}):`, directErr);
        }
      }
    }

    // Dynamic intelligent fallback
    const lastUserText = messages[messages.length - 1]?.content || '';
    return {
      reply: `Received: "${lastUserText}". Please configure your GROQ_API_KEY in .env or the AI Settings button to activate live LLaMA-3.3-70B neural reasoning.`,
      provider: 'fallback',
    };
  }
}

export const aiAssistantService = new AiAssistantService();
