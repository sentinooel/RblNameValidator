# Roblox Username Checker

## Overview

This is a full-stack web application that allows users to check the availability of Roblox usernames. The application provides both single username checking and bulk checking capabilities, along with statistics tracking and recent check history. It's built with a modern tech stack using React on the frontend and Express on the backend.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Library**: Built on shadcn/ui with Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: TanStack Query for API state, React hooks for local state
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle with PostgreSQL dialect
- **API Design**: RESTful endpoints with proper error handling
- **Rate Limiting**: In-memory rate limiting (10 requests per minute per IP)
- **External Integration**: Roblox API for username availability checking

### Database Schema
- **username_checks table**: Stores username check history with fields:
  - `id`: Primary key (serial)
  - `username`: The checked username (text)
  - `is_available`: Availability status (boolean)
  - `checked_at`: Timestamp of the check

### API Endpoints
- `POST /api/username/check`: Single username availability check
- `POST /api/username/bulk-check`: Bulk username checking (unlimited usernames)
- `POST /api/username/bulk-check-file`: File upload bulk checking (.txt files, up to 5MB)
- `GET /api/username/recent`: Retrieve recent username checks
- `GET /api/username/stats`: Get usage statistics
- `GET /api/status`: API health check

## Data Flow

1. **Username Validation**: Client-side validation using Zod schemas before API calls
2. **API Request**: Form submissions trigger API calls through TanStack Query
3. **Rate Limiting**: Server checks rate limits before processing requests
4. **Roblox API Integration**: Server makes requests to Roblox's user API to check availability
5. **Database Storage**: All checks are stored in PostgreSQL for history and statistics
6. **Response Handling**: Results are returned to client and cached by TanStack Query
7. **UI Updates**: Components reactively update based on query results

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18 with hooks, React Router (Wouter)
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Form Management**: React Hook Form with Zod resolvers
- **HTTP Client**: Fetch API with TanStack Query wrapper
- **Styling**: Tailwind CSS, class-variance-authority for component variants
- **Icons**: Lucide React icons
- **Date Handling**: date-fns for date formatting

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL, Drizzle ORM
- **Validation**: Zod for schema validation
- **Development**: tsx for TypeScript execution, esbuild for production builds

### External APIs
- **Roblox Users API**: `https://users.roblox.com/v1/usernames/users` for username availability checking

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Development
- `npm run dev`: Starts the development server with hot reloading
- Vite dev server serves the frontend with HMR
- Express server runs with tsx for TypeScript execution
- Database migrations can be pushed with `npm run db:push`

### Production Build
- `npm run build`: Builds both frontend and backend
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- `npm start`: Runs the production server

### Database Management
- Drizzle Kit handles schema migrations
- Configuration supports both development and production PostgreSQL connections
- Schema definitions are shared between client and server via the `shared` directory

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment detection for development/production modes
- Replit-specific plugins are conditionally loaded for development

## Changelog
- July 02, 2025. Initial setup
- July 02, 2025. Added unlimited bulk checking and file upload features:
  - Removed 10 username limit from bulk checking
  - Added file upload support for .txt files (up to 5MB, max 10,000 usernames)
  - Enhanced bulk checker UI with tabs for manual input vs file upload
  - Added processing summary with detailed statistics
  - Improved CSV export with error details
  - Updated API endpoints with multer for file handling
- July 02, 2025. Performance and design improvements:
  - Reduced processing delay from 1000ms to 200ms (5x faster)
  - Added download feature for available usernames (.txt files)
  - Enhanced site design with gradient backgrounds and glassmorphism effects
  - Improved card styling with hover animations and enhanced shadows
  - Updated header with gradient text and better status indicators
  - Enhanced features info section with bullet points and better styling
- July 02, 2025. Major UI/UX enhancements:
  - Added custom Roblox-themed logo with gradient design and checkmark
  - Completely redesigned bulk checker with modern card-based layout
  - Enhanced progress indicators with real-time status updates
  - Improved results display with color-coded status badges
  - Added comprehensive summary statistics with visual cards
  - Enhanced download section with gradient buttons and better organization
  - Implemented clean, professional color scheme throughout application
- July 02, 2025. API endpoint upgrade:
  - Updated to use Roblox auth validation API for more accurate results
  - Changed from POST to users endpoint to GET validation endpoint
  - New endpoint: https://auth.roblox.com/v1/usernames/validate
  - Provides more reliable username availability checking
  - Better error handling with specific response codes
- July 02, 2025. Enhanced censored username detection:
  - Added detailed status information for all username checks
  - Now detects and displays censored/inappropriate usernames
  - Shows specific validation messages from Roblox API
  - Enhanced UI with color-coded status badges (Available/Taken/Censored/Invalid)
  - Improved toast notifications with detailed status descriptions
  - Supports detection of various validation errors (too short, too long, invalid characters)
- July 02, 2025. Final improvements for deployment:
  - Removed premium features section for cleaner design
  - Implemented working clear history functionality with DELETE /api/username/recent endpoint
  - Added real-time statistics updates (3-second intervals)
  - Fixed clear history button with proper API integration and toast notifications
  - Enhanced user experience with real-time data refresh for both stats and recent checks
  - Application ready for Vercel deployment
- July 02, 2025. Database migration completed:
  - Successfully migrated from in-memory storage to PostgreSQL database
  - Created database connection using Neon serverless PostgreSQL
  - Updated storage interface to use Drizzle ORM with database operations
  - All username checks now persist in database for reliable data storage
  - Pushed database schema using drizzle-kit
  - Application now uses DatabaseStorage instead of MemStorage
- July 02, 2025. Migration from Replit Agent to standard Replit environment:
  - Successfully migrated project to run on standard Replit infrastructure
  - Created PostgreSQL database and configured environment variables
  - Pushed database schema using Drizzle migrations
  - Simplified UI design to look more natural and less AI-generated
  - Updated username checker component with cleaner, professional design
  - Fixed all syntax errors and confirmed application runs properly
  - All migration checklist items completed successfully
- July 02, 2025. Professional UI redesign and branding update:
  - Rebranded application as "RobloxCheck" for professional appearance
  - Redesigned button styles to look more natural and less AI-generated
  - Updated all card components with clean, professional styling
  - Removed excessive gradients and animations for cleaner appearance
  - Simplified component layouts similar to NameVault design patterns
  - Reduced API polling frequency from 3 seconds to 30 seconds
  - Added proper page title and meta description for SEO
  - All components now use consistent, professional design language
- July 02, 2025. Vercel deployment configuration:
  - Fixed Vercel deployment configuration for full-stack application
  - Created proper API entry point with Vercel-compatible handler
  - Updated routing configuration to handle both API and static files
  - Added @vercel/node dependency for proper TypeScript support
  - Configured build process and output directory for Vercel deployment

## User Preferences

Preferred communication style: Simple, everyday language.