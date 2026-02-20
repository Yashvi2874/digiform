# DigiForm - Where Ideas Take Shape.
<img width="2559" height="1308" alt="image" src="https://github.com/user-attachments/assets/2cc00ea3-5b98-419d-a41f-dea0312f56eb" />

An AI-driven platform for designing and simulating industrial components using natural language. Built with React, Node.js, and MongoDB.

![DigiForm](https://img.shields.io/badge/DigiForm-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)

---

**© 2024 DigiForm. All Rights Reserved.**

---

## ✨ Key Features

- 🤖 **Natural Language Design** - Describe components in plain English
- 🎨 **Real-time 3D Visualization** - Interactive Three.js viewer
- 🔬 **Engineering Simulation** - Structural & stress analysis with safety factors
- 📊 **Stress Distribution** - Face-wise mechanical stress visualization
- 📥 **Multi-Format Export** - STL, GLTF, OBJ file generation
- 🎯 **Material Library** - Steel, Aluminum, Titanium, Brass, Copper, Plastic, Composite
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔐 **User Authentication** - Secure login with data isolation

## 🏗️ Architecture

```
Vercel (Frontend) ◄──► Render (Backend) ◄──► MongoDB Atlas (Database)
React + Three.js        Node.js + Express      Cloud Storage
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/digiform.git
cd digiform

# Setup Backend
cd backend
npm install
cp .env.example .env  # Add your MongoDB URI
npm run dev

# Setup Frontend (new terminal)
cd frontend
npm install
cp .env.example .env  # Add backend URL
npm run dev
```

Open http://localhost:3000 in your browser.

## 🎯 Usage

1. **Design**: "Create a gear with 20 teeth, 50mm diameter, steel"
2. **Modify**: "Make it aluminum instead"
3. **Simulate**: Run STEP 1 (Mass Properties) → STEP 2 (Stress Analysis)
4. **Visualize**: Click "Show Distribution" to see stress on 3D model
5. **Export**: Download as STL, GLTF, or OBJ

## 🔧 Configuration

**Frontend (.env)**
```env
VITE_API_URL=https://your-backend-url.com
```

**Backend (.env)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digiform
PORT=5000
FRONTEND_URL=https://your-frontend-url.com
```

## �️ Tech Stack

**Frontend:** React 18, Vite, Three.js, Tailwind CSS, Zustand  
**Backend:** Node.js, Express, MongoDB, Mongoose  
**Infrastructure:** Vercel, Render, MongoDB Atlas

## 🗺️ Roadmap

**Completed:**
- ✅ Natural language CAD design
- ✅ Real-time 3D visualization
- ✅ Structural & stress analysis
- ✅ Stress distribution visualization
- ✅ Material library
- ✅ Multi-format export
- ✅ User authentication
- ✅ Chat history
- ✅ Version control
- ✅ Responsive UI

**Planned:**
- 🔄 Advanced FEA integration
- 🔄 Assembly modeling
- 🔄 Manufacturing cost estimation
- 🔄 Mobile app (native)
- 🔄 API for third-party integration

## 📞 Support

📧 Email: yashasvigupta28@gmail.com

---

**Made with ❤️ by the DigiForm Team** 🚀

---

## 📄 License & Copyright

**© 2024 DigiForm. All Rights Reserved.**

This software and associated documentation files (the "Software") are proprietary and confidential. Unauthorized copying, modification, distribution, or use of this Software, via any medium, is strictly prohibited without explicit written permission from DigiForm.

**Contact:** yashasvigupta28@gmail.com
