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
   * Pre-generated authentic NeerjaExpressive audio exact phrase map
   * Guarantees 100% word-for-word parity with shown text
   */
  private static readonly EXACT_STATIC_MAP: Record<string, string> = {
    // Tab Briefings
    "welcome to the overview dashboard here you have live telemetry for the central plaza intersection in both 2d and 3d webgl the system continuously evaluates queue lengths across all four approaches and dynamically adjusts green signals to slash wait times by thirty eight percent you can also trigger instant emergency pre emption corridors with a single click or voice command": "voices/dashboard.mp3",
    "welcome to the simulation sandbox this environment implements our discrete event traffic algorithm with density based green timing allocations you can test rush hour spikes trigger vehicle breakdowns run our chaos mode stress tests or spawn emergency vehicles in real time": "voices/simulation.mp3",
    "this is the traffic analytics suite here you can inspect 24 hour peak rush hour curves compare static timers against our adaptive algorithm and measure total fuel savings alongside carbon dioxide emission reductions across the metropolitan area": "voices/analytics.mp3",
    "you are viewing the metropolitan city grid map this displays the interconnected network of seven smart intersections across delhi ncr from here you can track node connectivity and coordinate citywide emergency green wave cascades in real time": "voices/citymap.mp3",
    "welcome to the arterial green wave corridor this module dynamically synchronizes adjacent traffic signals along major expressways based on vehicle speed and distance enabling non stop platoon flow and cutting stop and go delays by up to thirty four percent": "voices/corridor.mp3",
    "this is the automated enforcement and e challan center our optical computer vision engine scans vehicle number plates in real time automatically detects red light jumps and issues instant digital e challans backed by an immutable audit log": "voices/violations.mp3",
    "welcome to the ai traffic forecaster using historical diurnal patterns and environmental telemetry this module anticipates rush hour congestion surges up to sixty minutes in advance and proactively rebalances green times before traffic jams form": "voices/forecaster.mp3",
    "this is the signal controller and safety interlock panel it provides manual override controls phase hold capabilities and software safety locks that strictly prevent conflicting green phases across opposing approaches": "voices/controller.mp3",
    "welcome to the hardware abstraction layer this simulator mirrors physical arduino microcontrollers mapping gpio digital pins to physical led signal heads and analog inputs to infrared vehicle detection sensors": "voices/hardware.mp3",
    "you are exploring the neo4j graph database console it represents our smart traffic network as an interconnected property graph you can inspect all eight entity models run custom cypher queries and trace real time topological relationships": "voices/database.mp3",
    "this is the system architecture and dbms theory overview it details our conceptual enhanced entity relationship diagram boyce codd normal form normalization proofs and sensor specialization hierarchy designed for complete data integrity": "voices/architecture.mp3",
    "welcome to the system audit stream every sensor trigger signal phase transition and operator intervention is recorded here in an immutable chronological ledger with millisecond precision": "voices/logs.mp3",
    "this is the settings and customization console here you can toggle between dark and light themes configure new smart intersection endpoints and customize advanced modules to match your workflow": "voices/settings.mp3",

    // Assistant Core Phrases
    "welcome to trafix intelligent traffic management system i am neerja your neural voice dispatcher how may i assist you today": "assistant/welcome.mp3",
    "trafix was developed by lakshya pundir lead system architect at team digix": "assistant/about_us.mp3",
    "all four approaches operating nominally under adaptive graph scheduling": "assistant/status_summary.mp3",
    "emergency pre emption cleared the intersection is resuming adaptive traffic scheduling": "assistant/emergency_cleared.mp3",
    "emergency preemption cleared the intersection is resuming adaptive traffic scheduling": "assistant/emergency_cleared.mp3",
    "traffic simulation started": "assistant/sim_started.mp3",
    "traffic simulation paused": "assistant/sim_paused.mp3",
    "traffic simulation reset to baseline": "assistant/sim_reset.mp3",
    "simulation scenario set to rush hour": "assistant/scenario_rush_hour.mp3",
    "simulation scenario set to accident": "assistant/scenario_accident.mp3",
    "simulation scenario set to emergency": "assistant/scenario_emergency.mp3",
    "simulation scenario set to low traffic": "assistant/scenario_low_traffic.mp3",
    "simulation scenario set to default": "assistant/scenario_default.mp3",
    "simulation speed set to 1x": "assistant/speed_1x.mp3",
    "simulation speed set to 2x": "assistant/speed_2x.mp3",
    "simulation speed set to 5x": "assistant/speed_5x.mp3",
    "controller switched to automatic mode": "assistant/mode_auto.mp3",
    "controller switched to manual mode": "assistant/mode_manual.mp3",
    "opening smart city audit report": "assistant/open_report.mp3",
    "opening optical ai camera feed": "assistant/open_vision.mp3",
    "opening 4 screen cctv matrix wall": "assistant/open_matrix.mp3",
    "opening 4screen cctv matrix wall": "assistant/open_matrix.mp3",
    "displaying command reference dictionary": "assistant/open_commands.mp3",
    "displaying module reference and viva talking points": "assistant/open_tab_info.mp3",

    // Navigation
    "navigating to dashboard view": "assistant/nav_dashboard.mp3",
    "navigating to simulation view": "assistant/nav_simulation.mp3",
    "navigating to analytics view": "assistant/nav_analytics.mp3",
    "navigating to citymap view": "assistant/nav_citymap.mp3",
    "navigating to corridor view": "assistant/nav_corridor.mp3",
    "navigating to violations view": "assistant/nav_violations.mp3",
    "navigating to forecaster view": "assistant/nav_forecaster.mp3",
    "navigating to controller view": "assistant/nav_controller.mp3",
    "navigating to hardware view": "assistant/nav_hardware.mp3",
    "navigating to database view": "assistant/nav_database.mp3",
    "navigating to architecture view": "assistant/nav_architecture.mp3",
    "navigating to logs view": "assistant/nav_logs.mp3",
    "navigating to settings view": "assistant/nav_settings.mp3",

    // Emergency Variants
    "priority pre emption sequence engaged for ambulance on the north approach conflicting signals held at red": "assistant/emergency_ambulance_north.mp3",
    "priority preemption sequence engaged for ambulance on the north approach conflicting signals held at red": "assistant/emergency_ambulance_north.mp3",
    "priority pre emption sequence engaged for ambulance on the south approach conflicting signals held at red": "assistant/emergency_ambulance_south.mp3",
    "priority preemption sequence engaged for ambulance on the south approach conflicting signals held at red": "assistant/emergency_ambulance_south.mp3",
    "priority pre emption sequence engaged for ambulance on the east approach conflicting signals held at red": "assistant/emergency_ambulance_east.mp3",
    "priority preemption sequence engaged for ambulance on the east approach conflicting signals held at red": "assistant/emergency_ambulance_east.mp3",
    "priority pre emption sequence engaged for ambulance on the west approach conflicting signals held at red": "assistant/emergency_ambulance_west.mp3",
    "priority preemption sequence engaged for ambulance on the west approach conflicting signals held at red": "assistant/emergency_ambulance_west.mp3",

    "priority pre emption sequence engaged for police on the north approach conflicting signals held at red": "assistant/emergency_police_north.mp3",
    "priority preemption sequence engaged for police on the north approach conflicting signals held at red": "assistant/emergency_police_north.mp3",
    "priority pre emption sequence engaged for police on the south approach conflicting signals held at red": "assistant/emergency_police_south.mp3",
    "priority preemption sequence engaged for police on the south approach conflicting signals held at red": "assistant/emergency_police_south.mp3",
    "priority pre emption sequence engaged for police on the east approach conflicting signals held at red": "assistant/emergency_police_east.mp3",
    "priority preemption sequence engaged for police on the east approach conflicting signals held at red": "assistant/emergency_police_east.mp3",
    "priority pre emption sequence engaged for police on the west approach conflicting signals held at red": "assistant/emergency_police_west.mp3",
    "priority preemption sequence engaged for police on the west approach conflicting signals held at red": "assistant/emergency_police_west.mp3",

    // Directional Fire Truck Emergencies
    "priority pre emption sequence engaged for fire truck on the north approach conflicting signals held at red": "assistant/emergency_fire_truck_north.mp3",
    "priority preemption sequence engaged for fire truck on the north approach conflicting signals held at red": "assistant/emergency_fire_truck_north.mp3",
    "priority pre emption sequence engaged for fire truck on the south approach conflicting signals held at red": "assistant/emergency_fire_truck_south.mp3",
    "priority preemption sequence engaged for fire truck on the south approach conflicting signals held at red": "assistant/emergency_fire_truck_south.mp3",
    "priority pre emption sequence engaged for fire truck on the east approach conflicting signals held at red": "assistant/emergency_fire_truck_east.mp3",
    "priority preemption sequence engaged for fire truck on the east approach conflicting signals held at red": "assistant/emergency_fire_truck_east.mp3",
    "priority pre emption sequence engaged for fire truck on the west approach conflicting signals held at red": "assistant/emergency_fire_truck_west.mp3",
    "priority preemption sequence engaged for fire truck on the west approach conflicting signals held at red": "assistant/emergency_fire_truck_west.mp3",

    // Directional VIP Emergencies
    "priority pre emption sequence engaged for vip on the north approach conflicting signals held at red": "assistant/emergency_vip_north.mp3",
    "priority preemption sequence engaged for vip on the north approach conflicting signals held at red": "assistant/emergency_vip_north.mp3",
    "priority pre emption sequence engaged for vip on the south approach conflicting signals held at red": "assistant/emergency_vip_south.mp3",
    "priority preemption sequence engaged for vip on the south approach conflicting signals held at red": "assistant/emergency_vip_south.mp3",
    "priority pre emption sequence engaged for vip on the east approach conflicting signals held at red": "assistant/emergency_vip_east.mp3",
    "priority preemption sequence engaged for vip on the east approach conflicting signals held at red": "assistant/emergency_vip_east.mp3",
    "priority pre emption sequence engaged for vip on the west approach conflicting signals held at red": "assistant/emergency_vip_west.mp3",
    "priority preemption sequence engaged for vip on the west approach conflicting signals held at red": "assistant/emergency_vip_west.mp3",

    // Vehicle Spawns
    "spawned car on north approach": "assistant/spawn_car_north.mp3",
    "spawned car on south approach": "assistant/spawn_car_south.mp3",
    "spawned car on east approach": "assistant/spawn_car_east.mp3",
    "spawned car on west approach": "assistant/spawn_car_west.mp3",
    "spawned bus on north approach": "assistant/spawn_bus_north.mp3",
    "spawned bus on south approach": "assistant/spawn_bus_south.mp3",
    "spawned bus on east approach": "assistant/spawn_bus_east.mp3",
    "spawned bus on west approach": "assistant/spawn_bus_west.mp3",
    "spawned ambulance on west approach": "assistant/spawn_ambulance_west.mp3",
    "spawned ambulance on north approach": "assistant/spawn_ambulance_north.mp3",
    "spawned police on north approach": "assistant/spawn_police_north.mp3",

    // Chaos & 3D WebGL Studio
    "stress test gridlock chaos mode initiated across all four approaches": "assistant/chaos_mode.mp3",
    "opening 3d webgl studio view": "assistant/open_3d.mp3",
  };

  /**
   * Checks for pre-generated authentic NeerjaExpressive MP3 assets using strict exact match
   */
  private getPreGeneratedAudio(cleanText: string): Buffer | null {
    try {
      const baseDir = path.resolve(__dirname, '../../../frontend/public/audio');
      const normalized = cleanText
        .toLowerCase()
        .replace(/[\r\n]+/g, ' ')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const relativeFile = EdgeTtsService.EXACT_STATIC_MAP[normalized];
      if (relativeFile) {
        const fullPath = path.join(baseDir, relativeFile);
        if (fs.existsSync(fullPath)) {
          return fs.readFileSync(fullPath);
        }
      }
    } catch {
      // Fallback to dynamic synthesis
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
