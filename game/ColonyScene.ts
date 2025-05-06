import {
  Building,
  BuildingSpec,
  Colony,
  Villager
} from '../utils/types';
import {
  hexToPixel,
  pixelToHex,
  canPlaceBuilding,
  findPath,
  calculateAverageEq,
  updateCredits,
  calculateEqEffect,
  generateId
} from '../utils/gameHelpers';

// Define Phaser types without importing
type Scene = any;
type Pointer = any;
type Graphics = any;
type Sprite = any;
type Container = any;
type GameObjects = {
  Graphics: any;
  Sprite: any;
  Container: any;
  Text: any;
};
type Time = any;
type Input = any;

interface ColonySceneConfig {
  width: number;
  height: number;
  onCreditsChange: (credits: number) => void;
  onEqChange: (eq: number) => void;
  onVillagerChat: (villagerId: string, message: string) => void;
  onVillagerArrived: (villagerId: string, buildingId: string) => void;
}

export default class ColonyScene {
  private config: ColonySceneConfig;
  private colony: Colony;
  private hexSize: number = 40;
  private hexGrid!: Graphics;
  private buildingSprites: { [key: string]: Sprite } = {};
  private villagerSprites: { [key: string]: Sprite } = {};
  private draggedBuilding: { 
    sprite: Sprite, 
    spec: BuildingSpec 
  } | null = null;
  private lastUpdateTime: number = 0;
  private speechBubbles: { [key: string]: Container } = {};
  
  // Phaser properties
  public scene!: Scene;
  public add!: any;
  public time!: Time;
  public input!: Input;
  public gameObjects!: GameObjects;
  public load!: any;
  
  constructor(config: ColonySceneConfig) {
    this.config = config;
    this.colony = {
      name: '',
      credits: 1000,
      buildings: {},
      villagers: {},
      averageEq: 50
    };
    console.log("ColonyScene constructor called with config:", config);
  }
  
  preload() {
    // This will be called by the parent Phaser scene
    // Images will be loaded through the parent scene
    console.log("ColonyScene preload called");
  }
  
  create() {
    console.log("ColonyScene create called");
    
    if (!this.add) {
      console.error('Phaser properties not properly injected into ColonyScene');
      return;
    }
    
    try {
      // Create the scene
      this.hexGrid = this.add.graphics();
      console.log("Created hex grid graphics");
      
      // Draw initial grid
      this.drawHexGrid();
      
      // Setup input handling
      this.input.on('pointerdown', this.handlePointerDown, this);
      this.input.on('pointermove', this.handlePointerMove, this);
      this.input.on('pointerup', this.handlePointerUp, this);
      console.log("Input handlers registered");
      
      // Set lastUpdateTime
      this.lastUpdateTime = this.time.now;
    } catch (error) {
      console.error("Error in create method:", error);
    }
  }
  
  update(time: number, delta: number) {
    // Calculate elapsed time since last update
    const elapsed = time - this.lastUpdateTime;
    this.lastUpdateTime = time;
    
    // Update credits in real-time
    this.colony.credits = updateCredits(this.colony, elapsed);
    this.config.onCreditsChange(Math.floor(this.colony.credits));
    
    // Update villagers
    Object.values(this.colony.villagers).forEach(villager => {
      this.updateVillager(villager, elapsed);
    });
    
    // Update average EQ
    this.colony.averageEq = calculateAverageEq(this.colony.villagers);
    this.config.onEqChange(this.colony.averageEq);
  }
  
