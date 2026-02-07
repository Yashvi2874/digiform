# Industrial Design AI Platform (DigiForm)

An AI-driven platform for designing and simulating industrial components using natural language. Describe what you need, and the system generates 3D models, runs engineering simulations, and maintains version control.

## Features

- **Natural Language Input**: Describe components in plain English (no OpenAI API required!)
- **Rule-Based NLP Parser**: Intelligent extraction of dimensions, materials, and specifications
- **Real-time 3D Visualization**: Interactive Three.js viewer with orbit controls
- **Engineering Simulation**: Stress analysis, safety factors, and material properties
- **Version Control**: Track all design iterations with timestamps
- **Iterative Refinement**: Modify designs through follow-up prompts
- **CAD Export**: Optional STL/STEP file generation using Python + OpenCascade
- **Digital Twin**: Living model with performance metrics

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **3D Graphics**: Three.js + React Three Fiber
- **Backend**: Node.js + Express
- **NLP**: Custom rule-based parser (no API costs!)
- **CAD Engine**: Python + OpenCascade (optional)
- **State Management**: Zustand

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+ (optional, for CAD export)

### Installation

**Windows:**
```bash
setup.bat
```

**Manual Setup:**
```bash
npm install
mkdir output
```

### Running the Application

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

1. **Describe Your Component**: Enter a natural language description like:
   - "Design a gear with 20 teeth, 50mm diameter, for high-torque applications"
   - "Create a steel shaft 200mm long, 25mm diameter"
   - "Design a mounting bracket 100x100mm, 10mm thick, aluminum"
   - "Make a bearing with 60mm outer diameter, titanium"

2. **View 3D Model**: The system generates a 3D visualization automatically

3. **Run Simulation**: Click "Run Simulation" to analyze:
   - Structural integrity
   - Stress levels
   - Safety factors
   - Material properties
   - Potential warnings

4. **Iterate**: Refine your design with follow-up descriptions

5. **Version Control**: Access previous versions from the history panel

## How It Works

### NLP Parser
The system uses a sophisticated rule-based parser that:
- Detects component types (gear, shaft, bearing, bracket, bolt, plate)
- Extracts dimensions from various formats (50mm, 2.5cm, 2", 100x50x10mm)
- Identifies materials (steel, aluminum, titanium, brass, copper)
- Determines complexity levels
- Recognizes applications (high-torque, precision, automotive, aerospace)

### Simulation Engine
Performs real engineering calculations:
- Stress analysis based on material properties
- Safety factor calculations
- Deformation estimates
- Mass and volume calculations
- Warning generation for design issues

### CAD Generation (Optional)
If Python is installed:
- Generates STL files for 3D printing
- Creates STEP files for CAD software
- Calculates precise physical properties

## Example Descriptions

```
"Design a gear with 20 teeth, 50mm diameter, for high-torque applications"
→ Generates: Gear with extracted parameters, steel material, medium complexity

"Create an aluminum shaft 200mm long, 25mm diameter"
→ Generates: Cylindrical shaft with specified dimensions, aluminum material

"Design a mounting bracket 100x100mm, 10mm thick"
→ Generates: Rectangular bracket with extracted dimensions

"Make a precision bearing with 60mm outer diameter, titanium"
→ Generates: Torus-shaped bearing, titanium material, high complexity
```

## Architecture

```
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── services/          # API integration
│   └── store/             # State management
├── server/                # Node.js backend
│   ├── index.js          # Express server
│   ├── aiService.js      # Simulation engine
│   └── nlpParser.js      # NLP parser
├── python_backend/        # Optional CAD engine
│   ├── simple_cad.py     # STL generator
│   └── cad_generator.py  # OpenCascade integration
└── output/               # Generated CAD files
```

## No API Costs!

This platform uses a custom rule-based NLP parser instead of expensive AI APIs. It intelligently extracts:
- Component types
- Dimensions (mm, cm, inches)
- Materials
- Complexity levels
- Applications

All processing happens locally - no API keys or quotas needed!

## Future Enhancements

- ✅ Rule-based NLP (no API costs)
- ✅ Basic CAD generation
- 🔄 Advanced FEA integration
- 🔄 More component types (springs, fasteners, housings)
- 🔄 Assembly modeling
- 🔄 Thermal analysis
- 🔄 Fatigue life prediction
- 🔄 Manufacturing cost estimation
- 🔄 Collaboration features
- 🔄 Cloud rendering

## Troubleshooting

**"Python script failed"**: Python CAD export is optional. The app works without it.

**Port already in use**: Change PORT in .env file

**Module not found**: Run `npm install` again

## License

MIT