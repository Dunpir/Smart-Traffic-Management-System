# ESP32 Smart Traffic Management System Integration Guide

This guide explains how to flash, wire, and connect your **ESP32 microcontroller** to the **Smart Traffic Management System Web Control Center**.

---

## 1. Physical Hardware Pinout Summary

Your ESP32 is wired with **4 Traffic Approaches**, **4 Stop-Line IR Sensors**, an **RF Emergency Receiver**, and an **Active Siren Buzzer**:

### Traffic Light Actuator LEDs (Outputs)

| Approach | Red LED Pin | Yellow LED Pin | Green LED Pin | Common Ground |
| :--- | :--- | :--- | :--- | :--- |
| **North (Lane 0)** | `GPIO 2`  (D2)  | `GPIO 4`  (D4)  | `GPIO 5`  (D5)  | GND Rail |
| **East (Lane 1)**  | `GPIO 18` (D18) | `GPIO 19` (D19) | `GPIO 21` (D21) | GND Rail |
| **South (Lane 2)** | `GPIO 22` (D22) | `GPIO 23` (D23) | `GPIO 13` (D13) | GND Rail |
| **West (Lane 3)**  | `GPIO 12` (D12) | `GPIO 14` (D14) | `GPIO 27` (D27) | GND Rail |

> **Note on Resistors**: Each LED anode (+) connects through a **220Ω or 330Ω** resistor to the designated ESP32 GPIO pin. Cathodes (-) connect to the common Ground rail.

---

### Stop-Line IR Sensors (Inputs)

| Approach | Sensor Pin | Pin Type | Active Logic |
| :--- | :--- | :--- | :--- |
| **North** | `GPIO 32` | Digital In (Pull-up) | `LOW` on obstacle / vehicle detected |
| **East**  | `GPIO 33` | Digital In (Pull-up) | `LOW` on obstacle / vehicle detected |
| **South** | `GPIO 34` | Input-Only (Module Out) | `LOW` on obstacle / vehicle detected |
| **West**  | `GPIO 35` | Input-Only (Module Out) | `LOW` on obstacle / vehicle detected |

> **Sensor Logic**: Standard FC-51 / TCRT5000 infrared obstacle modules have an onboard LM393 comparator. When a vehicle blocks the beam, the sensor's `OUT` pin goes **LOW** (0V) and its onboard LED turns on.

---

### Emergency Subsystem (RF Receiver & Siren Buzzer)

| Device | ESP32 Pin | Wiring Description |
| :--- | :--- | :--- |
| **433MHz RF Receiver** | `GPIO 26` | RF `DATA` pin to `GPIO 26`, with a **10kΩ pull-down resistor** to `GND`. When an emergency vehicle remote is triggered, this line goes `HIGH`. |
| **Active Siren Buzzer** | `GPIO 15` | Buzzer `(+)` to `GPIO 15`, Buzzer `(-)` to `GND`. Sounds an audible alarm during emergency corridors and pedestrian crosswalk phases. |

---

## 2. Flashing the ESP32 via Arduino IDE

### Step 1: Install ESP32 Board Support in Arduino IDE
1. Open **Arduino IDE** (v2.x or v1.8.x).
2. Go to **Settings / Preferences** (`Cmd + ,` on Mac or `Ctrl + ,` on Windows).
3. In **Additional Boards Manager URLs**, paste:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Open **Tools** > **Board** > **Boards Manager**, search for `esp32` by *Espressif Systems*, and click **Install**.

### Step 2: Select Board and Serial Port
1. Connect your ESP32 to your computer using a high-quality **Micro-USB or USB-C data cable** (ensure the cable supports data, not charging only).
2. Go to **Tools** > **Board** > **ESP32 Arduino** > select **ESP32 Dev Module** (or **NodeMCU-32S**).
3. Set:
   - **Upload Speed**: `115200` (or `921600`)
   - **CPU Frequency**: `240MHz (WiFi/BT)`
   - **Flash Frequency**: `80MHz`
