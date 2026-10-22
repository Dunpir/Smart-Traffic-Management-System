/**
 * Edge-TTS Neural Voice Service
 * Locked to Indian voice with seamless cloud fallback
 * In-memory caching provides instant zero-latency speech playback
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

const execAsync = promisify(exec);

export const DEFAULT_EDGE_VOICE = 'en-IN-NeerjaExpressiveNeural';

export const INDIAN_FEMALE_VOICES = {
  ENGLISH_EXPRESSIVE: 'en-IN-NeerjaExpressiveNeural',
} as const;

export class EdgeTtsService {
  private cache = new Map<string, Buffer>();
  private readonly MAX_CACHE_SIZE = 400;

  private saveToCache(key: string, buffer: Buffer) {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, buffer);
  }

  /**
   * Checks for pre-generated authentic NeerjaExpressive MP3 assets
   */
  private getPreGeneratedAudio(cleanText: string): Buffer | null {
    try {
      const baseDir = path.resolve(__dirname, '../../../frontend/public/audio');
      const lower = cleanText.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

      // Check tab briefings
      const voicesDir = path.join(baseDir, 'voices');
      if (fs.existsSync(voicesDir)) {
        const files = fs.readdirSync(voicesDir);
        for (const f of files) {
          if (f.endsWith('.mp3')) {
            const tabName = f.replace('.mp3', '');
            if (lower.startsWith(`welcome to the ${tabName}`) || lower.includes(tabName)) {
              return fs.readFileSync(path.join(voicesDir, f));
            }
          }
        }
      }

      // Check assistant core phrases
      const assistantDir = path.join(baseDir, 'assistant');
      if (fs.existsSync(assistantDir)) {
        const files = fs.readdirSync(assistantDir);
        for (const f of files) {
          if (f.endsWith('.mp3')) {
            const key = f.replace('.mp3', '');
            if (lower.includes(key.replace('_', ' '))) {
              return fs.readFileSync(path.join(assistantDir, f));
            }
          }
        }
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Synthesize text to MP3 audio buffer strictly using authentic Neerja Indian Neural voice
   */
  public async synthesize(
    text: string,
    _voice: string = DEFAULT_EDGE_VOICE,
    rate: string = '+0%',
    pitch: string = '+0Hz'
  ): Promise<Buffer> {
    if (!text || !text.trim()) {
      throw new Error('Text parameter is required for TTS synthesis');
    }

    const voice = DEFAULT_EDGE_VOICE;

    const cleanText = text
      .replace(/[\r\n]+/g, ' ')
      .replace(/[*#`_~[\]()]/g, '')
      .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    // Check memory cache for instant 0ms latency playback
    const cacheKey = `${voice}:${rate}:${pitch}:${cleanText}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check static pre-generated authentic audio
    const preGen = this.getPreGeneratedAudio(cleanText);
    if (preGen) {
      this.saveToCache(cacheKey, preGen);
      return preGen;
    }

    const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const textFile = path.join(os.tmpdir(), `edge_in_${id}.txt`);
    const mediaFile = path.join(os.tmpdir(), `edge_out_${id}.mp3`);

    try {
      // 1. Try python3 -m edge_tts with primary expressive voice: en-IN-NeerjaExpressiveNeural
      await fs.promises.writeFile(textFile, cleanText, 'utf8');
      const cmd = `python3 -m edge_tts --file "${textFile}" --voice "${voice}" --rate "${rate}" --pitch "${pitch}" --write-media "${mediaFile}"`;
      await execAsync(cmd, { timeout: 20000 });

      if (fs.existsSync(mediaFile)) {
        const audioBuffer = await fs.promises.readFile(mediaFile);
        this.saveToCache(cacheKey, audioBuffer);

        await Promise.all([
          fs.promises.unlink(textFile).catch(() => {}),
          fs.promises.unlink(mediaFile).catch(() => {}),
        ]);

        return audioBuffer;
      }
      throw new Error('Python Edge-TTS output file not found');
    } catch {
      // 2. Try python3 -m edge_tts with sister standard voice: en-IN-NeerjaNeural
      try {
        const fallbackVoice = 'en-IN-NeerjaNeural';
        const fallbackCmd = `python3 -m edge_tts --file "${textFile}" --voice "${fallbackVoice}" --rate "${rate}" --pitch "${pitch}" --write-media "${mediaFile}"`;
        await execAsync(fallbackCmd, { timeout: 20000 });

        if (fs.existsSync(mediaFile)) {
          const audioBuffer = await fs.promises.readFile(mediaFile);
          this.saveToCache(cacheKey, audioBuffer);

          await Promise.all([
            fs.promises.unlink(textFile).catch(() => {}),
            fs.promises.unlink(mediaFile).catch(() => {}),
          ]);

          return audioBuffer;
        }
      } catch {
        // Fall through
      }

      await Promise.all([
        fs.promises.unlink(textFile).catch(() => {}),
        fs.promises.unlink(mediaFile).catch(() => {}),
      ]);

      throw new Error('Edge-TTS synthesis engine unavailable');
    }
  }
}

export const edgeTtsService = new EdgeTtsService();
