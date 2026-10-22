#!/usr/bin/env python3
import asyncio
import os
import edge_tts

VOICE = "en-IN-NeerjaExpressiveNeural"

TAB_TEXTS = {
    "dashboard": "Welcome to the Overview Dashboard! Here, you have live telemetry for the Central Plaza intersection in both 2D and 3D WebGL. The system continuously evaluates queue lengths across all four approaches and dynamically adjusts green signals to slash wait times by thirty-eight percent. You can also trigger instant emergency pre-emption corridors with a single click or voice command.",
    "simulation": "Welcome to the Simulation Sandbox! This environment implements our discrete-event traffic algorithm with density-based green timing allocations. You can test rush hour spikes, trigger vehicle breakdowns, run our Chaos Mode stress tests, or spawn emergency vehicles in real time.",
    "analytics": "This is the Traffic Analytics Suite. Here you can inspect 24-hour peak rush-hour curves, compare static timers against our adaptive algorithm, and measure total fuel savings alongside carbon dioxide emission reductions across the metropolitan area.",
    "citymap": "You are viewing the Metropolitan City Grid Map. This displays the interconnected network of seven smart intersections across Delhi NCR. From here, you can track node connectivity and coordinate citywide emergency green wave cascades in real time.",
    "corridor": "Welcome to the Arterial Green Wave Corridor. This module dynamically synchronizes adjacent traffic signals along major expressways based on vehicle speed and distance, enabling non-stop platoon flow and cutting stop-and-go delays by up to thirty-four percent.",
    "violations": "This is the Automated Enforcement and E-Challan Center. Our optical computer vision engine scans vehicle number plates in real time, automatically detects red-light jumps, and issues instant digital e-challans backed by an immutable audit log.",
    "forecaster": "Welcome to the AI Traffic Forecaster. Using historical diurnal patterns and environmental telemetry, this module anticipates rush-hour congestion surges up to sixty minutes in advance and proactively rebalances green times before traffic jams form.",
    "controller": "This is the Signal Controller and Safety Interlock panel. It provides manual override controls, phase-hold capabilities, and software safety locks that strictly prevent conflicting green phases across opposing approaches.",
    "hardware": "Welcome to the Hardware Abstraction Layer. This simulator mirrors physical Arduino microcontrollers, mapping GPIO digital pins to physical LED signal heads and analog inputs to infrared vehicle detection sensors.",
    "database": "You are exploring the Neo4j Graph Database console. It represents our smart traffic network as an interconnected property graph. You can inspect all eight entity models, run custom Cypher queries, and trace real-time topological relationships.",
    "architecture": "This is the System Architecture and DBMS Theory overview. It details our conceptual Enhanced Entity Relationship diagram, Boyce-Codd Normal Form normalization proofs, and sensor specialization hierarchy designed for complete data integrity.",
    "logs": "Welcome to the System Audit Stream. Every sensor trigger, signal phase transition, and operator intervention is recorded here in an immutable chronological ledger with millisecond precision.",
    "settings": "This is the Settings and Customization console. Here you can toggle between dark and light themes, configure new smart intersection endpoints, and customize advanced modules to match your workflow.",
}