4. Go to **Tools** > **Port** and select your ESP32 port:
   - **macOS**: `/dev/cu.usbserial-XXXX` or `/dev/cu.wchusbserialXXXX`
   - **Windows**: `COM3`, `COM4`, etc.

### Step 3: Open and Upload Firmware
1. Open the firmware sketch located at:
   ```text
   docs/arduino/esp32_traffic_controller.ino
   ```
2. Click the **Upload** button (Arrow icon).
3. *If you see `Connecting........_____.....` in the console*:
   - Press and hold the physical **BOOT** button on the ESP32 until the upload progress percentage appears, then release it.
4. When upload finishes, press the **EN (Reset)** button once.
5. Open **Tools** > **Serial Monitor** at **115200 baud**. You will see:
   ```json
   {"type":"HANDSHAKE","status":"ONLINE","device":"ESP32_TRAFFIC_CONTROLLER","baud":115200,"lanes":4}
   ```

---

## 3. Connecting to the Web Dashboard

The website supports **two connection modes**:

### Mode A: WebSerial USB Direct Link (Recommended - Zero Configuration)
1. Close the Arduino IDE Serial Monitor (so the USB port is free).
2. Open the Web Dashboard in **Google Chrome**, **Microsoft Edge**, or **Brave** at:
   ```text
   http://localhost:5173
   ```
3. Navigate to **Hardware Layer** tab in the sidebar.
4. Click **"CONNECT PHYSICAL HARDWARE (HIL)"**.
5. Select **115200 Baud** and click **"Select Port & Connect USB"**.
6. A browser prompt will appear listing connected USB Serial devices. Click your ESP32 (CP2102 or CH340) and click **Connect**.
7. The status turns to **"CONNECTED TO ESP32 (LIVE DUPLEX)"**!
   - As traffic lights cycle on the website, your physical LEDs change simultaneously.
   - When you wave your hand across an IR sensor, the website dashboard shows the queue trigger in real time.
   - When the RF receiver detects a signal or you click "Test Buzzer", the siren sounds on `GPIO 15`.

---

### Mode B: Untethered Wi-Fi Mode (Wireless)
If you want to place the traffic model across the room with a 5V power bank:
1. Open `docs/arduino/esp32_traffic_controller.ino`.
2. Change:
   ```cpp
   #define ENABLE_WIFI true
   const char* WIFI_SSID     = "Your_WiFi_Network_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* BACKEND_HOST  = "192.168.1.50"; // Your computer's local IP address
   const int   BACKEND_PORT  = 5001;
   ```
3. Flash the sketch to the ESP32.
4. The ESP32 will connect to your local Wi-Fi and automatically sync with the backend endpoint:
   `POST http://<laptop_ip>:5001/api/hardware/esp32/sync`
   reporting the 4 IR sensors and receiving the 4-way signal states.

---

## 4. Hardware Verification Checklist

1. **North Approach**: Red on GPIO 2, Yellow on GPIO 4, Green on GPIO 5.
2. **East Approach**: Red on GPIO 18, Yellow on GPIO 19, Green on GPIO 21.
3. **South Approach**: Red on GPIO 22, Yellow on GPIO 23, Green on GPIO 13.
4. **West Approach**: Red on GPIO 12, Yellow on GPIO 14, Green on GPIO 27.
5. **IR Sensors**: Wave your hand in front of each IR sensor; the onboard sensor LED should light up, and the website monitor should display `[SENSOR] Stop-Line IR: VEHICLE PRESENT`.
6. **Buzzer**: Test using the "Test Buzzer" button in the WebSerial modal; active buzzer on GPIO 15 will emit a crisp warning chirp.
7. **Emergency Siren Corridor**: Press your RF remote transmitter or click 🚨 Ambulance in the website; opposing lanes turn Red, target corridor opens Green, and buzzer alarms.
