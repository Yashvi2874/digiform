# DigiForm - Where Ideas Take Shape
<img width="2559" height="1308" alt="image" src="https://github.com/user-attachments/assets/2cc00ea3-5b98-419d-a41f-dea0312f56eb" />

An AI-driven platform for designing and simulating industrial components using natural language. Built with React, Node.js, and MongoDB.

![DigiForm](https://img.shields.io/badge/DigiForm-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)

## ✨ Features

- 🤖 **Conversational AI Assistant** - Natural language design interface
- 🎨 **Real-time 3D Visualization** - Interactive Three.js viewer with stress distribution
- 🔬 **Engineering Simulation** - Structural & stress analysis with safety factors
- 📊 **Stress Distribution Visualization** - Face-wise mechanical stress analysis with color-coded overlay
- 📥 **Multi-Format Export** - STL, GLTF, OBJ file generation
- 💾 **Cloud Database** - MongoDB Atlas for persistent storage
- 🔄 **Version Control** - Track and manage all design iterations
- 🎯 **Material Library** - Steel, Aluminum, Titanium, Brass, Copper, Plastic, Composite
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🔐 **User Authentication** - Secure login and data isolation
- � **Chat History** - Save and restore previous design sessions
- 🎨 **Material Visualization** - Realistic material colors and properties in 3D

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
1. Complete STEP 1: Mass Properties calculation
2. Click "Structural & Stress Analysis" in STEP 2
3. Configure constraints (fixed face) and loads (force, direction, face)
4. Click "Run Analysis"
5. View results: max stress, displacement, safety factor
6. Optional: Click "Show Distribution" to see stress visualization on 3D model

### Export CAD
- Click format button (STL, GLTF, OBJ)
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

### Code Quality

The codebase includes test files for development purposes. For production deployment:

**Optional Cleanup (Backend):**
```bash
# Remove test files (optional - they don't affect production)
cd backend
rm test_*.js test_*.py
```

**Code Standards:**
- ✅ No console errors or warnings
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ User data isolation and security
- ✅ Persistent state management
- ✅ Error handling and validation
- ✅ Clean component architecture

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
- Stress distribution visualization
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
- GLTF for web/AR/VR
- OBJ for universal use

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

## 🙏 Acknowledgments

- Three.js community for 3D graphics
- React Three Fiber for React integration
- MongoDB for database solutions
- Vercel and Render for hosting

## 📞 Support

- 📧 Email: yashasvigupta28@gmail.com

## 🗺️ Roadmap

- [x] Natural language CAD design
- [x] Real-time 3D visualization
- [x] Structural & stress analysis
- [x] Face-wise stress distribution visualization
- [x] Material library with visual representation
- [x] Multi-format export (STL, GLTF, OBJ)
- [x] User authentication and data isolation
- [x] Chat history and session management
- [x] Version control for designs
- [x] Responsive UI (mobile, tablet, desktop)
- [x] Simulation data persistence per design
- [ ] Advanced FEA integration
- [ ] Assembly modeling
- [ ] Manufacturing cost estimation
- [ ] Mobile app (native)
- [ ] API for third-party integration
- [ ] Marketplace for designs
- [ ] AI-powered optimization suggestions
- [ ] Multi-user collaboration

---

**Made with ❤️ by the DigiForm Team**

**DigiForm - Where Ideas Take Shape** 🚀
