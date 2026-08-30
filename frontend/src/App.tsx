import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { GuidedDemoModal } from './components/demo/GuidedDemoModal';
import { DashboardPage } from './pages/DashboardPage';
import { SignalControllerPage } from './pages/SignalControllerPage';
import { HardwareSimulatorPage } from './pages/HardwareSimulatorPage';
import { DatabasePage } from './pages/DatabasePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ArchitectureDbmsPage } from './pages/ArchitectureDbmsPage';
import { LogsPage } from './pages/LogsPage';
import { CorridorPage } from './pages/CorridorPage';
import { SimulationPage } from './pages/SimulationPage';
import { ViolationsPage } from './pages/ViolationsPage';
import { ForecasterPage } from './pages/ForecasterPage';
import { CityMapPage } from './pages/CityMapPage';
import { SettingsPage } from './pages/SettingsPage';
import { AiCameraFeedModal } from './components/vision/AiCameraFeedModal';
import { CctvMatrixWallModal } from './components/vision/CctvMatrixWallModal';
import { VoiceCommandAssistant } from './components/voice/VoiceCommandAssistant';
import { VoiceAction } from './utils/voiceCommander';
import { TabInfoModal } from './components/info/TabInfoModal';
import { TabInfoBanner } from './components/info/TabInfoBanner';
import { AuditReportModal } from './components/reports/AuditReportModal';
import { AboutUsModal } from './components/demo/AboutUsModal';
import { TrafficAmbientBackground } from './components/layout/TrafficAmbientBackground';
import { LightTrafficBackground } from './components/layout/LightTrafficBackground';
import { calculateEcoMetrics } from './utils/ecoCalculator';
import { soundEffects } from './utils/soundEffects';

import { VercelToolbar } from './components/layout/VercelToolbar';

import {
  JunctionLiveTelemetry,
  HardwareState,
  DatabaseStatus,
  SimulationConfig,
  EmergencyEvent,
  ViolationStats,
} from './types';
import { api } from './services/api';
import { getSocket } from './services/socket';

const MainAppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme, advancedFeatures } = useSettings();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedJunction, setSelectedJunction] = useState<string>('JUNC-001');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [isTabInfoModalOpen, setIsTabInfoModalOpen] = useState<boolean>(false);

  // Live System State
  const [telemetry, setTelemetry] = useState<JunctionLiveTelemetry | null>(null);
  const [hardwareState, setHardwareState] = useState<HardwareState | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [simConfig, setSimConfig] = useState<SimulationConfig | null>(null);
  const [violationStats, setViolationStats] = useState<ViolationStats | null>(null);

  // If advanced features are disabled and activeTab is an advanced feature, fallback to dashboard
  useEffect(() => {
    const advancedTabs: NavTab[] = [
      'violations',
      'forecaster',
      'corridor',
      'hardware',
      'architecture',
    ];
    if (!advancedFeatures && advancedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [advancedFeatures, activeTab]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [tRes, hwRes, dbRes, simRes, vStatsRes] = await Promise.all([
        api.getTrafficStatus(),
        api.getHardwareStatus(),
        api.getDatabaseStatus(),
        api.getSimulationStatus(),
        api.getViolationStats(),
      ]);

      if (tRes?.success) setTelemetry(tRes.data);
      if (hwRes?.success) setHardwareState(hwRes.data.state);
      if (dbRes?.success) setDbStatus(dbRes.data);
      if (simRes?.success) setSimConfig(simRes.data);
      if (vStatsRes?.success) setViolationStats(vStatsRes.data);
    } catch (e) {
      console.warn('Initial telemetry fetch retry', e);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchInitialData();

    // Setup WebSocket Listeners for real-time live push updates
    const socket = getSocket();

    socket.on('junction:telemetry', (data: JunctionLiveTelemetry) => {
      setTelemetry(data);
    });

    socket.on('hardware:state', (data: HardwareState) => {
      setHardwareState(data);
    });

    socket.on('database:status', (data: DatabaseStatus) => {
      setDbStatus(data);
    });

    socket.on('simulation:state', (data: SimulationConfig) => {
      setSimConfig(data);
    });

    socket.on('emergency:active', (data: EmergencyEvent | null) => {
      setTelemetry((prev) => (prev ? { ...prev, activeEmergency: data } : null));
    });

    // Fallback polling interval
    const pollingInterval = setInterval(fetchInitialData, 3000);

    return () => {
      clearInterval(pollingInterval);
      socket.off('junction:telemetry');
      socket.off('hardware:state');
      socket.off('database:status');
      socket.off('simulation:state');
      socket.off('emergency:active');
    };
  }, [fetchInitialData, isAuthenticated]);

  // If not logged in, render the clean login/register page matching the screenshot
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const ecoMetrics = telemetry ? calculateEcoMetrics(telemetry.totalVehicleCount, 40) : null;

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            telemetry={telemetry}
            hardwareState={hardwareState}
            dbStatus={dbStatus}
            simConfig={simConfig}
            onRefresh={fetchInitialData}
            onOpenVision={() => setIsVisionModalOpen(true)}
            onNavigateCorridor={() => setActiveTab('corridor')}
            onOpenAuditReport={() => setIsAuditModalOpen(true)}
          />
        );
      case 'simulation':
        return <SimulationPage />;
      case 'analytics':
        return <AnalyticsPage onOpenAuditReport={() => setIsAuditModalOpen(true)} />;
      case 'violations':
        return <ViolationsPage />;
      case 'forecaster':
        return <ForecasterPage />;
      case 'citymap':
        return <CityMapPage />;
      case 'corridor':
        return <CorridorPage />;
      case 'controller':
        return (
          <SignalControllerPage
            telemetry={telemetry}
            hardwareState={hardwareState}
            onRefresh={fetchInitialData}
          />
        );
      case 'hardware':
        return (
          <HardwareSimulatorPage
            hardwareState={hardwareState}
            simConfig={simConfig}
            onRefresh={fetchInitialData}
          />
        );
      case 'database':
        return <DatabasePage dbStatus={dbStatus} />;
      case 'settings':
        return <SettingsPage onOpenAboutUs={() => setIsAboutModalOpen(true)} />;
      case 'architecture':
        return <ArchitectureDbmsPage />;
      case 'logs':
        return <LogsPage />;
      default:
        return null;
    }
  };

  const handleVoiceAction = async (action: VoiceAction) => {
    switch (action.type) {
      case 'EMERGENCY':
        await api.injectEmergency(action.road, action.emergencyType || 'AMBULANCE');
        fetchInitialData();
        soundEffects.playEmergencySiren();
        window.dispatchEvent(
          new CustomEvent('trafix:emergency:spawn', {
            detail: {
              road: action.road,
              emergencyType: action.emergencyType || 'AMBULANCE',
              vehicleType: action.emergencyType || 'AMBULANCE',
            },
          })
        );
        window.dispatchEvent(
          new CustomEvent('trafix:simulation:command', {
            detail: {
              type: 'SIMULATION_SPAWN',
              road: action.road,
              vehicleType: action.emergencyType || 'AMBULANCE',
            },
          })
        );
        break;
      case 'CLEAR_EMERGENCY':
        await api.resolveEmergency();
        fetchInitialData();
        break;
      case 'SET_MODE':
        await api.setMode(action.mode);
        fetchInitialData();
        break;
      case 'OPEN_REPORT':
        setIsAuditModalOpen(true);
        break;
      case 'OPEN_VISION':
        setIsVisionModalOpen(true);
        break;
      case 'OPEN_MATRIX':
        setIsMatrixModalOpen(true);
        break;
      case 'OPEN_ABOUT_US':
        setIsAboutModalOpen(true);
        break;
      case 'OPEN_3D':
        setActiveTab('dashboard');
        break;
      case 'CHAOS_MODE':
        setActiveTab('simulation');
        break;
      case 'TAB_INFO':
        setIsTabInfoModalOpen(true);
        break;
      case 'SIMULATION_START':
      case 'SIMULATION_PAUSE':
      case 'SIMULATION_RESET':
      case 'SIMULATION_SCENARIO':
      case 'SIMULATION_SPAWN':
      case 'SIMULATION_SPEED':
        setActiveTab('simulation');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('trafix:simulation:command', { detail: action }));
        }, 120);
        break;
      case 'NAVIGATE':
        setActiveTab(action.tab as NavTab);
        break;
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`relative flex flex-col min-h-screen selection:text-white overflow-x-hidden transition-colors ${
        isDark ? 'bg-transparent text-slate-100 selection:bg-white selection:text-black' : 'bg-[#f8fafc] text-slate-800 selection:bg-black selection:text-white'
      }`}
    >
      {/* Live Animated Traffic Highway Background Engine (Dark: Cyber Ambient, Light: Blueprint Arterial Grid) */}
      {isDark ? <TrafficAmbientBackground /> : <LightTrafficBackground />}

      {/* Top Navbar */}
      <Header
        dbStatus={dbStatus}
        hardwareState={hardwareState}
        simConfig={simConfig}
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onOpenAuditReport={() => setIsAuditModalOpen(true)}
        onOpenAboutUs={() => setIsAboutModalOpen(true)}
        onOpenMatrixWall={() => setIsMatrixModalOpen(true)}
        onOpenVoiceCommand={() => setIsVoiceAssistantOpen(true)}
      />

      {/* Main Workspace Layout: Sidebar + Active Page */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row p-2 sm:p-4 gap-4 overflow-hidden max-w-[1600px] w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasActiveEmergency={Boolean(telemetry?.activeEmergency)}
        />

        <main className="flex-1 p-2 sm:p-4 overflow-y-auto max-h-[calc(100vh-120px)] space-y-4">
          {/* Subheader Action & Search Toolbar */}
          <VercelToolbar
            selectedJunction={selectedJunction}
            onSelectJunction={setSelectedJunction}
            onInjectEmergency={() =>
              handleVoiceAction({ type: 'EMERGENCY', road: 'NORTH', emergencyType: 'AMBULANCE' })
            }
            onTriggerChaos={() => handleVoiceAction({ type: 'CHAOS_MODE' })}
            onOpenCorridor={() => setActiveTab('corridor')}
            onOpenMatrixWall={() => setIsMatrixModalOpen(true)}
            onOpenAuditReport={() => setIsAuditModalOpen(true)}
          />

          {/* Integrated Feature Info & Viva Summary Banner on Every Tab */}
          <TabInfoBanner
            activeTab={activeTab}
            onOpenInfo={() => setIsTabInfoModalOpen(true)}
          />

          {renderActivePage()}
        </main>
      </div>

      {/* Guided Demo Tour Modal */}
      <GuidedDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigateTab={setActiveTab}
        onRefresh={fetchInitialData}
      />

      {/* Simulated Camera Vision Modal */}
      <AiCameraFeedModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        initialDirection={telemetry?.activeDirection || 'NORTH'}
      />

      {/* CCTV 4-Screen Matrix Wall Modal */}
      <CctvMatrixWallModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        activeDirection={telemetry?.activeDirection || 'NORTH'}
      />

      {/* AI Voice Command Dispatcher Floating HUD */}
      <VoiceCommandAssistant
        isOpen={isVoiceAssistantOpen}
        onToggle={() => setIsVoiceAssistantOpen(!isVoiceAssistantOpen)}
        onExecuteAction={handleVoiceAction}
      />

      {/* Tab Feature Info & Architecture Modal */}
      <TabInfoModal
        isOpen={isTabInfoModalOpen}
        onClose={() => setIsTabInfoModalOpen(false)}
        activeTab={activeTab}
      />

      {/* One-Click PDF Smart City Audit Report Modal */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        telemetry={telemetry}
        violationStats={violationStats}
        ecoMetrics={ecoMetrics}
      />

      {/* About Us Trafix Modal - Root Portal Mount */}
      <AboutUsModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </SettingsProvider>
  );
};
