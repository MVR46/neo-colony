import Phaser from 'phaser';
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

interface ColonySceneConfig {
  width: number;
  height: number;
  onCreditsChange: (credits: number) => void;
  onEqChange: (eq: number) => void;
  onVillagerChat: (villagerId: string, message: string) => void;
  onVillagerArrived: (villagerId: string, buildingId: string) => void;
}

export default class ColonyScene extends Phaser.Scene {
  private config: ColonySceneConfig;
  private colony: Colony;
  private hexSize: number = 40;
  private hexGrid!: Phaser.GameObjects.Graphics;
  private buildingSprites: { [key: string]: Phaser.GameObjects.Sprite } = {};
  private villagerSprites: { [key: string]: Phaser.GameObjects.Sprite } = {};
  private draggedBuilding: { 
    sprite: Phaser.GameObjects.Sprite, 
    spec: BuildingSpec 
  } | null = null;
  private lastUpdateTime: number = 0;
  private speechBubbles: { [key: string]: Phaser.GameObjects.Container } = {};
  
  constructor(config: ColonySceneConfig) {
    super('ColonyScene');
    this.config = config;
    this.colony = {
      name: '',
      credits: 1000,
      buildings: {},
      villagers: {},
      averageEq: 50
    };
  }
  
  preload() {
    // Preload simple colored rectangles for buildings
    this.load.image('building-placeholder-blue', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HUrXVRkQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCDq0ptsHxKcVMD8AAAAASUVORK5CYII=');
    this.load.image('building-placeholder-green', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HUrXVRkQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCDq0ptsHxEMVMBAAAAAASUVORK5CYII=');
    this.load.image('building-placeholder-red', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HUrXVRkQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCDq0ptsHxFAVMAQAAAAASUVORK5CYII=');
    this.load.image('building-placeholder-purple', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HUrXVRkQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCDq0ptsHxDgVMM8AAAAASUVORK5CYII=');
    
    // Preload drone/villager sprite
    this.load.image('drone', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAvklEQVR42mNgGAWjYKQCRgaGCgYGhnwGMgEjI0M+cS5nYKgiygEzZsxgJeQAsgMiNTWVlf7FMIN6aSj+HwSgCgPD/9TUaqIcQFJaJjEtExUQhByVn5/PSmsHDMo0TFRhNmPGDPKTIiMjhcmQwrgBkwxJSU6kOwh8fHxYKXEEyWmZ0lA8GEAVMaFgVN9omh4aGkpUCUFRKKQW1xMVCkQlRbKTIiVJkZGRtIg3kkOBlJpxEDiAgtCjuLQbBaNgkAMAf2qO3qZ6pnMAAAAASUVORK5CYII=');
  }
  
  create() {
    // Create the scene
    this.hexGrid = this.add.graphics();
    this.drawHexGrid();
    
    // Setup input handling
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    
    // Set lastUpdateTime
    this.lastUpdateTime = this.time.now;
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
    this.colony.name = name;
  }
  
  drawHexGrid() {
    const { width, height } = this.config;
    this.hexGrid.clear();
    
    // Set grid line style
    this.hexGrid.lineStyle(1, 0x2222aa, 0.3);
    
    // Calculate grid dimensions
    const horizDist = this.hexSize * 1.5;
    const vertDist = this.hexSize * Math.sqrt(3);
    
    // Calculate grid size
    const cols = Math.ceil(width / horizDist);
    const rows = Math.ceil(height / vertDist);
    
    // Center the grid
    const offsetX = (width - cols * horizDist) / 2 + this.hexSize;
    const offsetY = (height - rows * vertDist) / 2 + this.hexSize;
    
    // Draw hexes
    for (let q = -Math.floor(cols/2); q < Math.ceil(cols/2); q++) {
      for (let r = -Math.floor(rows/2); r < Math.ceil(rows/2); r++) {
        // Skip if outside visible area (using axial coordinates)
        const pos = hexToPixel(q, r, this.hexSize);
        const x = pos.x + width / 2;
        const y = pos.y + height / 2;
        
        if (x < -this.hexSize || x > width + this.hexSize || 
            y < -this.hexSize || y > height + this.hexSize) {
          continue;
        }
        
        this.drawHex(x, y);
      }
    }
  }
  
  drawHex(centerX: number, centerY: number) {
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
  }
  
  handlePointerDown(pointer: Phaser.Input.Pointer) {
    // Check if clicking on an existing building
    const buildings = Object.values(this.colony.buildings);
    const { q, r } = pixelToHex(pointer.x, pointer.y, this.hexSize);
    const building = buildings.find(b => b.gridX === q && b.gridY === r);
    
    if (building && this.draggedBuilding === null) {
      // Create speech bubble with building info
      this.createInfoBubble(building);
    }
  }
  
  handlePointerMove(pointer: Phaser.Input.Pointer) {
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
  
  handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.draggedBuilding) {
      // Get hex coordinates
      const { q, r } = pixelToHex(pointer.x, pointer.y, this.hexSize);
      
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
        
        // Add to colony
        this.colony.buildings[building.id] = building;
        
        // Create permanent sprite
        this.buildingSprites[building.id] = this.add.sprite(pixelX, pixelY, this.draggedBuilding.sprite.texture.key);
        
        // Update credits
        this.colony.credits -= building.cost;
        this.config.onCreditsChange(Math.floor(this.colony.credits));
      }
      
      // Remove dragged building
      this.draggedBuilding.sprite.destroy();
      this.draggedBuilding = null;
    }
  }
  
  startBuildingPlacement(buildingSpec: BuildingSpec) {
    if (this.colony.credits < buildingSpec.cost) {
      // Not enough credits
      return false;
    }
    
    // Create draggable sprite
    const spriteKey = buildingSpec.eqImpact > 0 
      ? 'building-placeholder-green' 
      : (buildingSpec.eqImpact < 0 ? 'building-placeholder-red' : 'building-placeholder-blue');
    
    const sprite = this.add.sprite(
      this.input.activePointer.x, 
      this.input.activePointer.y, 
      spriteKey
    );
    
    // Set as dragged building
    this.draggedBuilding = { sprite, spec: buildingSpec };
    
    return true;
  }
  
  deployDrone(villagerSpec: Omit<Villager, 'id' | 'x' | 'y' | 'memory' | 'currentTarget'>) {
    // Create a new villager
    const id = generateId();
    
    // Find a random edge hex to spawn at
    const gridSize = Math.floor(Math.min(this.config.width, this.config.height) / (this.hexSize * 2));
    const isEven = Math.random() > 0.5;
    const edgeQ = isEven ? Math.floor(Math.random() * gridSize) - Math.floor(gridSize / 2) : -Math.floor(gridSize / 2);
    const edgeR = isEven ? -Math.floor(gridSize / 2) : Math.floor(Math.random() * gridSize) - Math.floor(gridSize / 2);
    
    // Convert to pixel
    const position = hexToPixel(edgeQ, edgeR, this.hexSize);
    const pixelX = position.x + this.config.width / 2;
    const pixelY = position.y + this.config.height / 2;
    
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
    
    // Create sprite
    this.villagerSprites[id] = this.add.sprite(pixelX, pixelY, 'drone').setScale(0.5);
    
    return id;
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
    
    // Create container
    const container = this.add.container(villager.x, villager.y - 50);
    
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
  }
} 