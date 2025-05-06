"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChatOverlay from '../components/ChatOverlay';
import HUD from '../components/HUD';
import { BuildingSpec, ChatMessage, Villager as VillagerType } from '../utils/types';

// Dynamically import GameComponent with SSR disabled
const GameComponent = dynamic(
  () => import('../components/GameComponent'),
  { ssr: false }
);

// Simple building renderer component
const Building = ({ building, position }: { building: BuildingSpec, position: { x: number, y: number } }) => {
  const color = building.eqImpact > 0 ? '#00cc00' : (building.eqImpact < 0 ? '#cc0000' : '#0066cc');
  
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ 
        left: position.x, 
        top: position.y,
        zIndex: 50
      }}
    >
      <div 
        className="w-20 h-20 rounded border-2 flex items-center justify-center"
        style={{ backgroundColor: color, borderColor: '#ffffff' }}
      >
        <div className="text-white text-xs text-center font-bold">{building.name}</div>
      </div>
    </div>
  );
};

// Simple drone/villager renderer component
const Villager = ({ 
  name, 
  position, 
  isAI = false, 
  eq = 50,
  onClick
}: { 
  name: string, 
  position: { x: number, y: number },
  isAI?: boolean,
  eq?: number,
  onClick?: () => void 
}) => {
  // Determine emotion icon and color based on EQ level
  const getEmotionIcon = () => {
    if (eq >= 80) return { icon: '😀', color: '#00cc00' };
    if (eq >= 60) return { icon: '🙂', color: '#66cc00' };
    if (eq >= 40) return { icon: '😐', color: '#cccc00' };
    if (eq >= 20) return { icon: '🙁', color: '#cc6600' };
    return { icon: '😠', color: '#cc0000' };
  };
  
  const emotion = getEmotionIcon();
  
  return (
    <div 
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ 
        left: position.x, 
        top: position.y,
        zIndex: 100
      }}
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center"
        style={{ backgroundColor: isAI ? '#9900cc' : '#00cc66' }}
      >
        <div className="text-white text-lg font-bold">{emotion.icon}</div>
      </div>
      <div className="text-white text-xs mt-1 bg-black px-1 rounded text-center">{name}</div>
    </div>
  );
};

