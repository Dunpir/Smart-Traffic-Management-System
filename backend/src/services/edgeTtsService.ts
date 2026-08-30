/**
 * Edge-TTS Neural Voice Service
 * Synthesizes high-fidelity Indian Female voice (hi-IN-SwaraNeural & en-IN-NeerjaExpressiveNeural)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Path to edge-tts executable
const EDGE_TTS_BIN = fs.existsSync('/Users/vijaypundir/Library/Python/3.9/bin/edge-tts')
  ? '/Users/vijaypundir/Library/Python/3.9/bin/edge-tts'
  : 'edge-tts';

export const INDIAN_FEMALE_VOICES = {
  HINDI: 'hi-IN-SwaraNeural',
  ENGLISH_EXPRESSIVE: 'en-IN-NeerjaExpressiveNeural',
  ENGLISH_NATURAL: 'en-IN-NeerjaNeural',
} as const;

export class EdgeTtsService {
  /**
   * Synthesize text to MP3 audio buffer using Edge-TTS neural voice
   */
  public async synthesize(
    text: string,
    voice: string = INDIAN_FEMALE_VOICES.HINDI,
    rate: string = '+0%',
    pitch: string = '+0Hz'
  ): Promise<Buffer> {
    if (!text || !text.trim()) {
      throw new Error('Text parameter is required for TTS synthesis');
    }

    const cleanText = text
      .replace(/[\r\n]+/g, ' ')
      .replace(/[*#`_~[\]()]/g, '')
      .trim();

    const tempFile = path.join(
      os.tmpdir(),
      `edge_tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`
    );

    try {
      // Escape text safely for command line
      const escapedText = cleanText.replace(/"/g, '\\"');
      const cmd = `"${EDGE_TTS_BIN}" --voice "${voice}" --rate "${rate}" --pitch "${pitch}" --text "${escapedText}" --write-media "${tempFile}"`;

      await execAsync(cmd, { timeout: 15000 });

      if (!fs.existsSync(tempFile)) {
        throw new Error('TTS output file was not created');
      }

      const audioBuffer = await fs.promises.readFile(tempFile);
      // Clean up temp file
      await fs.promises.unlink(tempFile).catch(() => {});

      return audioBuffer;
    } catch (err: any) {
      if (fs.existsSync(tempFile)) {
        await fs.promises.unlink(tempFile).catch(() => {});
      }
      console.error('Edge-TTS Synthesis Error:', err);
      throw err;
    }
  }
}

export const edgeTtsService = new EdgeTtsService();
