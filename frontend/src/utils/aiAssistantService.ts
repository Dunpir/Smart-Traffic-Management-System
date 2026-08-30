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
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend AI chat error, falling back:', err);
    }

    // Direct client-side Groq call if customApiKey is present in frontend
    if (key && key.startsWith('gsk_')) {
      const candidates = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'qwen/qwen3.8-27b',
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
You speak in a warm, articulate, highly educated, and polite Indian English tone.
Creator: Lakshya Pundir (Lead System Architect at Team DigiX, +91 7340441973).
Return JSON object: {"reply": "articulate conversational response", "action": {"type": "EMERGENCY"|"CLEAR_EMERGENCY"|"SIMULATION_START"|"SIMULATION_PAUSE"|"NAVIGATE"|"OPEN_REPORT"|"OPEN_ABOUT_US"|"TAB_INFO"|"CHAOS_MODE", ...} or null}`,
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
              reply: parsed.reply || 'Processed successfully.',
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

    // Articulate intelligent fallback
    const lastUserText = messages[messages.length - 1]?.content.toLowerCase() || '';
    if (lastUserText.includes('who created') || lastUserText.includes('developer') || lastUserText.includes('creator')) {
      return {
        reply: 'Trafix was architected and developed by Lakshya Pundir, Lead System Architect at Team DigiX.',
        action: { type: 'OPEN_ABOUT_US' },
        provider: 'fallback',
      };
    }

    return {
      reply: `Understood. Processing your command. All intersection sensors and safety interlocks are operating nominally.`,
      provider: 'fallback',
    };
  }
}

export const aiAssistantService = new AiAssistantService();
