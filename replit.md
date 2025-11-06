# R4 Academy - AI Studio App

## Overview
R4 Academy is a React-based AI application powered by Google Gemini. It provides various AI agents including chat, image analysis, image generation, video generation, and prompt specialist capabilities.

## Project Architecture

### Tech Stack
- **Frontend Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **AI Integration**: Google Gemini API (@google/genai)
- **Styling**: TailwindCSS (via CDN)

### Project Structure
- `/components/` - React components
  - `/agents/` - AI agent components (Chat, Image Analysis, Image Generation, etc.)
  - Various UI components (Header, Sidebar, Modals, etc.)
- `App.tsx` - Main application component
- `index.tsx` - Application entry point
- `vite.config.ts` - Vite configuration
- `types.ts` - TypeScript type definitions

### Key Features
- Multiple AI agent interfaces
- Community view for content sharing
- Admin view for management
- Video player and editing capabilities
- Chat history sidebar

## Configuration

### Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key (configured in Replit Secrets)

### Server Configuration
- **Port**: 5000 (required for Replit frontend)
- **Host**: 0.0.0.0 (allows Replit proxy access)
- **HMR**: Configured for Replit's iframe proxy environment

## Development

### Running Locally
The app runs on port 5000 with hot module replacement enabled.

### Build Command
```bash
npm run build
```

### Development Command
```bash
npm run dev
```

## Recent Changes
- **2025-11-06**: Initial Replit setup
  - Configured Vite to use port 5000 for Replit compatibility
  - Added `allowedHosts: true` to fix Replit proxy blocking
  - Added HMR configuration for Replit's iframe proxy environment
  - Set up GEMINI_API_KEY in Replit Secrets
  - Installed dependencies
  - App successfully running and accessible

## Notes
- This app was imported from AI Studio (https://ai.studio/apps/drive/16b5ElGbSprtdan1jbs4RNGAE78kxil0q)
- The app uses TailwindCSS loaded from CDN
- Custom animations and styling defined in index.html