  updateVillager(villager: Villager, elapsed: number) {
    // Skip if no current target
    if (!villager.currentTarget) return;
    
    const sprite = this.villagerSprites[villager.id];
    if (!sprite) return;
    
    // Move towards target
    const speed = 0.1; // pixels per ms
    const dx = villager.currentTarget.x - villager.x;
    const dy = villager.currentTarget.y - villager.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) {
      // Arrived at target
      villager.x = villager.currentTarget.x;
      villager.y = villager.currentTarget.y;
      villager.currentTarget = undefined;
      
      // Check if arrived at a building
      const targetHex = pixelToHex(villager.x, villager.y, this.hexSize);
      const targetBuilding = Object.values(this.colony.buildings).find(b => 
        b.gridX === targetHex.q && b.gridY === targetHex.r
      );
      
      if (targetBuilding) {
        // Notify arrival
        this.config.onVillagerArrived(villager.id, targetBuilding.id);
        
        // Add to building occupants
        if (!targetBuilding.occupants.includes(villager.id)) {
          targetBuilding.occupants.push(villager.id);
        }
        
        // Update EQ based on building effect
        villager.eq = Math.max(0, Math.min(100, villager.eq + (targetBuilding.eqImpact / 10)));
      }
    } else {
      // Move towards target
      const moveDistance = speed * elapsed;
      const ratio = moveDistance / distance;
      
      villager.x += dx * ratio;
      villager.y += dy * ratio;
      
      // Update sprite position
      sprite.x = villager.x;
      sprite.y = villager.y;
      
      // Calculate EQ effect from nearby buildings
      const eqEffect = calculateEqEffect(villager, this.colony.buildings, this.hexSize);
      villager.eq = Math.max(0, Math.min(100, villager.eq + (eqEffect * elapsed / 10000)));
    }
  }
  
  setColonyName(name: string) {
    console.log("Setting colony name to:", name);
    this.colony.name = name;
  }
  
  drawHexGrid() {
    try {
      console.log("Drawing hex grid with dimensions:", this.config.width, this.config.height);
      const { width, height } = this.config;
      
      if (!this.hexGrid) {
        console.error("Hex grid graphics not initialized");
        return;
      }
      
      this.hexGrid.clear();
      
      // Set grid line style
      this.hexGrid.lineStyle(1, 0x2222aa, 0.3);
      
      // Calculate grid dimensions
      const horizDist = this.hexSize * 1.5;
      const vertDist = this.hexSize * Math.sqrt(3);
      
      // Calculate grid size
      const cols = Math.ceil(width / horizDist);
      const rows = Math.ceil(height / vertDist);
      
      console.log(`Drawing hex grid with ${cols} columns and ${rows} rows`);
      
      // Draw hexes across the whole screen
      for (let x = 0; x < width; x += horizDist) {
        for (let y = 0; y < height; y += vertDist) {
          // Draw hex at current position
          this.drawHex(x, y);
          
          // Draw offset hex for proper hex grid tiling
          if (y + vertDist/2 < height) {
            this.drawHex(x + horizDist/2, y + vertDist/2);
          }
        }
      }
      
      console.log("Finished drawing hex grid");
    } catch (error) {
      console.error("Error drawing hex grid:", error);
    }
  }
  
  drawHex(centerX: number, centerY: number) {
    try {
      const size = this.hexSize;
      
      this.hexGrid.beginPath();
      
      for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i;
        const x = centerX + size * Math.cos(angle);
        const y = centerY + size * Math.sin(angle);
        
        if (i === 0) {
          this.hexGrid.moveTo(x, y);
        } else {
          this.hexGrid.lineTo(x, y);
        }
      }
      
      this.hexGrid.closePath();
      this.hexGrid.strokePath();
    } catch (error) {
      console.error("Error drawing individual hex:", error);
    }
  }
  
  handlePointerDown(pointer: Pointer) {
    console.log("Pointer down at:", pointer.x, pointer.y);
    
    // Check if clicking on an existing building
    const buildings = Object.values(this.colony.buildings);
    const { q, r } = pixelToHex(pointer.x, pointer.y, this.hexSize);
    const building = buildings.find(b => b.gridX === q && b.gridY === r);
    
    if (building && this.draggedBuilding === null) {
      // Create speech bubble with building info
      this.createInfoBubble(building);
    }
  }
  
  handlePointerMove(pointer: Pointer) {
    if (this.draggedBuilding) {
      this.draggedBuilding.sprite.x = pointer.x;
      this.draggedBuilding.sprite.y = pointer.y;
      
      // Get hex coordinates
      const { q, r } = pixelToHex(pointer.x, pointer.y, this.hexSize);
      
      // Change tint based on placement possibility
      if (canPlaceBuilding(q, r, this.colony.buildings)) {
        this.draggedBuilding.sprite.setTint(0xffffff);
      } else {
        this.draggedBuilding.sprite.setTint(0xff0000);
      }
    }
  }
  
  handlePointerUp(pointer: Pointer) {
    console.log("Pointer up at:", pointer.x, pointer.y);
    
    if (this.draggedBuilding) {
      // Get hex coordinates
      const { q, r } = pixelToHex(pointer.x, pointer.y, this.hexSize);
      console.log("Trying to place building at hex:", q, r);
      
      if (canPlaceBuilding(q, r, this.colony.buildings)) {
        // Place building
        const position = hexToPixel(q, r, this.hexSize);
        const pixelX = position.x + this.config.width / 2;
        const pixelY = position.y + this.config.height / 2;
        
        // Create building object
        const building: Building = {
          ...this.draggedBuilding.spec,
          id: generateId(),
          gridX: q,
          gridY: r,
          occupants: []
        };
        
        console.log("Placing building:", building);
        
        // Add to colony
        this.colony.buildings[building.id] = building;
        
        // Create permanent sprite with enhanced visibility
        const sprite = this.add.sprite(pixelX, pixelY, this.draggedBuilding.sprite.texture.key);
        sprite.setScale(1.5); // Make it larger
        sprite.setDepth(50);  // Make sure it's visible above the grid
        
        // Add white glow for visibility
        sprite.setTint(0xffffff);
        
        // Add a text label below the building
        const text = this.add.text(pixelX, pixelY + 40, building.name, {
          font: '12px Arial',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 3, y: 1 }
        });
        text.setOrigin(0.5);
        text.setDepth(50);
        
        // Store the sprite
        this.buildingSprites[building.id] = sprite;
        
        console.log("Created building sprite at:", pixelX, pixelY);
        
        // Update credits
        this.colony.credits -= building.cost;
        this.config.onCreditsChange(Math.floor(this.colony.credits));
      } else {
        console.log("Cannot place building at this location");
      }
      
      // Remove dragged building and its text
      this.draggedBuilding.sprite.destroy();
      if ((this.draggedBuilding as any).text) {
        (this.draggedBuilding as any).text.destroy();
      }
      this.draggedBuilding = null;
    }
  }
  
  startBuildingPlacement(buildingSpec: BuildingSpec) {
    console.log("Starting building placement:", buildingSpec);
    
    if (!this.add || !this.input) {
      console.error("Phaser properties not properly injected");
      return false;
    }
    
    if (this.colony.credits < buildingSpec.cost) {
      // Not enough credits
      console.log("Not enough credits to place building");
      return false;
    }
    
    try {
      // Get a reference to the scene width and height
      const width = this.config.width;
      const height = this.config.height;
      
      // Create draggable sprite
      const spriteKey = buildingSpec.sprite || (
        buildingSpec.eqImpact > 0 
          ? 'building-placeholder-green' 
          : (buildingSpec.eqImpact < 0 ? 'building-placeholder-red' : 'building-placeholder-blue')
      );
      
      console.log("Creating sprite with key:", spriteKey);
      
      // Place the sprite in the center of the screen if no pointer
      const pointer = this.input.activePointer;
      const x = pointer.x || width / 2;
      const y = pointer.y || height / 2;
      
      console.log("Placing building at:", x, y);
      
      // Create a large visible sprite
      const sprite = this.add.sprite(x, y, spriteKey);
      sprite.setScale(2.0); // Make it bigger
      sprite.setDepth(1000); // Make sure it's visible on top of everything
      
      // Add a glow effect
      sprite.setTint(0xffff99);
      
      // Add a text label
      const text = this.add.text(x, y + 50, buildingSpec.name, {
        font: '14px Arial',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      });
      text.setOrigin(0.5);
      text.setDepth(1000);
      
      // Set as dragged building
      this.draggedBuilding = { 
        sprite, 
        spec: {
          ...buildingSpec,
          // Ensure sprite property is set
          sprite: spriteKey
        } 
      };
      
      // Store text in draggedBuilding so we can handle it together
      (this.draggedBuilding as any).text = text;
      
      console.log("Created draggable building sprite");
      
      return true;
    } catch (error) {
      console.error("Error creating building sprite:", error);
      return false;
    }
  }
  
  deployDrone(villagerSpec: Omit<Villager, 'id' | 'x' | 'y' | 'memory' | 'currentTarget'>) {
    console.log("Deploying drone with spec:", villagerSpec);
    
    if (!this.add) {
      console.error("Phaser properties not properly injected");
      return '';
    }
    
    try {
      // Create a new villager
      const id = generateId();
      
      // Get dimensions
      const width = this.config.width;
      const height = this.config.height;
      
      // Place drone in a visible, fixed location if not using hex grid
      const pixelX = width / 2;
      const pixelY = height / 2;
      
      console.log("Drone will spawn at:", pixelX, pixelY);
      
      // Create villager object
      const villager: Villager = {
        ...villagerSpec,
        id,
        x: pixelX,
        y: pixelY,
        eq: 50, // Default EQ
        memory: []
      };
      
      // Add to colony
      this.colony.villagers[id] = villager;
      
      // Create a more visible drone sprite
      const sprite = this.add.sprite(pixelX, pixelY, 'drone');
      sprite.setScale(1.5); // Make it bigger for visibility
      sprite.setDepth(100);  // Make sure it's visible above everything else
      sprite.setTint(0x00ff00); // Add green tint for visibility
      
      // Add a text label below the drone
      const text = this.add.text(pixelX, pixelY + 30, villagerSpec.name || 'New Drone', {
        font: '14px Arial',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 }
      });
      text.setOrigin(0.5);
      text.setDepth(100);
      
      // Store references
      this.villagerSprites[id] = sprite;
      console.log("Created drone sprite at:", pixelX, pixelY);
      
      // Show speech bubble
      this.showChatBubble(id, "Drone deployed and ready!");
      
      // Move drone somewhere after 2 seconds
      this.time.delayedCall(2000, () => {
        // Move to a random position on the screen for demonstration
        const randomX = Math.random() * width;
        const randomY = Math.random() * height;
        
        villager.currentTarget = { x: randomX, y: randomY };
        console.log("Moving drone to:", randomX, randomY);
      });
      
      return id;
    } catch (error) {
      console.error("Error deploying drone:", error);
      return '';
    }
  }
  
  moveVillagerToBuilding(villagerId: string, buildingId: string) {
    const villager = this.colony.villagers[villagerId];
    const building = this.colony.buildings[buildingId];
    
    if (!villager || !building) return false;
    
    // Convert grid coords to pixel
    const position = hexToPixel(building.gridX, building.gridY, this.hexSize);
    const pixelX = position.x + this.config.width / 2;
    const pixelY = position.y + this.config.height / 2;
    
    // Set target
    villager.currentTarget = { x: pixelX, y: pixelY };
    
    return true;
  }
  
  createInfoBubble(building: Building) {
    // Remove any existing bubbles
    Object.values(this.speechBubbles).forEach(bubble => bubble.destroy());
    this.speechBubbles = {};
    
    // Convert grid coords to pixel
    const position = hexToPixel(building.gridX, building.gridY, this.hexSize);
    const x = position.x + this.config.width / 2;
    const y = position.y + this.config.height / 2 - this.hexSize - 10;
    
    // Create container
    const container = this.add.container(x, y);
    
    // Create background
    const width = 150;
    const height = 80;
    const background = this.add.graphics();
    background.fillStyle(0x000000, 0.7);
    background.fillRoundedRect(-width/2, -height/2, width, height, 8);
    container.add(background);
    
    // Add text
    const style = { font: '12px Arial', color: '#ffffff', align: 'center' };
    const text = this.add.text(0, -20, building.name, { ...style, fontSize: '14px', fontStyle: 'bold' });
    text.setOrigin(0.5);
    container.add(text);
    
    const costText = this.add.text(0, 0, `Cost: ${building.cost}`, style);
    costText.setOrigin(0.5);
    container.add(costText);
    
    const eqText = this.add.text(0, 20, `EQ Impact: ${building.eqImpact > 0 ? '+' : ''}${building.eqImpact}`, style);
    eqText.setOrigin(0.5);
    container.add(eqText);
    
    // Add close button
    const closeBtn = this.add.text(width/2 - 15, -height/2 + 10, 'X', { font: '14px Arial', color: '#ffffff' });
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => {
      container.destroy();
      delete this.speechBubbles[building.id];
    });
    container.add(closeBtn);
    
    // Store in bubbles map
    this.speechBubbles[building.id] = container;
    
    // Auto-hide after 5 seconds
    this.time.delayedCall(5000, () => {
      if (this.speechBubbles[building.id]) {
        this.speechBubbles[building.id].destroy();
        delete this.speechBubbles[building.id];
      }
    });
  }
  
  showChatBubble(villagerId: string, message: string) {
    const villager = this.colony.villagers[villagerId];
    if (!villager) return;
    
    // Remove existing bubble for this villager
    if (this.speechBubbles[villagerId]) {
      this.speechBubbles[villagerId].destroy();
    }
    
    try {
      // Create container
      const container = this.add.container(villager.x, villager.y - 50);
      container.setDepth(150); // Make sure it's visible on top
      
      // Create background
      const width = 150;
      const height = 60;
      const background = this.add.graphics();
      background.fillStyle(0x222266, 0.9);
      background.fillRoundedRect(-width/2, -height/2, width, height, 8);
      container.add(background);
      
      // Add text
      const text = this.add.text(0, 0, message, { 
        font: '12px Arial', 
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 20 } 
      });
      text.setOrigin(0.5);
      container.add(text);
      
      // Store in bubbles map
      this.speechBubbles[villagerId] = container;
      
      // Auto-hide after 4 seconds
      this.time.delayedCall(4000, () => {
        if (this.speechBubbles[villagerId]) {
          this.speechBubbles[villagerId].destroy();
          delete this.speechBubbles[villagerId];
        }
      });
    } catch (error) {
      console.error("Error showing chat bubble:", error);
    }
  }
} 