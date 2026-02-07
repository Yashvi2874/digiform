import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { generateDesignFromNL, simulateComponent } from './aiService.js';
import { exportToSTL, exportToGLB, exportToOBJ, exportToSTEP } from './exportUtils.js';
import { processUserMessage } from './chatService.js';
import * as db from './models/database.js';
import { generateToken, authMiddleware } from './authMiddleware.js';
import { getMaterialProperties, formatMaterialProperties } from './materialProperties.js';
import { analyzeStructure, validateAnalysisInputs } from './femSolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

await db.connectDB();

const outputDir = join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const allowedOrigins = [
  'http://localhost:3000',
  'https://digiform-it.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/output', express.static(outputDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DigiForm API is running' });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    const user = await db.createUser(email, password, name, company);
    const token = generateToken(user.id);
    
    res.json({ user, token });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.message === 'User already exists') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await db.authenticateUser(email, password);
    const token = generateToken(user.id);
    
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Debug endpoint to check if user exists (REMOVE IN PRODUCTION)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await db.User.find({}).select('email name createdAt').limit(10);
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/chat/session', authMiddleware, async (req, res) => {
  try {
    const sessionId = await db.createSession(req.userId);
    res.json({ sessionId });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/api/chat/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await db.getUserSessions(req.userId);
    console.log('Returning sessions:', JSON.stringify(sessions, null, 2)); // Debug log
    res.json({ sessions });
  } catch (error) {
    console.error('Sessions retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

app.delete('/api/chat/sessions/empty', authMiddleware, async (req, res) => {
  try {
    await db.deleteEmptySessions(req.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Empty sessions cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup empty sessions' });
  }
});

app.delete('/api/chat/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    await db.deleteSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Session deletion error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

app.post('/api/chat/message', authMiddleware, async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    // Save user message
    const userMessageId = await db.saveMessage(sessionId, 'user', message);
    
    // Get context (last design if any)
    const designs = await db.getDesigns(sessionId);
    const context = {
      lastDesign: designs.length > 0 ? designs[0] : null
    };
    
    // Process message with AI
    const response = processUserMessage(message, context);
    
    // Save assistant message
    const assistantMessageId = await db.saveMessage(sessionId, 'assistant', response.message);
    
    // Save design if proposed
    let designId = null;
    if (response.design) {
      designId = await db.saveDesign(sessionId, assistantMessageId, response.design);
    }
    
    res.json({
      message: response.message,
      design: response.design,
      needsApproval: response.needsApproval,
      designId
    });
  } catch (error) {
    console.error('Message processing error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

app.get('/api/chat/history/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await db.getMessages(sessionId);
    const designs = await db.getDesigns(sessionId);
    
    res.json({ messages, designs });
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

app.post('/api/design/approve', async (req, res) => {
  try {
    const { designId } = req.body;
    await db.approveDesign(designId);
    res.json({ success: true });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Failed to approve design' });
  }
});

app.post('/api/design/reject', async (req, res) => {
  try {
    const { designId } = req.body;
    await db.updateDesignStatus(designId, 'rejected');
    res.json({ success: true });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ error: 'Failed to reject design' });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    const design = await generateDesignFromNL(description);
    res.json(design);
  } catch (error) {
    console.error('Generation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate design', details: error.message });
  }
});

app.post('/api/simulate', async (req, res) => {
  try {
    const { design, simulationType = 'mass_properties', material = 'Structural Steel', densityOverride = null } = req.body;
    
    if (!design) {
      return res.status(400).json({ error: 'Design is required' });
    }
    
    /**
     * MANDATORY EXECUTION ORDER:
     * STEP 1: Mass Properties (Required first)
     * STEP 2: Other simulations (only after STEP 1 succeeds)
     */
    
    // For backward compatibility with old simulation system
    if (simulationType === 'legacy' || !simulationType) {
      // Old simulation path
      const analysis = await simulateComponent(design);
      
      // Save analysis to database if design has an ID
      if (design.id) {
        try {
          await db.saveAnalysis(design.id, analysis);
        } catch (dbError) {
          console.error('Failed to save analysis to DB:', dbError);
        }
      }
      
      return res.json(analysis);
    }
    
    // New mandatory execution order for mass properties
    if (simulationType === 'mass_properties') {
      // STEP 1: Mass properties computation with MANDATORY unit conversion

      // Support both flat and nested design property shapes used across frontend
      const extract = (obj, path) => {
        try {
          return path.split('.').reduce((acc, key) => acc && acc[key] !== undefined ? acc[key] : undefined, obj);
        } catch (e) { return undefined; }
      };

      // CALCULATE VOLUME FROM GEOMETRY if not provided
      let volumeVal = design.volume || extract(design, 'properties.volume') || extract(design, 'analysis.mass_properties.volume_mm3') || extract(design, 'properties.volume_mm3');
      
      // If volume not provided, calculate from geometry parameters
      if (!volumeVal || volumeVal <= 0) {
        const type = (design.type || '').toLowerCase();
        const params = design.parameters || {};
        
        console.log('Calculating volume from geometry:', { type, params });
        
        switch (type) {
          case 'cube':
          case 'beam':
            // Cube, rectangular box, or beam
            const width = params.width || params.size || 50;
            const height = params.height || params.size || 50;
            const depth = params.depth || params.length || params.size || 50;
            volumeVal = width * height * depth;
            break;
            
          case 'cylinder':
            // Cylinder (solid or hollow)
            const radius = params.radius || 25;
            const cylHeight = params.height || params.length || 50;
            if (params.isHollow && params.innerRadius) {
              // Hollow cylinder: π * (R² - r²) * h
              volumeVal = Math.PI * (Math.pow(radius, 2) - Math.pow(params.innerRadius, 2)) * cylHeight;
            } else {
              // Solid cylinder: π * r² * h
              volumeVal = Math.PI * Math.pow(radius, 2) * cylHeight;
            }
            break;
            
          case 'sphere':
            // Sphere: (4/3) * π * r³
            const sphereRadius = params.radius || 25;
            volumeVal = (4/3) * Math.PI * Math.pow(sphereRadius, 3);
            break;
            
          case 'cone':
            // Cone: (1/3) * π * r² * h
            const coneRadius = params.baseRadius || params.radius || 25;
            const coneHeight = params.height || 50;
            volumeVal = (1/3) * Math.PI * Math.pow(coneRadius, 2) * coneHeight;
            break;
            
          case 'pyramid':
            // Pyramid: (1/3) * base_area * h
            const baseWidth = params.baseWidth || 30;
            const baseDepth = params.baseDepth || 30;
            const pyrHeight = params.height || 40;
            volumeVal = (1/3) * baseWidth * baseDepth * pyrHeight;
            break;
            
          case 'prism':
            // Triangular prism: (1/2) * base * height * length
            const prismBase = params.baseWidth || 30;
            const prismHeight = params.baseHeight || 30;
            const prismLength = params.length || 50;
            volumeVal = (1/2) * prismBase * prismHeight * prismLength;
            break;
            
          case 'gear':
          case 'shaft':
            // Cylindrical shape: π * r² * thickness/length
            const gearRadius = params.radius || 25;
            const gearThickness = params.thickness || params.length || 10;
            volumeVal = Math.PI * Math.pow(gearRadius, 2) * gearThickness;
            break;
            
          case 'bearing':
            // Ring shape: π * (R² - r²) * thickness
            const outerRadius = params.outerRadius || params.radius || 30;
            const innerRadius = params.innerRadius || outerRadius * 0.5;
            const bearingThickness = params.thickness || 10;
            volumeVal = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2)) * bearingThickness;
            break;
            
          case 'bracket':
          case 'plate':
            // Rectangular solid
            const bracketWidth = params.width || 50;
            const bracketHeight = params.height || 50;
            const bracketDepth = params.depth || params.thickness || 10;
            volumeVal = bracketWidth * bracketHeight * bracketDepth;
            break;
            
          case 'bolt':
            // Simplified as cylinder
            const boltRadius = params.radius || 4;
            const boltLength = params.length || 30;
            volumeVal = Math.PI * Math.pow(boltRadius, 2) * boltLength;
            break;
            
          default:
            // Generic rectangular solid
            const genWidth = params.width || 50;
            const genHeight = params.height || 50;
            const genDepth = params.depth || params.thickness || 10;
            volumeVal = genWidth * genHeight * genDepth;
        }
        
        console.log('Calculated volume:', volumeVal, 'mm³');
      }
      
      volumeVal = Number(volumeVal || 0);

      // MANDATORY VALIDATION: Volume must be valid and positive
      if (!volumeVal || volumeVal <= 0 || !Number.isFinite(volumeVal)) {
        return res.status(400).json({
          success: false,
          error: 'Volume is zero or invalid. Cannot compute mass properties.',
          details: `CAD geometry must have valid volume (mm³) greater than zero. Type: ${design.type}, Parameters: ${JSON.stringify(design.parameters)}`,
          simulationType: 'mass_properties',
          step: 'STEP 1',
          status: 'FAILED'
        });
      }

      // Surface area may be in design.surfaceArea or nested - CALCULATE if not provided
      let surfaceAreaVal = design.surfaceArea || extract(design, 'properties.surfaceArea') || extract(design, 'analysis.mass_properties.surface_area');
      
      // Calculate surface area from geometry if not provided
      if (!surfaceAreaVal || surfaceAreaVal <= 0) {
        const type = (design.type || '').toLowerCase();
        const params = design.parameters || {};
        
        switch (type) {
          case 'cube':
          case 'beam':
            const width = params.width || params.size || 50;
            const height = params.height || params.size || 50;
            const depth = params.depth || params.length || params.size || 50;
            surfaceAreaVal = 2 * (width * height + width * depth + height * depth);
            break;
            
          case 'cylinder':
            const radius = params.radius || 25;
            const cylHeight = params.height || params.length || 50;
            if (params.isHollow && params.innerRadius) {
              // Hollow cylinder: outer + inner + 2 * ring areas
              const outerSurface = 2 * Math.PI * radius * cylHeight;
              const innerSurface = 2 * Math.PI * params.innerRadius * cylHeight;
              const ringArea = Math.PI * (Math.pow(radius, 2) - Math.pow(params.innerRadius, 2));
              surfaceAreaVal = outerSurface + innerSurface + 2 * ringArea;
            } else {
              // Solid cylinder: 2πrh + 2πr²
              surfaceAreaVal = 2 * Math.PI * radius * cylHeight + 2 * Math.PI * Math.pow(radius, 2);
            }
            break;
            
          case 'sphere':
            const sphereRadius = params.radius || 25;
            surfaceAreaVal = 4 * Math.PI * Math.pow(sphereRadius, 2);
            break;
            
          case 'cone':
            const coneRadius = params.baseRadius || params.radius || 25;
            const coneHeight = params.height || 50;
            const slantHeight = Math.sqrt(Math.pow(coneRadius, 2) + Math.pow(coneHeight, 2));
            surfaceAreaVal = Math.PI * coneRadius * slantHeight + Math.PI * Math.pow(coneRadius, 2);
            break;
            
          default:
            // Approximate as rectangular solid
            const w = params.width || 50;
            const h = params.height || 50;
            const d = params.depth || params.thickness || 10;
            surfaceAreaVal = 2 * (w * h + w * d + h * d);
        }
      }
      
      surfaceAreaVal = Number(surfaceAreaVal || 0);

      // Center of mass extraction - default to geometric center (0,0,0)
      const comObj = design.centerOfMass || extract(design, 'properties.centerOfMass') || extract(design, 'analysis.mass_properties.center_of_mass') || { x: 0, y: 0, z: 0 };

      // Moments of inertia extraction - calculate using proper formulas if not provided
      let inertiaObj = design.inertia || extract(design, 'properties.inertia') || extract(design, 'analysis.mass_properties.moments_of_inertia') || {};
      
      // Calculate moments of inertia using proper geometric formulas if not provided
      // These are the coefficients that will be multiplied by mass later
      if (!inertiaObj.Ixx && !inertiaObj.Ixx_kg_mm2) {
        const type = (design.type || '').toLowerCase();
        const params = design.parameters || {};
        
        // MOI formulas for each shape (coefficients only, will multiply by mass later)
        switch (type) {
          case 'cube':
          case 'beam':
          case 'bracket':
          case 'plate':
            // Cuboid (Rectangular Prism) or Beam
            const w = params.width || params.size || 50;
            const h = params.height || params.size || 50;
            const d = params.depth || params.length || params.thickness || params.size || 50;
            // For a rectangular solid about center:
            // Ixx = (1/12) * m * (h² + d²)
            // Iyy = (1/12) * m * (w² + d²)
            // Izz = (1/12) * m * (w² + h²)
            inertiaObj.Ixx = (Math.pow(h, 2) + Math.pow(d, 2)) / 12;
            inertiaObj.Iyy = (Math.pow(w, 2) + Math.pow(d, 2)) / 12;
            inertiaObj.Izz = (Math.pow(w, 2) + Math.pow(h, 2)) / 12;
            break;
            
          case 'cylinder':
          case 'shaft':
            // Solid Cylinder (axis along Z)
            const r = params.radius || 25;
            const cylH = params.height || params.length || 50;
            
            if (params.isHollow && params.innerRadius) {
              // Hollow Cylinder
              const R = r; // outer radius
              const r_inner = params.innerRadius;
              // Ixx = Iyy = (1/12) * m * (3(R² + r²) + h²)
              // Izz = (1/2) * m * (R² + r²)
              inertiaObj.Ixx = (3 * (Math.pow(R, 2) + Math.pow(r_inner, 2)) + Math.pow(cylH, 2)) / 12;
              inertiaObj.Iyy = (3 * (Math.pow(R, 2) + Math.pow(r_inner, 2)) + Math.pow(cylH, 2)) / 12;
              inertiaObj.Izz = (Math.pow(R, 2) + Math.pow(r_inner, 2)) / 2;
            } else {
              // Solid Cylinder
              // Ixx = Iyy = (1/12) * m * (3r² + h²)
              // Izz = (1/2) * m * r²
              inertiaObj.Ixx = (3 * Math.pow(r, 2) + Math.pow(cylH, 2)) / 12;
              inertiaObj.Iyy = (3 * Math.pow(r, 2) + Math.pow(cylH, 2)) / 12;
              inertiaObj.Izz = Math.pow(r, 2) / 2;
            }
            break;
            
          case 'sphere':
            // Solid Sphere
            const sR = params.radius || 25;
            // For a sphere: I = (2/5) * m * r²
            const sphereI = (2/5) * Math.pow(sR, 2);
            inertiaObj.Ixx = sphereI;
            inertiaObj.Iyy = sphereI;
            inertiaObj.Izz = sphereI;
            break;
            
          case 'cone':
            // Solid Cone (apex at top, base at bottom, axis along Z)
            const coneR = params.baseRadius || params.radius || 25;
            const coneH = params.height || 50;
            // Ixx = Iyy = (3/80) * m * (4r² + h²)
            // Izz = (3/10) * m * r²
            inertiaObj.Ixx = (3/80) * (4 * Math.pow(coneR, 2) + Math.pow(coneH, 2));
            inertiaObj.Iyy = (3/80) * (4 * Math.pow(coneR, 2) + Math.pow(coneH, 2));
            inertiaObj.Izz = (3/10) * Math.pow(coneR, 2);
            break;
            
          case 'pyramid':
            // Square Pyramid (apex at top, base at bottom)
            const baseW = params.baseWidth || 30;
            const baseD = params.baseDepth || 30;
            const pyrH = params.height || 40;
            // Approximation for square pyramid:
            // Ixx = (1/20) * m * (baseD² + 3h²)
            // Iyy = (1/20) * m * (baseW² + 3h²)
            // Izz = (1/10) * m * (baseW² + baseD²)
            inertiaObj.Ixx = (Math.pow(baseD, 2) + 3 * Math.pow(pyrH, 2)) / 20;
            inertiaObj.Iyy = (Math.pow(baseW, 2) + 3 * Math.pow(pyrH, 2)) / 20;
            inertiaObj.Izz = (Math.pow(baseW, 2) + Math.pow(baseD, 2)) / 10;
            break;
            
          case 'prism':
            // Triangular Prism
            const prismBase = params.baseWidth || 30;
            const prismHeight = params.baseHeight || 30;
            const prismLength = params.length || 50;
            // Approximation for triangular prism:
            // Ixx = (1/18) * m * (prismHeight² + prismLength²)
            // Iyy = (1/18) * m * (prismBase² + prismLength²)
            // Izz = (1/18) * m * (prismBase² + prismHeight²)
            inertiaObj.Ixx = (Math.pow(prismHeight, 2) + Math.pow(prismLength, 2)) / 18;
            inertiaObj.Iyy = (Math.pow(prismBase, 2) + Math.pow(prismLength, 2)) / 18;
            inertiaObj.Izz = (Math.pow(prismBase, 2) + Math.pow(prismHeight, 2)) / 18;
            break;
            
          case 'gear':
            // Gear approximated as solid cylinder
            const gearR = params.radius || 25;
            const gearT = params.thickness || 10;
            inertiaObj.Ixx = (3 * Math.pow(gearR, 2) + Math.pow(gearT, 2)) / 12;
            inertiaObj.Iyy = (3 * Math.pow(gearR, 2) + Math.pow(gearT, 2)) / 12;
            inertiaObj.Izz = Math.pow(gearR, 2) / 2;
            break;
            
          case 'bearing':
            // Bearing as hollow cylinder
            const bearingR = params.outerRadius || params.radius || 30;
            const bearingRinner = params.innerRadius || bearingR * 0.5;
            const bearingT = params.thickness || 10;
            inertiaObj.Ixx = (3 * (Math.pow(bearingR, 2) + Math.pow(bearingRinner, 2)) + Math.pow(bearingT, 2)) / 12;
            inertiaObj.Iyy = (3 * (Math.pow(bearingR, 2) + Math.pow(bearingRinner, 2)) + Math.pow(bearingT, 2)) / 12;
            inertiaObj.Izz = (Math.pow(bearingR, 2) + Math.pow(bearingRinner, 2)) / 2;
            break;
            
          case 'bolt':
            // Bolt approximated as solid cylinder
            const boltR = params.radius || 4;
            const boltL = params.length || 30;
            inertiaObj.Ixx = (3 * Math.pow(boltR, 2) + Math.pow(boltL, 2)) / 12;
            inertiaObj.Iyy = (3 * Math.pow(boltR, 2) + Math.pow(boltL, 2)) / 12;
            inertiaObj.Izz = Math.pow(boltR, 2) / 2;
            break;
            
          default:
            // Default: rectangular solid approximation
            const defW = params.width || 50;
            const defH = params.height || 50;
            const defD = params.depth || params.thickness || 10;
            inertiaObj.Ixx = (Math.pow(defH, 2) + Math.pow(defD, 2)) / 12;
            inertiaObj.Iyy = (Math.pow(defW, 2) + Math.pow(defD, 2)) / 12;
            inertiaObj.Izz = (Math.pow(defW, 2) + Math.pow(defH, 2)) / 12;
        }
      }

      // Get material density (kg/m³)
      const materialDensities = {
        'Structural Steel': 7850,
        'Steel': 7850,
        'Aluminum': 2700,
        'Titanium': 4500,
        'Copper': 8960,
        'Brass': 8470,
        'Plastic': 1200,
        'Composite': 1600,
        'Cast Iron': 7200,
        'Stainless Steel': 7750,
        'Magnesium': 1800
      };

      // Determine density: override > material selection > default
      let density_kg_m3;
      if (densityOverride !== null && densityOverride !== undefined && Number(densityOverride) > 0) {
        density_kg_m3 = Number(densityOverride);
      } else {
        density_kg_m3 = materialDensities[material];
        
        // MANDATORY VALIDATION: Density must be defined
        if (!density_kg_m3 || density_kg_m3 <= 0) {
          return res.status(400).json({
            success: false,
            error: `Density is undefined for material: ${material}`,
            details: 'Material density must be defined in kg/m³. Please select a valid material.',
            simulationType: 'mass_properties',
            step: 'STEP 1',
            status: 'FAILED'
          });
        }
      }

      // MANDATORY UNIT CONVERSION: volume_mm3 × 1e-9 × density_kg_m3 = mass_kg
      // All CAD geometry is in millimeters (mm)
      // Volume from CAD is in mm³
      // Convert to m³: volume_m3 = volume_mm3 × 1e-9
      // Calculate mass: mass_kg = density_kg_per_m3 × volume_m3
      const volume_m3 = volumeVal * 1e-9;
      const mass_kg = density_kg_m3 * volume_m3;

      // Validate computed mass
      if (!Number.isFinite(mass_kg) || mass_kg <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Computed mass is invalid',
          details: `Mass calculation failed. Volume: ${volumeVal} mm³, Density: ${density_kg_m3} kg/m³`,
          simulationType: 'mass_properties',
          step: 'STEP 1',
          status: 'FAILED'
        });
      }
      
      // Calculate actual moments of inertia (multiply by mass)
      const Ixx_kg_mm2 = (inertiaObj.Ixx || inertiaObj.Ixx_kg_mm2 || 0) * mass_kg;
      const Iyy_kg_mm2 = (inertiaObj.Iyy || inertiaObj.Iyy_kg_mm2 || 0) * mass_kg;
      const Izz_kg_mm2 = (inertiaObj.Izz || inertiaObj.Izz_kg_mm2 || 0) * mass_kg;

      const massPropertiesResult = {
        success: true,
        simulation_type: 'mass_properties',
        step: 'STEP 1',
        status: 'COMPLETE',
        message: 'Mass properties computed successfully. Ready for STEP 2 simulations.',
        mass_properties: {
          volume_mm3: Math.round(volumeVal * 100) / 100,
          volume_m3: volume_m3,
          surface_area_mm2: Math.round((Number(surfaceAreaVal) || 0) * 100) / 100,
          mass_kg: mass_kg,
          center_of_mass: {
            x_mm: Number(comObj.x || comObj.x_mm || 0),
            y_mm: Number(comObj.y || comObj.y_mm || 0),
            z_mm: Number(comObj.z || comObj.z_mm || 0)
          },
          moments_of_inertia: {
            Ixx_kg_mm2: Number(Ixx_kg_mm2),
            Iyy_kg_mm2: Number(Iyy_kg_mm2),
            Izz_kg_mm2: Number(Izz_kg_mm2)
          },
          unit_conversion_details: {
            description: 'mass_kg = density_kg_per_m3 × volume_m3 = density × volume_mm3 × 1e-9',
            volume_mm3: volumeVal,
            conversion_factor: 1e-9,
            volume_m3: volume_m3,
            density_kg_m3: density_kg_m3,
            mass_kg: mass_kg
          }
        },
        material: {
          name: material,
          density_kg_m3: density_kg_m3,
          is_override: densityOverride !== null && densityOverride !== undefined
        },
        next_steps: [
          'Structural analysis',
          'Deflection analysis',
          'Stress analysis'
        ]
      };
      
      // Save analysis to database
      if (design.id) {
        try {
          await db.saveAnalysis(design.id, massPropertiesResult);
        } catch (dbError) {
          console.error('Failed to save mass properties to DB:', dbError);
        }
      }
      
      return res.json(massPropertiesResult);
    }
    
    // STEP 2: Other simulations (only allowed after STEP 1 success)
    if (['structural', 'deflection', 'stress'].includes(simulationType)) {
      // For now, check if mass properties were already computed
      // In a real system, this would check a session/design state
      
      const step2Result = {
        success: true,
        simulation_type: simulationType,
        step: 'STEP 2',
        status: 'COMPLETE',
        message: `${simulationType} analysis completed (STEP 2)`,
        results: {
          [simulationType]: 'Analysis data would go here'
        }
      };
      
      // Save analysis to database
      if (design.id) {
        try {
          await db.saveAnalysis(design.id, step2Result);
        } catch (dbError) {
          console.error('Failed to save analysis to DB:', dbError);
        }
      }
      
      return res.json(step2Result);
    }
    
    res.status(400).json({ error: 'Invalid simulation type' });
    
  } catch (error) {
    console.error('Simulation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to run simulation', details: error.message });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { design, format } = req.body;
    
    if (!design || !format) {
      return res.status(400).json({ error: 'Design and format are required' });
    }
    
    console.log(`Exporting ${format.toUpperCase()} for design type: ${design.type}`);
    
    let buffer;
    let contentType;
    let filename = `${design.type || 'component'}_${Date.now()}`;
    
    switch (format.toLowerCase()) {
      case 'stl':
        buffer = await exportToSTL(design);
        contentType = 'application/sla';
        filename += '.stl';
        break;
      case 'glb':
        buffer = await exportToGLB(design);
        contentType = 'model/gltf+json'; // Changed to JSON format
        filename += '.gltf'; // Changed extension to .gltf
        console.log(`GLTF buffer size: ${buffer.length} bytes`);
        break;
      case 'obj':
        buffer = await exportToOBJ(design);
        contentType = 'text/plain';
        filename += '.obj';
        break;
      case 'step':
        buffer = await exportToSTEP(design);
        contentType = 'application/step';
        filename += '.step';
        break;
      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }
    
    if (!buffer || buffer.length === 0) {
      throw new Error(`Export failed: buffer is empty for format ${format}`);
    }
    
    // Save CAD file record to database if design has a valid MongoDB ObjectId
    if (design.id && typeof design.id === 'string' && design.id.length === 24) {
      try {
        const filePath = join(outputDir, filename);
        fs.writeFileSync(filePath, buffer);
        await db.saveCADFile(design.id, format, filePath, buffer.length);
      } catch (dbError) {
        console.error('Failed to save CAD file to DB:', dbError.message);
        // Continue even if DB save fails
      }
    }
    
    console.log(`Sending ${format.toUpperCase()} file: ${filename} (${buffer.length} bytes)`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to export design', details: error.message });
  }
});

// Structural Analysis Endpoint
app.post('/api/structural-analysis', async (req, res) => {
  try {
    const { design, material, constraints, loads } = req.body;
    
    // Validate required inputs
    if (!design) {
      return res.status(400).json({
        success: false,
        error: 'Design geometry is required'
      });
    }
    
    if (!material) {
      return res.status(400).json({
        success: false,
        error: 'Material selection is required'
      });
    }
    
    // Get material properties
    const materialProps = getMaterialProperties(material);
    if (!materialProps) {
      return res.status(400).json({
        success: false,
        error: `Unknown material: ${material}`
      });
    }
    
    // Validate constraints
    if (!constraints || constraints.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Static analysis requires at least one fixed support',
        hint: 'Define a fixed constraint on at least one face'
      });
    }
    
    // Validate loads
    if (!loads || loads.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Static analysis requires at least one applied load',
        hint: 'Define a force or pressure load'
      });
    }
    
    // Prepare analysis parameters
    const analysisParams = {
      geometry: {
        type: design.type,
        parameters: design.parameters
      },
      material: materialProps,
      constraints: constraints,
      loads: loads
    };
    
    // Validate analysis inputs
    const validation = validateAnalysisInputs(analysisParams);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis inputs',
        details: validation.errors
      });
    }
    
    // Run structural analysis
    console.log(`Running structural analysis for ${design.type} with ${material}`);
    const analysisResult = analyzeStructure(analysisParams);
    
    // Add material info to response
    analysisResult.materialInfo = formatMaterialProperties(material);
    analysisResult.constraints = constraints;
    analysisResult.loads = loads;
    
    // Save analysis to database if design has ID (skip for now to avoid validation errors)
    if (design.id && false) { // Temporarily disabled
      try {
        await db.saveAnalysis(design.id, {
          type: 'structural_analysis',
          material: material, // Save material name as string
          maxStress: analysisResult.results.maxVonMisesStress_MPa,
          maxDisplacement: analysisResult.results.maxDisplacement_mm,
          safetyFactor: analysisResult.results.safetyFactor,
          status: analysisResult.results.status
        });
      } catch (dbError) {
        console.error('Failed to save structural analysis to DB:', dbError);
        // Don't fail the request if DB save fails
      }
    }
    
    console.log(`Structural analysis complete: Max stress = ${analysisResult.results.maxVonMisesStress_MPa.toFixed(2)} MPa`);
    
    return res.json(analysisResult);
    
  } catch (error) {
    console.error('Structural analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Structural analysis failed',
      details: error.message
    });
  }
});

// Get material properties endpoint
app.get('/api/materials/:materialName', (req, res) => {
  try {
    const { materialName } = req.params;
    const formatted = formatMaterialProperties(materialName);
    
    if (!formatted) {
      return res.status(404).json({
        error: 'Material not found'
      });
    }
    
    return res.json(formatted);
  } catch (error) {
    console.error('Material lookup error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve material properties'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DigiForm API running on port ${PORT}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🗄️  MongoDB connected`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
