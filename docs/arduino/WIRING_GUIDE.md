# Hardware Wiring & Arduino Integration Guide

This guide details how to wire an **Arduino Uno / Mega** to 12 traffic LEDs and 4 IR obstacle detection sensors for the Intelligent Traffic Signal Controller.

---

## 1. Hardware Components Required

1. **Arduino Uno / Mega 2560** (with USB Type-B cable to host PC running backend)
2. **4x Traffic Light LED Modules** (or 12 individual 5mm LEDs: 4 Red, 4 Yellow, 4 Green)
3. **12x 220Ω / 330Ω Current Limiting Resistors**
4. **4x Active-Low IR Obstacle Avoidance Sensors** (or TCRT5000 / Ultrasonic sensors)
5. **Breadboard & Jumper Wires (Male-to-Male & Male-to-Female)**
6. **5V 2A DC Power Supply** (or USB 5V rail)

---

## 2. Arduino Pinout Mapping

### Traffic Light LEDs (Actuators - Digital Outputs)

| Junction Approach | Red LED Pin | Yellow LED Pin | Green LED Pin | Common Ground |
| :--- | :--- | :--- | :--- | :--- |
| **North Road (R001)** | `Digital Pin 2` | `Digital Pin 3` | `Digital Pin 4` | GND |
| **South Road (R002)** | `Digital Pin 5` | `Digital Pin 6` | `Digital Pin 7` | GND |
| **East Road (R003)** | `Digital Pin 8` | `Digital Pin 9` | `Digital Pin 10` | GND |
| **West Road (R004)** | `Digital Pin 11` | `Digital Pin 12` | `Digital Pin 13` | GND |

### IR Presence Sensors (Inputs - Stop-Line Vehicle Presence)

| Road Approach | IR Sensor VCC | IR Sensor GND | IR Sensor OUT Pin |
| :--- | :--- | :--- | :--- |
| **North Road (R001)** | `5V` | `GND` | `Analog/Digital A0` |
| **South Road (R002)** | `5V` | `GND` | `Analog/Digital A1` |
| **East Road (R003)** | `5V` | `GND` | `Analog/Digital A2` |
| **West Road (R004)** | `5V` | `GND` | `Analog/Digital A3` |

---

## 3. Serial Communication Protocol

The Arduino and the Node.js Express backend communicate over Serial at **9600 Baud** using newline-delimited JSON packets:

### Telemetry Sent by Arduino -> Backend:
```json
{
  "type": "SENSOR_POLL",
  "junctionId": "J001",
  "sensors": {
    "NORTH": { "pin": "A0", "active": false },
    "SOUTH": { "pin": "A1", "active": false },
    "EAST":  { "pin": "A2", "active": false },
    "WEST":  { "pin": "A3", "active": true }
  }
}
```

### Commands Sent by Backend -> Arduino:
```json
{ "cmd": "SET_SIGNAL", "dir": "WEST", "sig": "GREEN" }
```

---

## 4. Software-Only vs Physical Hardware Seamless Switch

The system is designed with a **Hardware Abstraction Layer (HAL)**:
- In **Simulation Mode**, the backend routes identical telemetry and commands through the in-process simulation loop.
- When an **Arduino** is plugged into a USB port (`/dev/tty.usbmodem*` or `COM3`), the serial bridge automatically establishes the connection and transfers the live state.
- Zero changes to the backend business logic or frontend dashboard are needed!
