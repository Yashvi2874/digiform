# DigiForm - Where Ideas Take Shape

An AI-driven platform for designing and simulating industrial components using natural language. Built with React, Node.js, and MongoDB.

![DigiForm](https://img.shields.io/badge/DigiForm-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)

## ✨ Features

- 🤖 **Conversational AI Assistant** - Natural language design interface
- 🎨 **Real-time 3D Visualization** - Interactive Three.js viewer with stress heatmaps
- 🔬 **Engineering Simulation** - Stress analysis, safety factors, load-based calculations
- 📥 **Multi-Format Export** - STL, GLB, OBJ, STEP file generation
- 💾 **Cloud Database** - MongoDB Atlas for persistent storage
- 🔄 **Version Control** - Track all design iterations
- ✅ **Approval Workflow** - Review and approve designs before proceeding
- 📊 **Performance Analysis** - Real-time structural integrity assessment

## 🏗️ Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Vercel         │◄────►│  Render         │◄────►│  MongoDB Atlas  │
│  (Frontend)     │      │  (Backend)      │      │  (Database)     │
│                 │      │                 │      │                 │
│  React + Vite   │      │  Node.js        │      │  Cloud DB       │
│  Three.js       │      │  Express        │      │  Mongoose       │
│  Tailwind CSS   │      │  AI Services    │      │  Collections    │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Vercel account (optional, for deployment)
- Render account (optional, for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/digiform.git
   cd digiform
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI
   npm run dev
   ```

3. **Setup Frontend** (in new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with backend URL
   npm run dev
   ```

4. **Open Browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 📦 Project Structure

```
digiform/
├── frontend/          # React + Vite application
│   ├── components/    # UI components
│   ├── services/      # API integration
│   ├── store/         # State management
│   └── ...
├── backend/           # Node.js + Express API
│   ├── models/        # MongoDB schemas
│   ├── aiService.js   # Simulation engine
│   ├── chatService.js # Conversational AI
│   └── ...
└── docs/              # Documentation
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed structure.

## 🌐 Deployment

### Option 1: Vercel + Render + MongoDB Atlas (Recommended)

**Perfect for production with:**
- ✅ Automatic deployments
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Free tier available

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step guide.

### Quick Deploy Commands

**Frontend (Vercel)**
```bash
cd frontend
vercel --prod
```

**Backend (Render)**
- Connect GitHub repository
- Set root directory to `backend`
- Add environment variables
- Deploy

## 🎯 Usage Examples

### Design a Component
```
You: "Design a gear with 20 teeth, 50mm diameter, steel"

AI: "I've analyzed your requirements and created a design proposal:
     Component Type: gear
     Material: Steel
     ..."
     
[Approve] [Modify]
```

### Modify Design
```
You: "Make it aluminum instead"

AI: "I've updated the design with the following changes:
     • Changed material to Aluminum
     ..."
```

### Run Simulation
1. Approve your design
2. Click "Run Simulation"
3. Enter load conditions (force & area)
4. View stress heatmap and analysis

### Export CAD
- Click format button (STL, GLB, OBJ, STEP)
- File downloads automatically
- Use in 3D printing, CAD software, or web apps

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```env
VITE_API_URL=https://your-backend-url.com
```

**Backend (.env)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digiform
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Step-by-step deployment instructions
- [Project Structure](PROJECT_STRUCTURE.md) - Detailed code organization
- [API Documentation](docs/API.md) - API endpoints and usage
- [Chat System](CHAT_SYSTEM.md) - Conversational AI details
- [Simulation Features](SIMULATION_FEATURES.md) - Engineering analysis
- [Export Features](EXPORT_FEATURES.md) - CAD export capabilities

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Three.js** - 3D graphics
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Three.js** - CAD export

### Infrastructure
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Database hosting

## 🎨 Features in Detail

### Conversational AI
- Natural language understanding
- Context-aware responses
- Design proposal generation
- Modification handling
- Question answering

### 3D Visualization
- Real-time rendering
- Orbit controls
- Stress heatmaps
- Material-accurate colors
- Auto-rotation control

### Engineering Simulation
- Load-based stress analysis
- Safety factor calculation
- Deformation estimation
- Material property database
- Warning generation

### CAD Export
- STL for 3D printing
- GLB for web/AR/VR
- OBJ for universal use
- STEP for CAD software

### Database Persistence
- Session management
- Message history
- Design versioning
- Analysis records
- Export tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Three.js community for 3D graphics
- React Three Fiber for React integration
- MongoDB for database solutions
- Vercel and Render for hosting

## 📞 Support

- 📧 Email: support@digiform.app
- 💬 Discord: [Join our community](https://discord.gg/digiform)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/digiform/issues)

## 🗺️ Roadmap

- [ ] Multi-user collaboration
- [ ] Advanced FEA integration
- [ ] Assembly modeling
- [ ] Manufacturing cost estimation
- [ ] Mobile app
- [ ] API for third-party integration
- [ ] Marketplace for designs
- [ ] AI-powered optimization suggestions

---

**Made with ❤️ by the DigiForm Team**

**DigiForm - Where Ideas Take Shape** 🚀