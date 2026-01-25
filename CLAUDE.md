# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CoCoSumo is a real estate web service for Japanese property management with GIS integration, AI image generation, and VR room tours.

## Development Commands

```bash
# Start development server (Rails + Vite)
bin/dev

# Backend only
bin/rails server

# Frontend only
bin/vite dev

# Database setup
rails db:create db:migrate db:seed

# Run linter
rubocop

# Security check
brakeman

# Build frontend for production
npm run build
```

## Technology Stack

- **Backend**: Ruby on Rails 8.0, PostgreSQL with PostGIS
- **Frontend**: React 19 + Vite, Material-UI v7, Tailwind CSS v4
- **Maps**: Google Maps API (@react-google-maps/api)
- **VR**: Photo Sphere Viewer for 360° tours
- **AI**: Google Gemini for image generation, Vertex AI for object grounding

## Architecture

### Directory Structure

```
app/
├── controllers/api/v1/   # Versioned REST API endpoints
├── models/               # ActiveRecord models with PostGIS
├── services/             # Business logic (DirectionsService, StreetViewService, etc.)
├── jobs/                 # Background jobs (Solid Queue)
└── frontend/cocosumo/    # React SPA
    ├── pages/            # Page components
    ├── components/       # Shared UI components
    ├── contexts/         # React Context (AuthContext)
    ├── hooks/            # Custom hooks (useRoutes, useGoogleMaps, etc.)
    └── theme/            # MUI theme configuration
```

### Key Architectural Patterns

- **Multi-tenancy**: Data isolation via `tenant_id` foreign keys on most models
- **Soft deletion**: Using Discard gem (`.kept`, `.discarded` scopes)
- **GIS/Spatial**: PostGIS for geospatial queries (ST_Within, ST_DWithin, ST_Distance)
- **Authentication**: Session-based with role-based access (member, admin, super_admin)
- **API Structure**: `/api/v1/` namespace, JSON responses

### Core Domain Models

- **Tenant** → Users, Buildings, Stores, MapLayers
- **Building** → Rooms, BuildingPhotos, BuildingRoutes (with GeoJSON geometry)
- **Room** → RoomPhotos, VrTours, VirtualStagings, PropertyPublications
- **VrTour** → VrScenes (360° panoramic tours)

### Frontend Routing

- Protected routes wrapped with `ProtectedRoute` component
- Public routes: `/login`, `/vr/:publicId`, `/property/:publicationId`
- Authenticated routes: `/home`, `/map`, `/buildings`, `/rooms/:id`, `/vr-tours`

### External Services Integration

- Google Maps API (directions, geocoding, street view)
- Google Gemini AI (image generation)
- Google Vertex AI (object grounding)
- Cloudflare R2 (S3-compatible storage via Active Storage)

## Environment Variables

Required in `.env` (copy from `.env.example`):
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (exposed to frontend)
- Database and cloud storage credentials for production
