"use client";

import { useEffect, useRef, MutableRefObject } from 'react';
import { BuildingSpec } from '../utils/types';

// Type definitions for Phaser types without importing the library directly
type PhaserGame = any;
type PhaserGameConfig = any;

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
  const gameInstanceRef = useRef<PhaserGame | null>(null);
  const sceneRef = useRef<any | null>(null);
  
  useEffect(() => {
    // Skip if already initialized or container not ready
    if (gameInstanceRef.current || !gameContainerRef.current) return;
    
    // Dynamically import Phaser and the ColonyScene
    const initGame = async () => {
      try {
        // Dynamically import Phaser only on client-side
        const Phaser = (await import('phaser')).default;
        const { default: ColonySceneClass } = await import('../game/ColonyScene');
        
        // Get container dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Define our custom Phaser scene
        class PhaserColonyScene extends Phaser.Scene {
          private colonySceneInstance: any;
          
          constructor() {
            super('ColonyScene');
          }
          
          preload() {
            console.log("Preloading assets in Phaser scene");
            
            // Preload simple colored rectangles for buildings
            this.load.image('building-placeholder-blue', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HUrXVRkQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCDq0ptsHxKcVMD8AAAAASUVORK5CYII=');
            this.load.image('building-placeholder-green', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HUrXVRkQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCDq0ptsHxEMVMBAAAAAASUVORK5CYII=');
            this.load.image('building-placeholder-red', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HUrXVRkQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCDq0ptsHxFAVMAQAAAAASUVORK5CYII=');
            this.load.image('building-placeholder-purple', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HUrXVRkQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCDq0ptsHxDgVMM8AAAAASUVORK5CYII=');
            
            // Preload drone/villager sprite
            this.load.image('drone', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAvklEQVR42mNgGAWjYKQCRgaGCgYGhnwGMgEjI0M+cS5nYKgiygEzZsxgJeQAsgMiNTWVlf7FMIN6aSj+HwSgCgPD/9TUaqIcQFJaJjEtExUQhByVn5/PSmsHDMo0TFRhNmPGDPKTIiMjhcmQwrgBkwxJSU6kOwh8fHxYKXEEyWmZ0lA8GEAVMaFgVN9omh4aGkpUCUFRKKQW1xMVCkQlRbKTIiVJkZGRtIg3kkOBlJpxEDiAgtCjuLQbBaNgkAMAf2qO3qZ6pnMAAAAASUVORK5CYII=');
            
            // Verify the images are loaded
            this.load.on('complete', () => {
              console.log("All images loaded successfully");
            });
            
            this.load.on('loaderror', (file: { key: string }) => {
              console.error("Error loading image:", file.key);
            });
          }
          
          create() {
            console.log("Creating Phaser scene");
            
            // Create our custom scene controller
            this.colonySceneInstance = new ColonySceneClass({
              width,
              height,
              onCreditsChange,
              onEqChange,
              onVillagerChat: (villagerId: string, message: string) => {
                // Villager chat handler would go here
              },
              onVillagerArrived: onVillagerArrival
            });
            
            // Inject Phaser properties into our scene
            this.colonySceneInstance.scene = this;
            this.colonySceneInstance.add = this.add;
            this.colonySceneInstance.time = this.time;
            this.colonySceneInstance.input = this.input;
            this.colonySceneInstance.load = this.load;
            this.colonySceneInstance.gameObjects = this.add;
            
            // Call create on our scene
            this.colonySceneInstance.create();
            
            // Set colony name
            this.colonySceneInstance.setColonyName(colonyName);
            
            // Store in ref for access
            sceneRef.current = this.colonySceneInstance;
            
            // Test sprite creation to verify sprite rendering
            const testSprite = this.add.sprite(width/2, height/2, 'building-placeholder-green');
            testSprite.setScale(1.5);
            testSprite.setDepth(1000); // Make it appear on top
            
            console.log("Created test sprite at center:", width/2, height/2);
            
            // Add a text label to help with debugging
            const text = this.add.text(width/2, height/2 + 70, 'Test Sprite', { 
              font: '16px Arial',
              color: '#ffffff'
            });
            text.setOrigin(0.5);
            text.setDepth(1000);
            
            // Remove test sprite after 3 seconds
            this.time.delayedCall(3000, () => {
              testSprite.destroy();
              text.destroy();
            });
          }
          
          update(time: number, delta: number) {
            if (this.colonySceneInstance) {
              this.colonySceneInstance.update(time, delta);
            }
          }
        }
        
        // Configure the game
        const config: PhaserGameConfig = {
          type: Phaser.AUTO,
          width,
          height,
          backgroundColor: '#151825',
          parent: gameContainerRef.current,
          scene: [PhaserColonyScene],
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false
            }
          },
          render: {
            pixelArt: false,
            antialias: true,
            roundPixels: false
          }
        };
        
        // Create the game instance
        const game = new Phaser.Game(config);
        gameInstanceRef.current = game;
        
        // Expose game control methods
        gameControllerRef.current = {
          placeBuilding: (building: BuildingSpec) => {
            if (!sceneRef.current) return false;
            return sceneRef.current.startBuildingPlacement(building);
          },
          
          handleVillagerArrival: (villagerId: string, buildingId: string) => {
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
        
        // Return cleanup function for when component unmounts
        return () => {
          window.removeEventListener('resize', handleResize);
          
          if (gameInstanceRef.current) {
            gameInstanceRef.current.destroy(true);
            gameInstanceRef.current = null;
            sceneRef.current = null;
            gameControllerRef.current = null;
          }
        };
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    };

    // Initialize the game
    initGame();
    
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