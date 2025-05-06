# Neo-Colony

A futuristic "AI Neo-Colony" simulation game where you are the AI Architect managing a colony on a terraformed moon. Build infrastructure, deploy drones, and manage your colony's resources.

## Features

- Generate futuristic buildings for your colony
- Deploy drones (villagers) to interact with your colony
- Real-time Credits and Emotional Quotient (EQ) management
- AI-powered status reports and chat with colony inhabitants
- Sleek neon-themed UI with hex grid gameplay

## Technologies Used

- **Frontend**: React + Phaser 3 (TypeScript) for the colony simulation
- **Styling**: Tailwind CSS + Preline UI for a sleek futuristic interface
- **AI Layer**: Next.js API routes calling OpenAI for generation and chat
- **State Management**: React hooks for clean state management

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- NPM or Yarn
- OpenAI API key

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/neo-colony.git
cd neo-colony
```

2. Install dependencies
```
npm install
```

3. Create a `.env.local` file in the project root with your OpenAI API key:
```
# Required: Your OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Model to use (defaults to gpt-4 in the code)
# OPENAI_MODEL=gpt-3.5-turbo
```

### Running the Development Server

```
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## How to Play

1. **Name Your Colony**: Start by giving your settlement a name
2. **Generate Infrastructure**: Click the "Generate Infrastructure" button to create building options
3. **Place Buildings**: Select buildings and place them on the hex grid
4. **Deploy Drones**: Add inhabitants to your colony
5. **Manage Resources**: Watch your Credits and EQ levels
6. **Chat with Drones**: Interact with your colony's inhabitants

## Game Mechanics

- **Credits**: Currency for building infrastructure. Different buildings have different costs.
- **EQ (Emotional Quotient)**: Represents the emotional wellbeing of your colony. 
- **Buildings**: Buildings can generate or consume Credits and affect the EQ of nearby drones.
- **Drones**: Colony inhabitants with individual personalities and roles.

## License

MIT

## Acknowledgments

- Phaser.js for the game engine
- OpenAI for the AI capabilities
- Next.js and React for the framework
- Tailwind and Preline for UI components