ASSISTANT_TEXTS = {
    "welcome": "Welcome to Trafix Intelligent Traffic Management System. I am Neerja, your neural voice dispatcher. How may I assist you today?",
    "about_us": "Trafix was developed by Lakshya Pundir, Lead System Architect at Team DigiX.",
    "status_summary": "All four approaches operating nominally under adaptive graph scheduling.",
    "emergency_ambulance": "Priority pre-emption sequence engaged for AMBULANCE on the WEST approach. Conflicting signals held at Red.",
    "emergency_ambulance_north": "Priority pre-emption sequence engaged for AMBULANCE on the NORTH approach. Conflicting signals held at Red.",
    "emergency_ambulance_south": "Priority pre-emption sequence engaged for AMBULANCE on the SOUTH approach. Conflicting signals held at Red.",
    "emergency_ambulance_east": "Priority pre-emption sequence engaged for AMBULANCE on the EAST approach. Conflicting signals held at Red.",
    "emergency_ambulance_west": "Priority pre-emption sequence engaged for AMBULANCE on the WEST approach. Conflicting signals held at Red.",
    "emergency_police_north": "Priority pre-emption sequence engaged for POLICE on the NORTH approach. Conflicting signals held at Red.",
    "emergency_police_south": "Priority pre-emption sequence engaged for POLICE on the SOUTH approach. Conflicting signals held at Red.",
    "emergency_police_east": "Priority pre-emption sequence engaged for POLICE on the EAST approach. Conflicting signals held at Red.",
    "emergency_police_west": "Priority pre-emption sequence engaged for POLICE on the WEST approach. Conflicting signals held at Red.",
    "emergency_cleared": "Emergency pre-emption cleared. The intersection is resuming adaptive traffic scheduling.",
    "sim_started": "Traffic simulation started.",
    "sim_paused": "Traffic simulation paused.",
    "sim_reset": "Traffic simulation reset to baseline.",
    "scenario_rush_hour": "Simulation scenario set to RUSH HOUR.",
    "scenario_accident": "Simulation scenario set to ACCIDENT.",
    "scenario_emergency": "Simulation scenario set to EMERGENCY.",
    "scenario_low_traffic": "Simulation scenario set to LOW TRAFFIC.",
    "scenario_default": "Simulation scenario set to DEFAULT.",
    "speed_1x": "Simulation speed set to 1x.",
    "speed_2x": "Simulation speed set to 2x.",
    "speed_5x": "Simulation speed set to 5x.",
    "mode_auto": "Controller switched to AUTOMATIC mode.",
    "mode_manual": "Controller switched to MANUAL mode.",
    "open_report": "Opening Smart City Audit Report.",
    "open_vision": "Opening Optical AI Camera Feed.",
    "open_matrix": "Opening 4-Screen CCTV Matrix Wall.",
    "open_commands": "Displaying command reference dictionary.",
    "open_tab_info": "Displaying module reference and viva talking points.",
    "chaos_mode": "Stress test gridlock chaos mode initiated across all four approaches.",
    "open_3d": "Opening 3D WebGL Studio view.",
    "emergency_fire_truck_north": "Priority pre-emption sequence engaged for FIRE TRUCK on the NORTH approach. Conflicting signals held at Red.",
    "emergency_fire_truck_south": "Priority pre-emption sequence engaged for FIRE TRUCK on the SOUTH approach. Conflicting signals held at Red.",
    "emergency_fire_truck_east": "Priority pre-emption sequence engaged for FIRE TRUCK on the EAST approach. Conflicting signals held at Red.",
    "emergency_fire_truck_west": "Priority pre-emption sequence engaged for FIRE TRUCK on the WEST approach. Conflicting signals held at Red.",
    "emergency_vip_north": "Priority pre-emption sequence engaged for VIP on the NORTH approach. Conflicting signals held at Red.",
    "emergency_vip_south": "Priority pre-emption sequence engaged for VIP on the SOUTH approach. Conflicting signals held at Red.",
    "emergency_vip_east": "Priority pre-emption sequence engaged for VIP on the EAST approach. Conflicting signals held at Red.",
    "emergency_vip_west": "Priority pre-emption sequence engaged for VIP on the WEST approach. Conflicting signals held at Red.",
    "spawn_car_north": "Spawned CAR on NORTH approach.",
    "spawn_car_south": "Spawned CAR on SOUTH approach.",
    "spawn_car_east": "Spawned CAR on EAST approach.",
    "spawn_car_west": "Spawned CAR on WEST approach.",
    "spawn_bus_north": "Spawned BUS on NORTH approach.",
    "spawn_bus_south": "Spawned BUS on SOUTH approach.",
    "spawn_bus_east": "Spawned BUS on EAST approach.",
    "spawn_bus_west": "Spawned BUS on WEST approach.",
    "spawn_ambulance_west": "Spawned AMBULANCE on WEST approach.",
    "spawn_ambulance_north": "Spawned AMBULANCE on NORTH approach.",
    "spawn_police_north": "Spawned POLICE on NORTH approach.",
    "nav_dashboard": "Navigating to dashboard view.",
    "nav_simulation": "Navigating to simulation view.",
    "nav_analytics": "Navigating to analytics view.",
    "nav_citymap": "Navigating to citymap view.",
    "nav_corridor": "Navigating to corridor view.",
    "nav_violations": "Navigating to violations view.",
    "nav_forecaster": "Navigating to forecaster view.",
    "nav_controller": "Navigating to controller view.",
    "nav_hardware": "Navigating to hardware view.",
    "nav_database": "Navigating to database view.",
    "nav_architecture": "Navigating to architecture view.",
    "nav_logs": "Navigating to logs view.",
    "nav_settings": "Navigating to settings view.",
}

async def generate_file(text: str, out_path: str, sem: asyncio.Semaphore):
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        return
    async with sem:
        print(f"Synthesizing [{VOICE}] -> {os.path.basename(out_path)}...")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(out_path)
        print(f"✓ Created {os.path.basename(out_path)} ({os.path.getsize(out_path)} bytes)")

async def main():
    sem = asyncio.Semaphore(4)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    voices_dir = os.path.join(base_dir, "frontend", "public", "audio", "voices")
    assistant_dir = os.path.join(base_dir, "frontend", "public", "audio", "assistant")
    os.makedirs(voices_dir, exist_ok=True)
    os.makedirs(assistant_dir, exist_ok=True)

    tasks = []
    for tab, text in TAB_TEXTS.items():
        out_path = os.path.join(voices_dir, f"{tab}.mp3")
        tasks.append(generate_file(text, out_path, sem))

    for key, text in ASSISTANT_TEXTS.items():
        out_path = os.path.join(assistant_dir, f"{key}.mp3")
        tasks.append(generate_file(text, out_path, sem))

    await asyncio.gather(*tasks)
    print("\nAll audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
