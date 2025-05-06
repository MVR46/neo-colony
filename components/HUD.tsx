import React, { useState, useEffect } from 'react';
import { BuildingSpec } from '../utils/types';

interface HUDProps {
  colonyName: string;
  credits: number;
  averageEq: number;
  onGenerateInfrastructure: () => void;
  onDeployDrone: () => void;
  generatedBuildings: BuildingSpec[];
  onSelectBuilding: (building: BuildingSpec) => void;
  isGenerating: boolean;
  isDeploying: boolean;
}

const HUD: React.FC<HUDProps> = ({
  colonyName,
  credits,
  averageEq,
  onGenerateInfrastructure,
  onDeployDrone,
  generatedBuildings,
  onSelectBuilding,
  isGenerating,
  isDeploying
}) => {
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Determine EQ class
  const getEqClass = () => {
    if (averageEq >= 80) return 'text-neon-green';
    if (averageEq >= 60) return 'text-neon-blue';
    if (averageEq >= 40) return 'text-yellow-400';
    if (averageEq >= 20) return 'text-amber-600';
    return 'text-red-500';
  };

  // Get EQ status text
  const getEqStatus = () => {
    if (averageEq >= 80) return 'Thriving';
    if (averageEq >= 60) return 'Content';
    if (averageEq >= 40) return 'Neutral';
    if (averageEq >= 20) return 'Uneasy';
    return 'Distressed';
  };

  return (
    <div className="fixed top-0 left-0 right-0 p-2 flex justify-between items-start z-10 pointer-events-none">
      {/* Colony Name & Stats */}
      <div className="bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-neon-blue/30 pointer-events-auto">
        <h1 className="text-neon-blue text-xl font-bold tracking-wider mb-1">{colonyName}</h1>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Credits:</div>
          <div className="text-neon-yellow font-mono">{formatNumber(credits)}</div>
          
          <div className="text-gray-400">EQ Level:</div>
          <div className={`font-mono ${getEqClass()}`}>
            {averageEq}% <span className="text-xs">({getEqStatus()})</span>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={onGenerateInfrastructure}
          disabled={isGenerating}
          className="bg-neon-blue/20 hover:bg-neon-blue/40 border border-neon-blue text-white py-2 px-4 rounded-md flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>Generate Infrastructure</>
          )}
        </button>
        
        <button
          onClick={onDeployDrone}
          disabled={isDeploying}
          className="bg-neon-green/20 hover:bg-neon-green/40 border border-neon-green text-white py-2 px-4 rounded-md flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeploying ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deploying...
            </>
          ) : (
            <>Deploy Drone</>
          )}
        </button>
      </div>
      
      {/* Generated Buildings Panel */}
      {generatedBuildings.length > 0 && (
        <div className="fixed top-20 right-4 bg-black/80 backdrop-blur-sm p-4 rounded-lg border border-neon-pink/40 shadow-lg min-w-[300px] max-w-[400px] pointer-events-auto">
          <h2 className="text-neon-pink text-lg font-semibold mb-3">Available Infrastructure</h2>
          <div className="space-y-3">
            {generatedBuildings.map((building, idx) => (
              <div 
                key={idx} 
                className="bg-gray-900/70 p-3 rounded border border-gray-700 cursor-pointer hover:border-neon-blue transition-all"
                onClick={() => onSelectBuilding(building)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-white font-medium">{building.name}</h3>
                  <span className="text-neon-yellow font-mono text-sm">{building.cost} Cr</span>
                </div>
                <div className="flex items-center mt-1.5 text-sm">
                  <span className="text-gray-400 mr-2">EQ Impact:</span>
                  <span className={building.eqImpact > 0 ? 'text-neon-green' : building.eqImpact < 0 ? 'text-red-500' : 'text-gray-300'}>
                    {building.eqImpact > 0 ? `+${building.eqImpact}` : building.eqImpact}
                  </span>
                </div>
                {building.description && (
                  <p className="text-gray-400 text-sm mt-1">{building.description}</p>
                )}
                <div className="mt-2">
                  <button 
                    className="bg-neon-blue/20 hover:bg-neon-blue/40 text-sm text-white py-1 px-3 rounded w-full transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBuilding(building);
                    }}
                  >
                    Place Building
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HUD; 