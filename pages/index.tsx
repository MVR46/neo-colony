import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import HUD from '../components/HUD';
import ChatOverlay from '../components/ChatOverlay';
import { BuildingSpec, ChatMessage, Villager } from '../utils/types';

// In pages/index.tsx, add this before the dynamic import
interface GameComponentProps {
  colonyName: string;
  onCreditsChange: (credits: number) => void;
  onEqChange: (eq: number) => void;
  onVillagerArrival: (villagerId: string, buildingId: string) => void;
  gameControllerRef: React.RefObject<{
    placeBuilding: (building: BuildingSpec) => boolean;
    handleVillagerArrival: (villagerId: string, buildingId: string) => void;
    deployDrone: (traits: string[]) => string;
  } | null>;
}

// Import the GameComponent dynamically to avoid SSR issues with Phaser
const GameComponent = dynamic<GameComponentProps>(() => 
  import('../components/GameComponent' as any).then(mod => mod.default),
  { ssr: false }
);

export default function Home() {
  // Colony settings
  const [colonyName, setColonyName] = useState<string>('');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [credits, setCredits] = useState<number>(1000);
  const [averageEq, setAverageEq] = useState<number>(50);
  
  // Infrastructure generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedBuildings, setGeneratedBuildings] = useState<BuildingSpec[]>([]);
  
  // Drone/Villager deployment
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [villagers, setVillagers] = useState<{[key: string]: Villager}>({});
  
  // Chat and status
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeVillagerId, setActiveVillagerId] = useState<string | undefined>(undefined);
  
  // Game controller references
  const gameControllerRef = useRef<{
    placeBuilding: (building: BuildingSpec) => boolean;
    handleVillagerArrival: (villagerId: string, buildingId: string) => void;
    deployDrone: (traits: string[]) => string;
  } | null>(null);
  
  // Generate infrastructure function
  const generateInfrastructure = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colonyName,
          theme: 'Neo-Colony on a terraformed moon with floating holographic billboards, modular habitat domes, and robotic drones',
          existingBuildings: generatedBuildings
        }),
      });
      
      const data = await response.json();
      
      if (data.buildings && Array.isArray(data.buildings)) {
        setGeneratedBuildings(data.buildings);
      }
    } catch (error) {
      console.error('Failed to generate infrastructure:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Deploy drone function
  const deployDrone = async () => {
    if (isDeploying || !gameControllerRef.current) return;
    
    setIsDeploying(true);
    
    try {
      // Generate random traits for the drone
      const possibleTraits = [
        'Analytical', 'Creative', 'Nurturing', 'Technical', 'Resourceful',
        'Cautious', 'Adventurous', 'Diplomatic', 'Efficient', 'Curious'
      ];
      
      const roles = [
        'Engineer', 'Botanist', 'Medic', 'Security Officer', 'Researcher',
        'Terraformer', 'Communications Specialist', 'Miner', 'Architect'
      ];
      
      // Pick 2-3 random traits
      const traitCount = Math.floor(Math.random() * 2) + 2;
      const selectedTraits = [];
      
      for (let i = 0; i < traitCount; i++) {
        const randomIndex = Math.floor(Math.random() * possibleTraits.length);
        selectedTraits.push(possibleTraits[randomIndex]);
        possibleTraits.splice(randomIndex, 1);
      }
      
      // Pick a random role
      const role = roles[Math.floor(Math.random() * roles.length)];
      
      // Generate a name
      const firstNames = ['Alex', 'Morgan', 'Riley', 'Taylor', 'Jordan', 'Casey', 'Quinn', 'Reese', 'Dakota', 'Skyler'];
      const lastNames = ['Chen', 'Singh', 'Kim', 'Patel', 'Nakamura', 'Rodriguez', 'Novak', 'Okafor', 'Khalil', 'Schmidt'];
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      
      // Deploy drone through game controller
      const droneId = gameControllerRef.current.deployDrone(selectedTraits);
      
      // Create villager object
      const newVillager: Villager = {
        id: droneId,
        name,
        role,
        traits: selectedTraits,
        eq: 50,
        x: 0,
        y: 0,
        memory: []
      };
      
      // Add to villagers state
      setVillagers(prev => ({
        ...prev,
        [droneId]: newVillager
      }));
      
      // Set active villager for chat
      setActiveVillagerId(droneId);
      
      // Add initial system message
      const systemMessage: ChatMessage = {
        senderId: droneId,
        role: 'system',
        content: `${name}, a ${role} with ${selectedTraits.join(', ')} traits, has been deployed to the colony.`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
    } catch (error) {
      console.error('Failed to deploy drone:', error);
    } finally {
      setIsDeploying(false);
    }
  };
  
  // Building selection
  const handleSelectBuilding = (building: BuildingSpec) => {
    if (!gameControllerRef.current) return;
    
    // Attempt to place building
    const success = gameControllerRef.current.placeBuilding(building);
    
    if (success) {
      // Remove from generated buildings
      setGeneratedBuildings(prev => 
        prev.filter(b => b.name !== building.name)
      );
    }
  };
  
  // Villager arrival at building
  const handleVillagerArrival = async (villagerId: string, buildingId: string) => {
    if (!gameControllerRef.current) return;
    
    try {
      // Call the API to get status report
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          villagerId,
          buildingId,
          villager: villagers[villagerId],
          colony: {
            name: colonyName,
            credits,
            averageEq
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Add status message to chat
        const statusMessage: ChatMessage = {
          senderId: villagerId,
          role: 'assistant',
          content: data.status,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, statusMessage]);
      }
      
    } catch (error) {
      console.error('Failed to get status report:', error);
    }
  };
  
  // Send chat message
  const handleSendMessage = async (content: string) => {
    if (!activeVillagerId || !content.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      senderId: 'user',
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          villagerId: activeVillagerId,
          villager: villagers[activeVillagerId],
          userRole: 'Colony Administrator'
        }),
      });
      
      const data = await response.json();
      
      if (data.message) {
        // Add AI response to chat
        setMessages(prev => [...prev, data.message]);
        
        // Update villager memory
        setVillagers(prev => ({
          ...prev,
          [activeVillagerId]: {
            ...prev[activeVillagerId],
            memory: data.updatedMemory || prev[activeVillagerId].memory
          }
        }));
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  };
  
  // Render setup screen if colony not started
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <Head>
          <title>Neo-Colony AI Architect</title>
        </Head>
        
        <div className="max-w-md w-full bg-black/40 backdrop-blur-md p-8 rounded-xl border border-neon-blue/30 shadow-lg">
          <h1 className="text-4xl font-bold text-neon-blue mb-6 text-center">Neo-Colony</h1>
          <p className="text-gray-300 mb-8 text-center">You are the AI Architect. Name your colony on the terraformed moon and begin building a new civilization.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (colonyName.trim()) {
              setGameStarted(true);
            }
          }}>
            <div className="mb-6">
              <label htmlFor="colonyName" className="block text-gray-400 mb-2">Colony Name</label>
              <input
                type="text"
                id="colonyName"
                value={colonyName}
                onChange={(e) => setColonyName(e.target.value)}
                placeholder="Enter a name for your colony"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={!colonyName.trim()}
              className="w-full bg-neon-blue bg-opacity-20 hover:bg-opacity-30 text-white py-3 rounded-md border border-neon-blue font-medium transition-colors"
            >
              Initialize Colony Systems
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 overflow-hidden">
      <Head>
        <title>{colonyName} - Neo-Colony</title>
      </Head>
      
      <HUD
        colonyName={colonyName}
        credits={credits}
        averageEq={averageEq}
        onGenerateInfrastructure={generateInfrastructure}
        onDeployDrone={deployDrone}
        generatedBuildings={generatedBuildings}
        onSelectBuilding={handleSelectBuilding}
        isGenerating={isGenerating}
        isDeploying={isDeploying}
      />
      
      <ChatOverlay
        messages={messages}
        villagers={villagers}
        onSendMessage={activeVillagerId ? handleSendMessage : undefined}
        activeVillagerId={activeVillagerId}
      />
      
      <GameComponent
        colonyName={colonyName}
        onCreditsChange={setCredits}
        onEqChange={setAverageEq}
        onVillagerArrival={handleVillagerArrival}
        gameControllerRef={gameControllerRef}
      />
    </div>
  );
} 