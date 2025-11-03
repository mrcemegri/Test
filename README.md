# HubSpot-Style CRM Platform

A comprehensive Customer Relationship Management (CRM) platform inspired by HubSpot, built with modern web technologies.

## Features

### Core CRM Functionality
- **Contact Management**: Create, view, edit, and manage customer contacts
- **Company Management**: Track company accounts and relationships
- **Deal Pipeline**: Visual Kanban-style deal management with customizable stages
- **Activity Tracking**: Log all customer interactions and communications
- **Team Collaboration**: Role-based access control for teams

### User Roles
- **Admin**: Full system access, user management
- **Manager**: Team oversight, pipeline management, reporting
- **Sales Rep**: Own contacts/deals, activity tracking
- **Viewer**: Read-only access to assigned data

### Key Features
- Real-time dashboard with key metrics
- Drag-and-drop Kanban boards
- Advanced search and filtering
- Activity timelines
- Sales pipeline visualization
- Team performance metrics

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database with Knex.js migrations
- **JWT** authentication with refresh tokens
- **Role-based access control**
- RESTful API design

### Frontend
- **React.js** with modern hooks
- **Redux Toolkit** for state management
- **React Query** for server state management
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for forms

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hubspot-crm
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp client/.env.example client/.env

   # Configure your database and other settings
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb crm_db

   # Run migrations
   npm run migrate

   # (Optional) Seed with sample data
   npm run seed
   ```

5. **Start the development servers**
   ```bash
   # Start both backend and frontend
   npm run dev:full

   # Or start individually
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 3000
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health check: http://localhost:5000/health

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### CRM Endpoints
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/deals` - List deals
- `POST /api/deals` - Create deal
- `GET /api/pipelines` - List pipelines
- `GET /api/activities` - List activities
- `GET /api/dashboard/metrics` - Dashboard metrics

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `companies` - Company accounts
- `contacts` - Individual contacts
- `deals` - Sales deals and opportunities
- `pipelines` - Custom sales pipelines
- `pipeline_stages` - Pipeline stages
- `activities` - Activity logs and communications

See `server/migrations/` for complete schema definitions.

## Project Structure

```
├── server/                 # Backend application
│   ├── config/            # Database configuration
│   ├── middleware/        # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── migrations/       # Database migrations
│   └── seeds/           # Database seeds
├── client/              # Frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── store/       # Redux store
│   │   └── utils/       # Utility functions
│   └── public/         # Static assets
└── docs/               # Documentation
```

## Development

### Running Tests
```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test
```

### Database Migrations
```bash
# Create new migration
npx knex migrate:make migration_name --knexfile server/knexfile.js

# Run migrations
npm run migrate

# Rollback last migration
npx knex migrate:rollback --knexfile server/knexfile.js
```

### Environment Variables

#### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend (client/.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=HubSpot CRM
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Support

For support and questions, please open an issue in the GitHub repository.