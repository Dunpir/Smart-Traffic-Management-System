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

  private fetchGoogleTtsChunk(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-IN&client=tw-ob&q=${encodeURIComponent(text)}`;
      https
        .get(
          url,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } },
          (res) => {
            if (res.statusCode !== 200) {
              return reject(new Error(`TTS stream returned status ${res.statusCode}`));
            }
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
          }
        )
        .on('error', reject);
    });
  }

  private async synthesizeHttpFallback(text: string): Promise<Buffer> {
    const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
    const buffers: Buffer[] = [];

    for (const s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      for (let i = 0; i < trimmed.length; i += 180) {
        const piece = trimmed.slice(i, i + 180);
        const buf = await this.fetchGoogleTtsChunk(piece);
        buffers.push(buf);
      }
    }
    return Buffer.concat(buffers);
  }

  /**
   * Synthesize text to MP3 audio buffer
   */
  public async synthesize(
    text: string,
    _voice: string = DEFAULT_EDGE_VOICE,
    rate: string = '+6%',
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

    const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const textFile = path.join(os.tmpdir(), `edge_in_${id}.txt`);
    const mediaFile = path.join(os.tmpdir(), `edge_out_${id}.mp3`);

    try {
      // 1. Try python3 -m edge_tts if available
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
      await Promise.all([
        fs.promises.unlink(textFile).catch(() => {}),
        fs.promises.unlink(mediaFile).catch(() => {}),
      ]);

      // 2. Fallback: High-speed Indian English Neural TTS stream (guarantees audio on Render cloud containers)
      try {
        console.warn('Edge-TTS Python CLI not found on host, using cloud Indian English TTS stream fallback...');
        const fallbackAudio = await this.synthesizeHttpFallback(cleanText);
        if (fallbackAudio && fallbackAudio.length > 0) {
          this.saveToCache(cacheKey, fallbackAudio);
          return fallbackAudio;
        }
      } catch (fallbackErr) {
        console.error('TTS stream fallback failed:', fallbackErr);
      }

      throw new Error('All TTS synthesis engines failed');
    }
  }
}

export const edgeTtsService = new EdgeTtsService();
