# Smart Citizen Request System

A comprehensive citizen-government communication platform for reporting and tracking local issues.

## Features

- 🆕 Citizen registration with OTP verification
- 📍 GPS location picker for issue reporting  
- 📸 Multi-image upload support
- 👑 Admin dashboard with analytics
- 🔔 Real-time notifications
- 📊 SLA monitoring and breach alerts
- 🗺️ Heatmap visualization of issues
- 📈 Advanced analytics and reporting

## Tech Stack

- **Frontend**: HTML5, TailwindCSS, JavaScript, Leaflet Maps
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT, bcrypt
- **Deployment**: Render (backend), Vercel (frontend)

## Live Demo

[Coming Soon]

## API Documentation

[Coming Soon]

## Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Environment Variables

Create a `.env` file:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=productioncd ~/Projects/Smart-Citizen-Service-Request-System

# Create GitHub repository structure
mkdir -p .github/workflows
mkdir -p backend/src/{models,controllers,routes,middleware,config,utils}
mkdir -p frontend/src/{components,pages,services,utils}

# Initialize git if not already
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production

# Uploads (will use cloud storage in production)
backend/uploads/
frontend/build/
frontend/.next/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Coverage
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
