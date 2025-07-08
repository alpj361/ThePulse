# PulseJ - Platform for Journalism and Trend Analysis

![PulseJ Logo](https://via.placeholder.com/600x200?text=PulseJ+Platform)

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [User Guide](#user-guide)
5. [Technical Documentation](#technical-documentation)
6. [API Documentation](#api-documentation)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [Support](#support)

---

## 🎯 Project Overview

**PulseJ** is a comprehensive **journalism and trend analysis platform** designed specifically for journalists, analysts, and content creators working in Guatemala. The platform combines real-time data analysis, content management, and AI-powered insights to help users understand trending topics, manage projects, and create informed content.

### Key Objectives
- **Real-time trend monitoring** from social media and news sources
- **AI-powered content analysis** and insights generation
- **Project management** for journalistic investigations
- **Document library** with intelligent organization
- **Collaborative tools** for team-based journalism

---

## ✨ Features

### 🔍 **Trend Analysis System**
- **Real-time monitoring** of social media trends and hashtags
- **AI-powered sentiment analysis** with detailed insights
- **Interactive visualizations** (word clouds, charts, maps)
- **Geographic trend mapping** focused on Guatemala
- **Engagement metrics** and performance tracking

### 📊 **Intelligent Sondeos (Polling System)**
- **Multi-context analysis** combining trends, news, and codex data
- **AI-powered survey generation** with customizable questions
- **Visual data presentation** with modern chart components
- **Progress tracking** with step-by-step indicators
- **Historical survey management** with reusable configurations

### 🗂️ **Project Management System**
- **Layered decision tracking** with hierarchical organization
- **Project lifecycle management** (active, paused, completed, archived)
- **Asset association** linking documents to projects
- **Collaborative features** with team access controls
- **Decision chronology** with timeline visualization

### 📚 **Enhanced Codex (Digital Library)**
- **Google Drive integration** for seamless file management
- **Multi-format support** (documents, audio, video, links)
- **Intelligent tagging** and categorization system
- **Project association** for organized asset management
- **Group management** for related content organization

### 🤖 **AI-Powered Analysis**
- **Multiple AI integrations** (OpenAI, Gemini, Perplexity)
- **Content generation** and enhancement
- **Audio transcription** via ElevenLabs
- **Intelligent suggestions** for content improvement
- **Context-aware analysis** for better insights

### 📱 **Recent Activity Dashboard**
- **Activity feed** with recent scrapes and analyses
- **Usage statistics** and performance metrics
- **Quick access** to recent projects and documents
- **Engagement tracking** across all platform activities

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pulsej.git
   cd pulsej
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # API Endpoints
   VITE_VPS_API_URL=your_vps_api_url
   VITE_EXTRACTORW_API_URL=https://server.standatpd.com/api
   
   # Google Services
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_API_KEY=your_google_api_key
   
   # AI Services
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser

---

## 👥 User Guide

### 🔐 Authentication & Setup

#### **Registration Process**
1. Navigate to `/register` to create a new account
2. Provide email and password
3. Verify your email address
4. Complete your profile setup

#### **Login Process**
1. Go to `/login` with your credentials
2. The system will verify your account status
3. Complete authentication and access the dashboard

### 🏠 **Dashboard Navigation**

#### **Main Navigation Menu**
- **Home** (`/`) - Landing page and platform overview
- **Trends** (`/dashboard`) - Real-time trend analysis
- **Sondeos** (`/sondeos`) - Intelligent polling system
- **Projects** (`/projects`) - Project management
- **Recent Activity** (`/recent`) - Activity feed and metrics
- **Codex** (`/codex`) - Digital document library
- **News** (`/news`) - News aggregation and analysis
- **Analytics** (`/analytics`) - Advanced analytics
- **Sources** (`/sources`) - Data source management

### 📈 **Using the Trends Dashboard**

#### **Trend Monitoring**
1. **Access the dashboard** at `/dashboard`
2. **View real-time trends** in the main visualization area
3. **Filter by categories** (Politics, Economy, Technology, etc.)
4. **Analyze sentiment** using the built-in sentiment analysis
5. **Export data** for further analysis

#### **Trend Analysis Features**
- **Word Cloud Visualization** - See the most mentioned terms
- **Category Distribution** - Understand trend categorization
- **Geographic Distribution** - Map-based trend analysis
- **Temporal Analysis** - Trend evolution over time
- **Engagement Metrics** - Likes, shares, comments analysis

### 📋 **Creating and Managing Sondeos**

#### **Setting Up a Sondeo**
1. Navigate to `/sondeos`
2. Click "New Sondeo" to start the configuration
3. **Configure contexts**:
   - **Trends Context** - Select from recent trends
   - **News Context** - Include relevant news articles
   - **Codex Context** - Add documents from your library
4. **Set parameters**:
   - Survey duration
   - Target audience
   - Question types
   - Analysis depth

#### **Sondeo Execution**
1. **Monitor progress** through the step-by-step indicator
2. **Review AI-generated insights** as they become available
3. **Interact with visualizations** to explore data
4. **Export results** in various formats
5. **Save configurations** for future use

### 🗂️ **Project Management**

#### **Creating Projects**
1. Go to `/projects`
2. Click "New Project" to open the creation modal
3. **Fill in project details**:
   - Project name and description
   - Category and tags
   - Timeline and objectives
4. **Set up team access** (if applicable)
5. **Initialize project structure**

#### **Managing Project Decisions**
1. **Create decision layers** for complex decision trees
2. **Track decision chronology** with timeline visualization
3. **Associate assets** from your Codex library
4. **Monitor project progress** through dashboard metrics
5. **Archive or pause projects** as needed

#### **Decision Tracking Features**
- **Layered Decision Creator** - Hierarchical decision management
- **Decision Timeline** - Visual chronology of decisions
- **Asset Association** - Link documents to decisions
- **Progress Tracking** - Monitor decision implementation
- **Team Collaboration** - Share decisions with team members

### 📚 **Using the Enhanced Codex**

#### **Document Management**
1. Access your library at `/codex`
2. **Upload documents** via Google Drive integration
3. **Organize content** using:
   - Tags and categories
   - Project associations
   - Group management
   - Custom metadata

#### **Content Organization**
- **Smart Tagging** - AI-powered tag suggestions
- **Project Linking** - Associate documents with projects
- **Group Management** - Create related content groups
- **Search & Filter** - Advanced search capabilities
- **Version Control** - Track document changes

### 📊 **Analytics and Reporting**

#### **Accessing Analytics**
1. Navigate to `/analytics`
2. **View comprehensive metrics**:
   - Usage statistics
   - Engagement trends
   - Performance indicators
   - Content analysis
3. **Generate reports** in various formats
4. **Export data** for external analysis

#### **Available Metrics**
- **Trend Analysis Performance** - Success rates and accuracy
- **Content Engagement** - User interaction metrics
- **Project Progress** - Completion rates and timelines
- **Resource Usage** - Platform utilization statistics
- **Team Collaboration** - Collaboration effectiveness metrics

### 🔧 **Settings and Configuration**

#### **Profile Management**
1. Access settings through the user menu
2. **Update profile information**:
   - Personal details
   - Contact information
   - Preferences
3. **Configure notifications**
4. **Manage integrations**:
   - Google Drive
   - AI services
   - External APIs

#### **Team Management**
- **Invite team members** to projects
- **Set permissions** and access levels
- **Monitor team activity**
- **Manage collaborative projects**

---

## 🛠️ Technical Documentation

### **Architecture Overview**

#### **Frontend Stack**
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Material-UI (MUI)** for consistent design system
- **Radix UI** for accessible component primitives
- **TailwindCSS** for utility-first styling
- **Framer Motion** for animations and transitions
- **React Router** for client-side routing
- **Recharts** for data visualization

#### **State Management**
- **React Context** for global state (auth, language)
- **Custom hooks** for business logic encapsulation
- **Jotai** for atomic state management
- **React Hook Form** for form handling
- **Local Storage** for user preferences

#### **Backend Integration**
- **Supabase** for authentication, database, and storage
- **Google APIs** for Drive integration and OAuth
- **RESTful APIs** for external service integration
- **Real-time subscriptions** for live updates

### **Service Documentation**

#### **Core Services**

##### **`api.ts` - Main API Service**
```typescript
// Trend analysis and data fetching
export async function fetchTrends(): Promise<TrendResponse>
export async function getTrendStatistics(): Promise<Statistics>
export async function getAboutInfo(): Promise<AboutInfo[]>
```

##### **`recentScrapes.ts` - Activity Tracking**
```typescript
// Recent scrapes management
export async function getRecentScrapes(userId: string, options?: GetRecentScrapesOptions): Promise<RecentScrape[]>
export async function getRecentScrapeById(scrapeId: string): Promise<RecentScrape | null>
export async function getRecentScrapesByCategory(userId: string): Promise<Record<string, RecentScrape[]>>
export async function getRecentScrapeStats(userId: string): Promise<RecentScrapeStats>
export async function deleteRecentScrape(scrapeId: string, authToken?: string): Promise<void>
```

##### **`sondeos.ts` - Polling System**
```typescript
// Sondeo configuration and execution
export async function crearSondeo(configuracion: SondeoConfig): Promise<SondeoResult>
export async function ejecutarSondeo(sondeoId: string): Promise<SondeoExecution>
export async function obtenerResultadosSondeo(sondeoId: string): Promise<SondeoResults>
```

##### **`projects.ts` - Project Management**
```typescript
// Project CRUD operations
export async function createProject(project: ProjectData): Promise<Project>
export async function getProjectsByUser(userId: string): Promise<Project[]>
export async function updateProject(projectId: string, updates: Partial<ProjectData>): Promise<Project>
export async function deleteProject(projectId: string): Promise<void>
export async function archiveProject(projectId: string): Promise<void>
```

##### **`supabase.ts` - Database Operations**
```typescript
// Database and authentication
export async function insertTrendData(data: TrendData): Promise<void>
export async function getLatestTrendData(): Promise<TrendData | null>
export async function getCodexItemsByUser(userId: string): Promise<CodexItem[]>
export async function getLatestNews(): Promise<NewsItem[]>
```

#### **AI Integration Services**

##### **`openai.ts` - OpenAI Integration**
```typescript
// Content generation and analysis
export async function generateContent(prompt: string, context?: string): Promise<string>
export async function analyzeText(text: string): Promise<TextAnalysis>
export async function generateSuggestions(input: string): Promise<string[]>
```

##### **`geminiSuggestions.ts` - Gemini AI Integration**
```typescript
// AI-powered suggestions
export async function getProjectSuggestions(projectData: ProjectData): Promise<Suggestion[]>
export async function analyzeTrendContext(trendData: TrendData): Promise<ContextAnalysis>
```

##### **`elevenLabs.ts` - Audio Processing**
```typescript
// Audio transcription and processing
export async function transcribeAudio(audioFile: File): Promise<TranscriptionResult>
export async function processAudioContent(audioData: AudioData): Promise<ProcessedAudio>
```

### **Component Documentation**

#### **Layout Components**
- **`Layout.tsx`** - Main application layout with sidebar navigation
- **`Sidebar.tsx`** - Navigation sidebar with menu items
- **`Header.tsx`** - Top navigation bar with user controls

#### **Visualization Components**
- **`WordCloud.tsx`** - Interactive word cloud visualization
- **`ModernBarChart.tsx`** - Bar chart with trend data
- **`ModernPieChart.tsx`** - Pie chart for category distribution
- **`ModernLineChart.tsx`** - Line chart for temporal analysis

#### **Data Display Components**
- **`RecentScrapesSection.tsx`** - Recent activity display
- **`TrendingTweetsSection.tsx`** - Twitter trends section
- **`NewsCard.tsx`** - News article display
- **`StatisticsCard.tsx`** - Metrics display cards

#### **Form Components**
- **`CreateProjectModal.tsx`** - Project creation form
- **`SondeoConfigModal.tsx`** - Sondeo configuration form
- **`CreateDecisionModal.tsx`** - Decision creation form

#### **Interactive Components**
- **`TrendSelector.tsx`** - Trend filtering controls
- **`MultiContextSelector.tsx`** - Context selection interface
- **`SondeoProgressIndicator.tsx`** - Progress tracking display

### **Database Schema**

#### **Core Tables**
- **`profiles`** - User profile information
- **`projects`** - Project management data
- **`recent_scrapes`** - Activity tracking
- **`sondeos`** - Polling configurations
- **`codex_items`** - Document library
- **`decisions`** - Decision tracking
- **`trend_data`** - Historical trend data

#### **Security Configuration**
- **Row Level Security (RLS)** enabled on all tables
- **User-based access control** for data isolation
- **JWT token authentication** with refresh tokens
- **Email verification** for account security

---

## 📡 API Documentation

### **Authentication Endpoints**

#### **User Registration**
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "profile": {
    "name": "User Name",
    "organization": "News Organization"
  }
}
```

#### **User Login**
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### **Trend Analysis Endpoints**

#### **Get Latest Trends**
```
GET /api/trends/latest
Authorization: Bearer <token>

Response:
{
  "wordCloudData": [...],
  "topKeywords": [...],
  "categoryData": [...],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### **Get Trend Statistics**
```
GET /api/trends/statistics
Authorization: Bearer <token>

Response:
{
  "relevancia": {...},
  "contexto": {...},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### **Project Management Endpoints**

#### **Create Project**
```
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Investigation Project",
  "description": "Project description",
  "category": "Politics",
  "timeline": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

#### **Get User Projects**
```
GET /api/projects/user
Authorization: Bearer <token>

Response:
{
  "projects": [
    {
      "id": "project-id",
      "name": "Project Name",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### **Sondeo Endpoints**

#### **Create Sondeo**
```
POST /api/sondeos
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Survey Name",
  "contexts": {
    "trends": ["trend1", "trend2"],
    "news": ["news1", "news2"],
    "codex": ["doc1", "doc2"]
  },
  "configuration": {
    "duration": 7,
    "targetAudience": "general"
  }
}
```

#### **Execute Sondeo**
```
POST /api/sondeos/{id}/execute
Authorization: Bearer <token>

Response:
{
  "executionId": "exec-id",
  "status": "running",
  "estimatedCompletion": "2024-01-01T01:00:00Z"
}
```

---

## 🚀 Deployment

### **Environment Setup**

#### **Development Environment**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

#### **Production Environment**
```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

### **Deployment Platforms**

#### **Netlify Deployment**
1. **Connect repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `dist`
4. **Configure environment variables**:
   - All `VITE_*` variables
   - API keys and endpoints
   - Database credentials

#### **Environment Variables**
```bash
# Required Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VPS_API_URL=your_vps_api_url
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### **Database Setup**

#### **Supabase Configuration**
1. **Create new Supabase project**
2. **Run database migrations**:
   ```sql
   -- Enable RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE recent_scrapes ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can view own profile" ON profiles
   FOR SELECT USING (auth.uid() = id);
   ```

3. **Set up authentication**:
   - Enable email authentication
   - Configure OAuth providers (Google)
   - Set up email templates

#### **Google Services Setup**
1. **Create Google Cloud Project**
2. **Enable APIs**:
   - Google Drive API
   - Google Maps API
   - Google OAuth 2.0
3. **Create credentials**:
   - OAuth 2.0 client ID
   - API key for Maps
   - Service account for Drive

---

## 🤝 Contributing

### **Development Guidelines**

#### **Code Style**
- **TypeScript** for all new code
- **ESLint** configuration for consistency
- **Prettier** for code formatting
- **Component naming** in PascalCase
- **File naming** in camelCase

#### **Git Workflow**
1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Make changes** with clear commit messages
4. **Run tests** and linting: `npm run lint`
5. **Submit pull request** with detailed description

#### **Testing Requirements**
- **Unit tests** for utility functions
- **Integration tests** for API endpoints
- **Component tests** for React components
- **E2E tests** for critical user flows

### **Pull Request Process**
1. **Update documentation** if necessary
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update changelog** with changes
5. **Request review** from maintainers

---

## 📞 Support

### **Getting Help**

#### **Documentation**
- **User Guide** - Complete user documentation
- **API Reference** - Technical API documentation
- **Component Library** - UI component reference
- **Troubleshooting** - Common issues and solutions

#### **Community Support**
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Community questions and answers
- **Wiki** - Additional documentation and guides

#### **Technical Support**
- **Email**: support@pulsej.com
- **Response Time**: 24-48 hours
- **Priority Support**: Available for enterprise users

### **Frequently Asked Questions**

#### **Q: How do I get API access?**
A: API access is automatically granted upon account creation. Ensure your environment variables are properly configured.

#### **Q: Can I export my data?**
A: Yes, all data can be exported in various formats (JSON, CSV, PDF) through the analytics dashboard.

#### **Q: Is there a mobile app?**
A: Currently, PulseJ is a web-based platform optimized for desktop and mobile browsers. A native mobile app is planned for future releases.

#### **Q: How do I invite team members?**
A: Team invitations can be sent through the project management interface. Invited users will receive an email with access instructions.

#### **Q: What file formats are supported in Codex?**
A: The Codex supports documents (PDF, DOC, DOCX), images (JPG, PNG, GIF), audio (MP3, WAV), video (MP4, AVI), and web links.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔄 Changelog

### **Version 1.0.0** (Current)
- Initial release with core functionality
- Trend analysis and visualization
- Project management system
- Enhanced Codex library
- AI-powered Sondeos
- Real-time activity tracking

### **Upcoming Features**
- Mobile application
- Advanced collaboration tools
- Machine learning insights
- Extended API integrations
- Enhanced visualization options

---

## 📊 Performance Metrics

### **Platform Statistics**
- **Load Time**: < 2 seconds average
- **Uptime**: 99.9% availability
- **Data Processing**: Real-time analysis
- **User Capacity**: Scalable architecture
- **API Response**: < 500ms average

### **Browser Support**
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS 14+, Android 10+

---

*This documentation is maintained by the PulseJ development team. For the most current information, please refer to the official repository.*

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: PulseJ Development Team