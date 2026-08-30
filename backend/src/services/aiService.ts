/**
 * AI Assistant Service powered by Groq LLaMA-3.3-70B API
 * Provides dynamic contextual traffic reasoning and action dispatching
 * Tuned with an articulate, educated, professional Indian English demeanor
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
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

export class AiService {
  private getApiKey(customKey?: string): string {
    if (customKey && customKey.trim()) return customKey.trim();
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
      return process.env.GROQ_API_KEY.trim();
    }
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

    return `You are "Trafix AI Dispatcher", an intelligent, highly articulate, polite, and professional traffic control assistant for the Smart Traffic Management System (Trafix STMS).

DEMEANOR & VOCAL PERSONA:
- Speak in a natural, refined, educated Indian English tone (courteous, authoritative, clear, and articulate).
- Maintain crisp grammar and professional enunciation. Avoid robotic or disjointed phrases.
- Be concise, direct, and helpful.

SYSTEM & DEVELOPER INFORMATION:
- Creator & Lead Architect: Lakshya Pundir (Lead System Architect and Developer at Team DigiX)
- Team: Team DigiX
- Contact: +91 7340441973 | lpmarshall1107@gmail.com
- Technologies: Neo4j Graph DBMS, TypeScript, React, Node.js, Express, Socket.IO, Arduino IoT, BCNF Normalized Relational Schemas.

LIVE SYSTEM TELEMETRY:
${engineContext}
${clientContext ? `Client UI Context: ${JSON.stringify(clientContext)}` : ''}

INSTRUCTIONS:
1. Provide polished, articulate responses tailored for traffic controllers, municipal officers, and university evaluators.
2. If the user asks who created, built, or developed this system, prominently credit Lakshya Pundir and Team DigiX.
3. If the user gives an operational instruction or command, always return a valid JSON object containing your "reply" and an optional "action" block.

SUPPORTED ACTIONS:
- Emergency Dispatch: {"type": "EMERGENCY", "road": "NORTH"|"SOUTH"|"EAST"|"WEST", "emergencyType": "AMBULANCE"|"POLICE"|"VIP"|"FIRE_TRUCK"}
- Clear Emergency: {"type": "CLEAR_EMERGENCY"}
- Set Mode: {"type": "SET_MODE", "mode": "AUTOMATIC"|"MANUAL"}
- Simulation: {"type": "SIMULATION_START"} | {"type": "SIMULATION_PAUSE"} | {"type": "SIMULATION_RESET"}
- Simulation Scenario: {"type": "SIMULATION_SCENARIO", "scenario": "RUSH_HOUR"|"ACCIDENT"|"EMERGENCY"|"LOW_TRAFFIC"|"DEFAULT"}
- Spawn Vehicle: {"type": "SIMULATION_SPAWN", "road": "NORTH"|"SOUTH"|"EAST"|"WEST", "vehicleType": "CAR"|"BUS"|"AMBULANCE"|"POLICE"|"VIP"|"TRUCK"|"BIKE"}
- Navigation: {"type": "NAVIGATE", "tab": "dashboard"|"simulation"|"analytics"|"violations"|"corridor"|"forecaster"|"citymap"|"hardware"|"database"|"architecture"|"logs"|"settings"}
- Modals & Tools: {"type": "OPEN_REPORT"} | {"type": "OPEN_VISION"} | {"type": "OPEN_MATRIX"} | {"type": "OPEN_ABOUT_US"} | {"type": "OPEN_COMMANDS"} | {"type": "CHAOS_MODE"} | {"type": "TAB_INFO"} | {"type": "STATUS_SUMMARY"}

JSON RESPONSE FORMAT:
{
  "reply": "Your articulate spoken response here",
  "action": {"type": "..."} // or null if pure conversational answer
}`;
  }

  public async chat(
    messages: ChatMessage[],
    clientContext?: any,
    customApiKey?: string
  ): Promise<AiChatResponse> {
    const apiKey = this.getApiKey(customApiKey);

    if (!apiKey) {
      return this.fallbackReasoning(messages, clientContext);
    }

    const systemPrompt = this.generateSystemPrompt(clientContext);
    const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

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
            messages: fullMessages,
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `Groq (${model}): ${errText}`;
          continue;
        }

        const data: any = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || '{}';

        try {
          const parsed = JSON.parse(rawContent);
          return {
            reply: parsed.reply || 'Your request has been processed successfully.',
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
        reply: 'Trafix was architected and developed by Lakshya Pundir, Lead System Architect at Team DigiX.',
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

      let road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' = 'WEST';
      if (lastMsg.includes('north')) road = 'NORTH';
      else if (lastMsg.includes('south')) road = 'SOUTH';
      else if (lastMsg.includes('east')) road = 'EAST';

      return {
        reply: `Certainly. Priority pre-emption sequence engaged for ${emergencyType.replace('_', ' ')} on the ${road} approach. All conflicting signals have been interlocked to Red.`,
        action: { type: 'EMERGENCY', road, emergencyType },
        provider: 'fallback',
      };
    }

    // Clear emergency
    if (lastMsg.includes('clear emergency') || lastMsg.includes('cancel emergency') || lastMsg.includes('resume normal')) {
      return {
        reply: 'Emergency pre-emption has been cleared. The intersection is now resuming adaptive traffic graph scheduling.',
        action: { type: 'CLEAR_EMERGENCY' },
        provider: 'fallback',
      };
    }

    // Simulation commands
    if (lastMsg.includes('start sim') || lastMsg.includes('start the sim')) {
      return {
        reply: 'Starting the traffic simulation engine now.',
        action: { type: 'SIMULATION_START' },
        provider: 'fallback',
      };
    }
    if (lastMsg.includes('pause sim') || lastMsg.includes('stop sim')) {
      return {
        reply: 'The traffic simulation has been paused.',
        action: { type: 'SIMULATION_PAUSE' },
        provider: 'fallback',
      };
    }
    if (lastMsg.includes('reset sim')) {
      return {
        reply: 'Resetting the simulation environment to baseline parameters.',
        action: { type: 'SIMULATION_RESET' },
        provider: 'fallback',
      };
    }

    // Tab info
    if (lastMsg.includes('tell me about this tab') || lastMsg.includes('tab info') || lastMsg.includes('what is this page')) {
      return {
        reply: 'Opening the detailed system reference and viva evaluation points for this module.',
        action: { type: 'TAB_INFO' },
        provider: 'fallback',
      };
    }

    // Default articulate fallback reply
    const lastUserText = messages[messages.length - 1]?.content || 'your command';
    return {
      reply: `Understood. Processing your inquiry regarding "${lastUserText}". All intersection telemetry and safety interlocks remain nominal.`,
      provider: 'fallback',
    };
  }
}

export const aiService = new AiService();
