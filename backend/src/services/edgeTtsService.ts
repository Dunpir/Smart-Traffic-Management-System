/**
 * Edge-TTS Neural Voice Service
 * Synthesizes high-fidelity Indian Female voice (en-IN-NeerjaExpressiveNeural)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export const DEFAULT_EDGE_VOICE = 'en-IN-NeerjaExpressiveNeural';

export const INDIAN_FEMALE_VOICES = {
  ENGLISH_EXPRESSIVE: 'en-IN-NeerjaExpressiveNeural',
  ENGLISH_NATURAL: 'en-IN-NeerjaNeural',
  HINDI: 'hi-IN-SwaraNeural',
} as const;

export class EdgeTtsService {
  /**
   * Synthesize text to MP3 audio buffer using Edge-TTS en-IN-NeerjaExpressiveNeural
   */
  public async synthesize(
    text: string,
    voice: string = DEFAULT_EDGE_VOICE,
    rate: string = '+0%',
    pitch: string = '+0Hz'
  ): Promise<Buffer> {
    if (!text || !text.trim()) {
      throw new Error('Text parameter is required for TTS synthesis');
    }

    const cleanText = text
      .replace(/[\r\n]+/g, ' ')
      .replace(/[*#`_~[\]()]/g, '')
      .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const textFile = path.join(os.tmpdir(), `edge_in_${id}.txt`);
    const mediaFile = path.join(os.tmpdir(), `edge_out_${id}.mp3`);

    try {
      // Write text to temp file to avoid shell quoting/escaping bugs
      await fs.promises.writeFile(textFile, cleanText, 'utf8');

      // Use python3 -m edge_tts which is reliably available
      const cmd = `python3 -m edge_tts --file "${textFile}" --voice "${voice}" --rate "${rate}" --pitch "${pitch}" --write-media "${mediaFile}"`;

      await execAsync(cmd, { timeout: 20000 });

      if (!fs.existsSync(mediaFile)) {
        throw new Error('TTS output audio was not generated');
      }

      const audioBuffer = await fs.promises.readFile(mediaFile);

      // Clean up temp files
      await Promise.all([
        fs.promises.unlink(textFile).catch(() => {}),
        fs.promises.unlink(mediaFile).catch(() => {}),
      ]);

      return audioBuffer;
    } catch (err: any) {
      await Promise.all([
        fs.promises.unlink(textFile).catch(() => {}),
        fs.promises.unlink(mediaFile).catch(() => {}),
      ]);
      console.error('Edge-TTS Synthesis Error:', err);
      throw err;
    }
  }
}

export const edgeTtsService = new EdgeTtsService();
