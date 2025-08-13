# Overview

HVAC Intel is a comprehensive industry intelligence dashboard focused on HVAC and BESS (Battery Energy Storage Systems) sectors. The application provides real-time news aggregation, AI-powered article analysis, document processing capabilities, and advanced analytics for industry professionals. It combines news feed management, sentiment analysis, document analysis, and business intelligence features to help users stay informed about market trends and make data-driven decisions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**React Single Page Application**: Built with React 18, TypeScript, and Vite for development tooling. Uses Wouter for client-side routing instead of React Router, providing a lightweight routing solution.

**Component Architecture**: Implements a modular component structure with shadcn/ui design system for consistent UI components. Components are organized into feature-based directories (analytics, layout, news) with reusable UI components.

**State Management**: Uses TanStack Query (React Query) for server state management, caching, and synchronization. No global client state management library is used, relying on React's built-in state and context.

**Styling**: Tailwind CSS with CSS custom properties for theming. Supports both light and dark modes with a comprehensive design token system.

## Backend Architecture

**Express.js REST API**: Node.js server using Express with TypeScript. Implements middleware for request logging, JSON parsing, and error handling.

**Development Setup**: Vite integration for development with HMR (Hot Module Replacement) and middleware mode for seamless full-stack development experience.

**API Structure**: RESTful endpoints organized by feature domains (articles, documents, analytics) with proper HTTP status codes and error handling.

## Data Storage Solutions

**PostgreSQL with Drizzle ORM**: Uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. Database configuration points to Neon Database for serverless PostgreSQL hosting.

**Schema Design**: 
- Users table for authentication
- Articles table with AI analysis, sentiment scoring, and categorization
- Documents table for file uploads with AI-powered analysis
- JSON fields for storing complex AI analysis results

**In-Memory Fallback**: Implements an in-memory storage class as a fallback/development option, maintaining the same interface as the database storage.

## Authentication and Authorization

**Session-Based Authentication**: Uses Express sessions with PostgreSQL session store (connect-pg-simple) for persistent session management.

**Role-Based Access**: Simple role system with default "analyst" role, extensible for different permission levels.

## External Service Integrations

**OpenAI Integration**: Leverages GPT-4o model for:
- Sentiment analysis of articles with confidence scoring
- Article categorization and industry classification  
- Document analysis and insight generation
- AI-powered recommendations and trend analysis

**File Upload Handling**: Uses Multer middleware for handling file uploads with size limits and memory storage.

**Development Tools**: Integrates with Replit-specific tooling for development environment support and error overlays.

## Key Design Patterns

**Repository Pattern**: Storage abstraction layer allows switching between different storage implementations (in-memory vs database).

**API Client Abstraction**: Centralized API client with React Query integration for consistent data fetching and caching strategies.

**Component Composition**: Heavy use of compound components and render props pattern for flexible, reusable UI components.

**Error Boundaries**: Comprehensive error handling at both client and server levels with user-friendly error messages.