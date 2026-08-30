import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Neo4j Configuration
  NEO4J: {
    URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
    USER: process.env.NEO4J_USER || 'neo4j',
    PASSWORD: process.env.NEO4J_PASSWORD || 'password',
    DATABASE: process.env.NEO4J_DATABASE || 'neo4j',
  },

  // Simulation settings
  SIMULATION: {
    ENABLED: process.env.SIMULATION_ENABLED !== 'false',
    TICK_MS: parseInt(process.env.SIMULATION_TICK_MS || '3000', 10),
  },

  // Hardware Serial settings (Optional)
  HARDWARE: {
    SERIAL_PORT: process.env.SERIAL_PORT || '',
    BAUD_RATE: parseInt(process.env.BAUD_RATE || '9600', 10),
  },
};