export default function Home() {
  const [credits, setCredits] = useState(1000);
  const [averageEq, setAverageEq] = useState(100);
  const [colonyName, setColonyName] = useState("Neo-Colony Alpha");
  const [villagers, setVillagers] = useState<Record<string, VillagerType>>({});
  const [generatedBuildings, setGeneratedBuildings] = useState<BuildingSpec[]>([]);
  const [placedBuildings, setPlacedBuildings] = useState<Array<{ building: BuildingSpec, position: { x: number, y: number } }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameReady, setGameReady] = useState(false);
  const [drones, setDrones] = useState<Array<{ id: string, name: string, position: { x: number, y: number } }>>([]);
  const [aiVillagers, setAiVillagers] = useState<Array<{ id: string, name: string, role: string, traits: string[], eq: number, position: { x: number, y: number } }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBuilding, setDraggedBuilding] = useState<BuildingSpec | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [activeVillagerId, setActiveVillagerId] = useState<string | null>(null);
  const [isGeneratingVillager, setIsGeneratingVillager] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const gameControllerRef = useRef<{
    placeBuilding: (building: any) => boolean;
    handleVillagerArrival: (villagerId: string, buildingId: string) => void;
    deployDrone: (traits: string[]) => string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleCreditsChange = (newCredits: number) => {
    console.log("Credits changed:", newCredits);
    setCredits(newCredits);
  };

  const handleEqChange = (newEq: number) => {
    console.log("EQ changed:", newEq);
    setAverageEq(newEq);
  };

  const handleVillagerArrival = (villagerId: string, buildingId: string) => {
    console.log(`Villager ${villagerId} arrived at building ${buildingId}`);
    // Update villager state if needed
  };

  const calculateAverageEq = () => {
    const allVillagers = [...Object.values(villagers), ...aiVillagers];
    if (allVillagers.length === 0) return 100;
    
    const sum = allVillagers.reduce((acc, v) => acc + v.eq, 0);
    return Math.round(sum / allVillagers.length);
  };

  // Update average EQ whenever villagers change
  useEffect(() => {
    setAverageEq(calculateAverageEq());
  }, [villagers, aiVillagers]);

  const handleGenerateInfrastructure = () => {
    console.log("Generating infrastructure...");
    setIsGenerating(true);
    
    // Mock generation of buildings
    setTimeout(() => {
      // Create a variety of buildings
      const newBuildings: BuildingSpec[] = [
        {
          name: "Habitat Module",
          sprite: "building-placeholder-green",
          cost: 500,
          eqImpact: 5,
          description: "Basic living quarters for colonists"
        },
        {
          name: "Medical Center",
          sprite: "building-placeholder-blue",
          cost: 800,
          eqImpact: 10,
          description: "Provides healthcare and boosts EQ"
        },
        {
          name: "Factory",
          sprite: "building-placeholder-red",
          cost: 1200,
          eqImpact: -5,
          description: "Produces resources but reduces EQ"
        }
      ];
      
      console.log("Generated buildings:", newBuildings);
      setGeneratedBuildings(newBuildings);
      setIsGenerating(false);
    }, 1500);
  };

  const handleDeployDrone = () => {
    console.log("Deploying drone...");
    setIsDeploying(true);
    
    // Generate random position within the container
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    const randomX = Math.random() * containerWidth;
    const randomY = Math.random() * containerHeight;
    
    setTimeout(() => {
      // Generate unique ID
      const droneId = `drone-${Date.now()}`;
      const droneName = `Drone-${Math.floor(Math.random() * 1000)}`;
      
      // Add drone directly to our state
      const newDrone = {
        id: droneId,
        name: droneName,
        position: { x: randomX, y: randomY }
      };
      
      setDrones(prevDrones => [...prevDrones, newDrone]);
      
      // Add to villagers state for chat
      setVillagers(prev => ({
        ...prev,
        [droneId]: {
          id: droneId,
          name: droneName,
          role: 'Worker',
          traits: ['Industrious', 'Social'],
          eq: 50,
          x: randomX,
          y: randomY,
          memory: []
        }
      }));
      
      // Add a message from the new drone
      const newMessage: ChatMessage = {
        senderId: droneId,
        role: "assistant",
        content: "Drone deployed and ready for duty!",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      setIsDeploying(false);
      
      // Move drone after a delay
      setTimeout(() => {
        const newX = Math.random() * containerWidth;
        const newY = Math.random() * containerHeight;
        
        setDrones(prevDrones => 
          prevDrones.map(drone => 
            drone.id === droneId 
              ? { ...drone, position: { x: newX, y: newY }} 
              : drone
          )
        );
      }, 3000);
      
    }, 1500);
  };

  const generateAIVillager = async () => {
    // Don't allow generating multiple AI villagers at once
    if (isGeneratingVillager) return;
    
    setIsGeneratingVillager(true);
    
    try {
      // Generate random position
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
      const randomX = 200 + Math.random() * (containerWidth - 400); // Keep away from edges
      const randomY = 200 + Math.random() * (containerHeight - 400);
      
      // Call API to generate AI villager
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colonyName,
          buildings: placedBuildings.map(p => p.building)
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate AI villager');
      }
      
      const data = await response.json();
      
      // Generate a unique ID for the villager
      const villagerId = `ai-villager-${Date.now()}`;
      
      // Create the AI villager
      const newVillager = {
        id: villagerId,
        name: data.name || `Colonist-${Math.floor(Math.random() * 1000)}`,
        role: data.role || 'Colonist',
        traits: data.traits || ['Adaptable', 'Curious'],
        eq: data.eq || Math.floor(Math.random() * 40) + 40, // Random EQ between 40-80
        position: { x: randomX, y: randomY },
        x: randomX,
        y: randomY,
        memory: []
      };
      
      // Add to AI villagers state
      setAiVillagers(prev => [...prev, newVillager]);
      
      // Add to villagers state for chat
      setVillagers(prev => ({
        ...prev,
        [villagerId]: {
          ...newVillager,
          memory: []
        }
      }));
      
      // Add an introduction message from the new villager
      const introMessage: ChatMessage = {
        senderId: villagerId,
        role: "assistant",
        content: data.introduction || `Hello, I'm ${newVillager.name}. I've arrived at the colony.`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, introMessage]);
      
      // Add to memory
      setVillagers(prev => ({
        ...prev,
        [villagerId]: {
          ...prev[villagerId],
          memory: [...(prev[villagerId]?.memory || []), introMessage]
        }
      }));
      
    } catch (error) {
      console.error("Error generating AI villager:", error);
      
      // Fallback to create a basic villager if API fails
      const villagerId = `ai-villager-${Date.now()}`;
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
      const randomX = 200 + Math.random() * (containerWidth - 400);
      const randomY = 200 + Math.random() * (containerHeight - 400);
      
      const fallbackVillager = {
        id: villagerId,
        name: `Colonist-${Math.floor(Math.random() * 1000)}`,
        role: 'Colonist',
        traits: ['Adaptable', 'Resourceful'],
        eq: Math.floor(Math.random() * 40) + 40,
        position: { x: randomX, y: randomY },
        x: randomX,
        y: randomY,
        memory: []
      };
      
      setAiVillagers(prev => [...prev, fallbackVillager]);
      setVillagers(prev => ({
        ...prev,
        [villagerId]: {
          ...fallbackVillager,
          memory: []
        }
      }));
      
      const introMessage: ChatMessage = {
        senderId: villagerId,
        role: "assistant",
        content: `Hello, I'm ${fallbackVillager.name}. I've arrived to help with the colony.`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, introMessage]);
      
      // Add to memory
      setVillagers(prev => ({
        ...prev,
        [villagerId]: {
          ...prev[villagerId],
          memory: [...(prev[villagerId]?.memory || []), introMessage]
        }
      }));
    } finally {
      setIsGeneratingVillager(false);
    }
  };

  const handleSelectVillager = (villagerId: string) => {
    setActiveVillagerId(villagerId);
  };

  const handleSendMessage = async (message: string) => {
    if (!activeVillagerId || !message.trim() || isSendingMessage) return;
    
    const activeVillager = villagers[activeVillagerId];
    if (!activeVillager) return;
    
    setIsSendingMessage(true);
    
    try {
      // Create user message
      const userMessage: ChatMessage = {
        senderId: 'user',
        role: 'user',
        content: message,
        timestamp: Date.now()
      };
      
      // Add to messages
      setMessages(prev => [...prev, userMessage]);
      
      // Add to villager memory
      setVillagers(prev => ({
        ...prev,
        [activeVillagerId]: {
          ...prev[activeVillagerId],
          memory: [...(prev[activeVillagerId]?.memory || []), userMessage]
        }
      }));
      
      // Call API to get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          villagerId: activeVillagerId,
          villager: villagers[activeVillagerId],
          userRole: 'Colony Administrator'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }
      
      const data = await response.json();
      
      // Add AI response to messages
      setMessages(prev => [...prev, data.message]);
      
      // Update villager memory
      setVillagers(prev => ({
        ...prev,
        [activeVillagerId]: {
          ...prev[activeVillagerId],
          memory: data.updatedMemory
        }
      }));
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Fallback response if API fails
      const fallbackResponse: ChatMessage = {
        senderId: activeVillagerId,
        role: 'assistant',
        content: 'I apologize, but I cannot respond at the moment.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
      
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSelectBuilding = (building: BuildingSpec) => {
    console.log("Selecting building:", building);
    
    // Set as the currently dragged building
    setDraggedBuilding(building);
    setIsDragging(true);
    
    // Remove from available buildings
    setGeneratedBuildings(prev => 
      prev.filter(b => b.name !== building.name)
    );
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && draggedBuilding) {
      // Update the position of the dragged building
      setDragPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && draggedBuilding) {
      // Place the building at the current position
      const newPosition = {
        x: e.clientX,
        y: e.clientY
      };
      
      // Add to placed buildings
      setPlacedBuildings(prev => [
        ...prev, 
        { building: draggedBuilding, position: newPosition }
      ]);
      
      // Update credits
      setCredits(prev => prev - draggedBuilding.cost);
      
      // Reset dragging state
      setIsDragging(false);
      setDraggedBuilding(null);
    }
  };
  
  // Log when the game controller is set
  useEffect(() => {
    if (gameControllerRef.current) {
      console.log("Game controller initialized");
      setGameReady(true);
    }
  }, [gameControllerRef.current]);

  // Add periodic AI villager actions
  useEffect(() => {
    if (aiVillagers.length === 0) return;
    
    const interval = setInterval(() => {
      // Random chance for an AI villager to do something
      if (Math.random() > 0.7) {
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
        const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
        
        // Randomly select an AI villager
        const randomIndex = Math.floor(Math.random() * aiVillagers.length);
        const villager = aiVillagers[randomIndex];
        
        // Move the villager to a new position
        const newX = Math.random() * containerWidth;
        const newY = Math.random() * containerHeight;
        
        setAiVillagers(prev => 
          prev.map((v, index) => 
            index === randomIndex 
              ? { ...v, position: { x: newX, y: newY }, x: newX, y: newY } 
              : v
          )
        );
        
        // Also update in the villagers state
        setVillagers(prev => ({
          ...prev,
          [villager.id]: {
            ...prev[villager.id],
            x: newX,
            y: newY
          }
        }));
        
        // Randomly adjust EQ based on building proximity
        const nearbyBuilding = placedBuildings.find(b => 
          Math.sqrt(
            Math.pow(b.position.x - newX, 2) + 
            Math.pow(b.position.y - newY, 2)
          ) < 150
        );
        
        if (nearbyBuilding) {
          const newEq = Math.max(
            10, 
            Math.min(
              100, 
              villager.eq + (nearbyBuilding.building.eqImpact / 2)
            )
          );
          
          setAiVillagers(prev => 
            prev.map((v, index) => 
              index === randomIndex 
                ? { ...v, eq: newEq } 
                : v
            )
          );
          
          // Also update in the villagers state
          setVillagers(prev => ({
            ...prev,
            [villager.id]: {
              ...prev[villager.id],
              eq: newEq
            }
          }));
        }
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [aiVillagers, placedBuildings]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Game component takes the full screen as the background */}
      <GameComponent 
        colonyName={colonyName}
        onCreditsChange={handleCreditsChange}
        onEqChange={handleEqChange}
        onVillagerArrival={handleVillagerArrival}
        gameControllerRef={gameControllerRef}
      />
      
      {/* React-based game objects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Render placed buildings */}
        {placedBuildings.map((item, index) => (
          <Building 
            key={`building-${index}`}
            building={item.building}
            position={item.position}
          />
        ))}
        
        {/* Render drones */}
        {drones.map((drone) => (
          <Villager 
            key={drone.id}
            name={drone.name}
            position={drone.position}
            onClick={() => handleSelectVillager(drone.id)}
          />
        ))}
        
        {/* Render AI villagers */}
        {aiVillagers.map((villager) => (
          <Villager 
            key={villager.id}
            name={villager.name}
            position={villager.position}
            isAI={true}
            eq={villager.eq}
            onClick={() => handleSelectVillager(villager.id)}
          />
        ))}
        
        {/* Render currently dragged building */}
        {isDragging && draggedBuilding && (
          <div 
            className="absolute pointer-events-none"
            style={{ 
              left: dragPosition.x, 
              top: dragPosition.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 1000
            }}
          >
            <div 
              className="w-20 h-20 rounded border-2 flex items-center justify-center opacity-70"
              style={{ 
                backgroundColor: draggedBuilding.eqImpact > 0 ? '#00cc00' : 
                               (draggedBuilding.eqImpact < 0 ? '#cc0000' : '#0066cc'),
                borderColor: '#ffffff'
              }}
            >
              <div className="text-white text-xs text-center font-bold">{draggedBuilding.name}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* HUD overlay for game controls and status */}
      <HUD 
        credits={credits}
        averageEq={averageEq}
        colonyName={colonyName}
        generatedBuildings={generatedBuildings}
        isGenerating={isGenerating}
        isDeploying={isDeploying}
        onGenerateInfrastructure={handleGenerateInfrastructure}
        onDeployDrone={handleDeployDrone}
        onSelectBuilding={handleSelectBuilding}
      />
      
      {/* Chat overlay for AI interactions */}
      <ChatOverlay 
        messages={messages}
        villagers={villagers}
        onSendMessage={handleSendMessage}
        activeVillagerId={activeVillagerId || undefined}
      />
      
      {/* AI Villager control panel */}
      <div className="fixed top-4 right-4 bg-black/70 text-white p-2 rounded z-50 pointer-events-auto">
        <button
          onClick={generateAIVillager}
          disabled={isGeneratingVillager}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingVillager ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>Generate AI Villager</>
          )}
        </button>
      </div>
      
      {/* Debug overlay */}
      <div className="fixed bottom-4 right-4 bg-black/70 text-white text-xs p-2 rounded z-50">
        Game Ready: {gameReady ? 'Yes' : 'No'}<br />
        Available Buildings: {generatedBuildings.length}<br />
        Placed Buildings: {placedBuildings.length}<br />
        Drones: {drones.length}<br />
        AI Villagers: {aiVillagers.length}<br />
        Average EQ: {averageEq}
      </div>
    </div>
  );
}
