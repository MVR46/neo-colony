import { useEffect, useRef, MutableRefObject } from 'react';
import Phaser from 'phaser';
import ColonyScene from '../game/ColonyScene';
import { BuildingSpec } from '../utils/types';

export interface GameComponentProps {
  colonyName: string;
  onCreditsChange: (credits: number) => void;
  onEqChange: (eq: number) => void;
  onVillagerArrival: (villagerId: string, buildingId: string) => void;
  gameControllerRef: React.MutableRefObject<{
    placeBuilding: (building: BuildingSpec) => boolean;
    handleVillagerArrival: (villagerId: string, buildingId: string) => void;
    deployDrone: (traits: string[]) => string;
  } | null>;
}

const GameComponent: React.FC<GameComponentProps> = ({
  colonyName,
  onCreditsChange,
  onEqChange,
  onVillagerArrival,
  gameControllerRef
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ColonyScene | null>(null);
  
  useEffect(() => {
    // Skip if already initialized or container not ready
    if (gameInstanceRef.current || !gameContainerRef.current) return;
    
    // Get container dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Configure the game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      backgroundColor: '#151825',
      parent: gameContainerRef.current,
      scene: [],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      }
    };
    
    // Create the game instance
    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;
    
    // Create and add the colony scene
    const colonyScene = new ColonyScene({
      width,
      height,
      onCreditsChange,
      onEqChange,
      onVillagerChat: (villagerId, message) => {
        // Villager chat handler would go here
      },
      onVillagerArrived: onVillagerArrival
    });
    
    game.scene.add('ColonyScene', colonyScene, true);
    sceneRef.current = colonyScene;
    
    // Set colony name
    colonyScene.setColonyName(colonyName);
    
    // Expose game control methods
    gameControllerRef.current = {
      placeBuilding: (building: BuildingSpec) => {
        if (!sceneRef.current) return false;
        return sceneRef.current.startBuildingPlacement(building);
      },
      
      handleVillagerArrival: (villagerId, buildingId) => {
        if (!sceneRef.current) return;
        // Any additional handling could go here
      },
      
      deployDrone: (traits: string[]) => {
        if (!sceneRef.current) return '';
        
        // Create a basic villager with the given traits
        return sceneRef.current.deployDrone({
          name: 'Drone', // This will be overridden in the main component
          role: 'Worker',
          traits,
          eq: 50
        });
      }
    };
    
    // Handle window resize
    const handleResize = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
        sceneRef.current = null;
        gameControllerRef.current = null;
      }
    };
  }, [colonyName, onCreditsChange, onEqChange, onVillagerArrival, gameControllerRef]);
  
  // Update colony name if it changes
  useEffect(() => {
    if (sceneRef.current && colonyName) {
      sceneRef.current.setColonyName(colonyName);
    }
  }, [colonyName]);
  
  return (
    <div 
      ref={gameContainerRef} 
      className="w-full h-screen" 
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    />
  );
};

export default GameComponent; 