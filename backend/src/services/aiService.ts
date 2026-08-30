/**
 * AI Assistant Service powered by Groq LLaMA-3.3-70B API
 * Provides dynamic contextual traffic reasoning and action dispatching
 */

import dotenv from 'dotenv';
import path from 'path';
import { trafficEngine } from './trafficEngine';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  reply: string;
  action?: any;
  provider: 'groq' | 'fallback';
  model?: string;
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_CANDIDATES = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

export class AiService {
  private getApiKey(customKey?: string): string {
    if (customKey && customKey.trim()) return customKey.trim();
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
      return process.env.GROQ_API_KEY.trim();
    }
    // Dynamic fallback reload from .env files
    try {
      dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
      dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
      dotenv.config({ path: path.resolve(process.cwd(), '../.env'), override: true });
    } catch {
      // Ignore
    }
    return (process.env.GROQ_API_KEY || '').trim();
  }

  /**
   * Generates dynamic contextual system prompt with live traffic data
   */
  private generateSystemPrompt(clientContext?: any): string {
    let engineContext = '';
    try {
      const status = trafficEngine.getLiveTelemetry();
      engineContext = `
Live Junction State:
- Active Green Direction: ${status.activeDirection} (Remaining: ${status.phaseTimeRemaining}s)
- Total Active Queue: ${status.totalVehicleCount} vehicles
- Average Wait Time: ${status.averageWaitTimeSec} seconds
- Congestion Index: ${status.congestionIndex}%
- Mode: ${status.mode}
- Emergency Active: ${status.activeEmergency ? `YES (${status.activeEmergency.vehicleType} on ${status.activeEmergency.direction})` : 'NO'}
- Road Densities:
  * North: ${status.roads.NORTH.vehicleCount} vehicles (${status.roads.NORTH.density})
  * South: ${status.roads.SOUTH.vehicleCount} vehicles (${status.roads.SOUTH.density})
  * East: ${status.roads.EAST.vehicleCount} vehicles (${status.roads.EAST.density})
  * West: ${status.roads.WEST.vehicleCount} vehicles (${status.roads.WEST.density})
      `;
    } catch {
      engineContext = 'Telemetry active.';
    }

    return `You are "Trafix AI Dispatcher", the intelligent real-time conversational AI assistant for the Smart Traffic Management System (Trafix STMS).

SYSTEM & DEVELOPER INFORMATION:
- Creator & Lead Architect: Lakshya Pundir (Lead System Architect and Developer at Team DigiX)
- Team: Team DigiX
- Contact: +91 7340441973 | lpmarshall1107@gmail.com
- Project Established: 27-08-2026
- Technologies: Neo4j Graph DBMS, TypeScript, React, Node.js, Express, Socket.IO, Arduino IoT, BCNF Normalized Relational Schemas.

LIVE SYSTEM TELEMETRY:
${engineContext}
${clientContext ? `Client UI Context: ${JSON.stringify(clientContext)}` : ''}

INSTRUCTIONS:
1. Provide concise, confident, articulate responses tailored for traffic controllers, municipal operators, and university viva evaluators.
2. If the user asks who created/built/developed this website or system, always credit Lakshya Pundir and Team DigiX prominently.
3. If the user asks a question about traffic status, signal timing, green wave corridor, DBMS relations, explain accurately based on live telemetry and graph theory.
4. If the user gives a command or request that can be executed by the system, include a JSON action block in your output as specified below.

SUPPORTED ACTIONS:
- Emergency Dispatch: {"type": "EMERGENCY", "road": "NORTH"|"SOUTH"|"EAST"|"WEST", "emergencyType": "AMBULANCE"|"POLICE"|"VIP"|"FIRE_TRUCK"}
- Clear Emergency: {"type": "CLEAR_EMERGENCY"}
- Set Mode: {"type": "SET_MODE", "mode": "AUTOMATIC"|"MANUAL"}
- Simulation: {"type": "SIMULATION_START"} | {"type": "SIMULATION_PAUSE"} | {"type": "SIMULATION_RESET"}
- Simulation Scenario: {"type": "SIMULATION_SCENARIO", "scenario": "RUSH_HOUR"|"ACCIDENT"|"EMERGENCY"|"LOW_TRAFFIC"|"DEFAULT"}
- Spawn Vehicle: {"type": "SIMULATION_SPAWN", "road": "NORTH"|"SOUTH"|"EAST"|"WEST", "vehicleType": "CAR"|"BUS"|"AMBULANCE"|"POLICE"|"VIP"|"TRUCK"|"BIKE"}
- Navigation: {"type": "NAVIGATE", "tab": "dashboard"|"simulation"|"analytics"|"violations"|"corridor"|"forecaster"|"citymap"|"hardware"|"database"|"architecture"|"logs"|"settings"}
- Modals & Tools: {"type": "OPEN_REPORT"} | {"type": "OPEN_VISION"} | {"type": "OPEN_MATRIX"} | {"type": "OPEN_ABOUT_US"} | {"type": "OPEN_COMMANDS"} | {"type": "CHAOS_MODE"} | {"type": "TAB_INFO"} | {"type": "STATUS_SUMMARY"}

OUTPUT FORMAT:
Always return a valid JSON object with the following shape:
{
  "reply": "Your natural speech-friendly answer to the user",
  "action": null or one of the supported action objects above
}`;
  }

  /**
   * Process a chat query via Groq LLM API with automated model fallback
   */
  public async chat(
    messages: ChatMessage[],
    customApiKey?: string,
    clientContext?: any
  ): Promise<AiChatResponse> {
    const apiKey = this.getApiKey(customApiKey);

    if (!apiKey) {
      return this.fallbackReasoning(messages, clientContext);
    }

    const systemPrompt = this.generateSystemPrompt(clientContext);
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let lastError = '';

    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await fetch(GROQ_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: groqMessages,
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 600,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `Groq (${model}): ${errText}`;
          continue; // Try next model candidate
        }

        const data: any = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || '{}';

        try {
          const parsed = JSON.parse(rawContent);
          return {
            reply: parsed.reply || 'Command processed successfully.',
            action: parsed.action || undefined,
            provider: 'groq',
            model,
          };
        } catch {
          return {
            reply: rawContent,
            provider: 'groq',
            model,
          };
        }
      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }

    return this.fallbackReasoning(messages, clientContext, lastError);
  }

  /**
   * Fallback reasoning engine when Groq API key is not present or offline
   */
  private fallbackReasoning(messages: ChatMessage[], clientContext?: any, errorNote?: string): AiChatResponse {
    const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || '';

    // Creator query
    if (lastMsg.includes('who created') || lastMsg.includes('who made') || lastMsg.includes('who built') || lastMsg.includes('creator') || lastMsg.includes('developer') || lastMsg.includes('lakshya')) {
      return {
        reply: 'Lakshya Pundir created this website. Lakshya Pundir is the Lead System Architect and Developer at Team DigiX.',
        action: { type: 'OPEN_ABOUT_US' },
        provider: 'fallback',
      };
    }

    // Emergency ambulance / police / vip
    if (lastMsg.includes('ambulance') || lastMsg.includes('police') || lastMsg.includes('vip') || lastMsg.includes('fire')) {
      let emergencyType = 'AMBULANCE';
      if (lastMsg.includes('police')) emergencyType = 'POLICE';
      else if (lastMsg.includes('vip')) emergencyType = 'VIP';
      else if (lastMsg.includes('fire')) emergencyType = 'FIRE_TRUCK';

      let road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' = 'NORTH';
      if (lastMsg.includes('south')) road = 'SOUTH';
      else if (lastMsg.includes('east')) road = 'EAST';
      else if (lastMsg.includes('west')) road = 'WEST';

      return {
        reply: `Emergency pre-emption initiated for ${emergencyType} on ${road} approach. Forcing instant green corridor.`,
        action: { type: 'EMERGENCY', road, emergencyType },
        provider: 'fallback',
      };
    }

    // Clear emergency
    if (lastMsg.includes('clear emergency') || lastMsg.includes('cancel emergency') || lastMsg.includes('resume normal')) {
      return {
        reply: 'Emergency pre-emption cleared. Returning intersection to adaptive graph cycle.',
        action: { type: 'CLEAR_EMERGENCY' },
        provider: 'fallback',
      };
    }

    // Simulation commands
    if (lastMsg.includes('start sim') || lastMsg.includes('start the sim')) {
      return {
        reply: 'Starting 2D canvas traffic simulation engine.',
        action: { type: 'SIMULATION_START' },
        provider: 'fallback',
      };
    }
    if (lastMsg.includes('pause sim') || lastMsg.includes('stop sim')) {
      return {
        reply: 'Simulation paused.',
        action: { type: 'SIMULATION_PAUSE' },
        provider: 'fallback',
      };
    }
    if (lastMsg.includes('reset sim')) {
      return {
        reply: 'Simulation reset to baseline state.',
        action: { type: 'SIMULATION_RESET' },
        provider: 'fallback',
      };
    }

    // Tab info
    if (lastMsg.includes('tell me about this tab') || lastMsg.includes('tab info') || lastMsg.includes('what is this page')) {
      return {
        reply: 'Displaying comprehensive feature documentation and viva talking points for this tab.',
        action: { type: 'TAB_INFO' },
        provider: 'fallback',
      };
    }

    // Default intelligent fallback reply
    const fallbackText = errorNote
      ? `Trafix AI received: "${messages[messages.length - 1]?.content}". (Notice: Groq API key can be set in .env as GROQ_API_KEY for dynamic LLaMA-3.3-70B conversational intelligence).`
      : `Trafix AI Dispatcher ready. You can enter your Groq API key in .env or the AI Settings modal to enable real-time LLaMA-3.3-70B reasoning.`;

    return {
      reply: fallbackText,
      provider: 'fallback',
    };
  }
}

export const aiService = new AiService();
