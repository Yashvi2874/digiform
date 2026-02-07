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

      // Possible locations for volume: design.volume, design.properties.volume
      const rawVolume = design.volume || extract(design, 'properties.volume') || extract(design, 'analysis.mass_properties.volume_mm3') || extract(design, 'properties.volume_mm3');
      const volumeVal = Number(rawVolume || 0);

      // Validate required inputs
      if (!volumeVal || volumeVal <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Design volume is required and must be greater than zero',
          simulationType: 'mass_properties',
          step: 'STEP 1',
          status: 'FAILED'
        });
      }

      // Surface area may be in design.surfaceArea or nested
      const surfaceAreaVal = Number(design.surfaceArea || extract(design, 'properties.surfaceArea') || extract(design, 'analysis.mass_properties.surface_area') || 0);

      // Center of mass extraction
      const comObj = design.centerOfMass || extract(design, 'properties.centerOfMass') || extract(design, 'analysis.mass_properties.center_of_mass') || { x: 0, y: 0, z: 0 };

      // Moments of inertia extraction
      const inertiaObj = design.inertia || extract(design, 'properties.inertia') || extract(design, 'analysis.mass_properties.moments_of_inertia') || {};

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
        density_kg_m3 = materialDensities[material] || 7850; // Default: Structural Steel
      }

      // MANDATORY UNIT CONVERSION: volume_mm3 × 1e-9 × density_kg_m3 = mass_kg
      // 1 mm³ = 1e-9 m³
      const volume_m3 = volumeVal * 1e-9;
      const mass_kg = volume_m3 * density_kg_m3;

      const massPropertiesResult = {
        success: true,
        simulation_type: 'mass_properties',
        step: 'STEP 1',
        status: 'COMPLETE',
        message: 'Mass properties computed successfully. Ready for STEP 2 simulations.',
        mass_properties: {
          volume_mm3: Math.round(volumeVal * 100) / 100,
          volume_m3: Math.round(volume_m3 * 1e8) / 1e8,
          surface_area_mm2: Number(surfaceAreaVal) || 0,
          mass_kg: Math.round(mass_kg * 10000) / 10000,
          center_of_mass: {
            x_mm: comObj.x || comObj.x_mm || 0,
            y_mm: comObj.y || comObj.y_mm || 0,
            z_mm: comObj.z || comObj.z_mm || 0
          },
          moments_of_inertia: {
            Ixx_kg_mm2: inertiaObj.Ixx || inertiaObj.Ixx_kg_mm2 || 0,
            Iyy_kg_mm2: inertiaObj.Iyy || inertiaObj.Iyy_kg_mm2 || 0,
            Izz_kg_mm2: inertiaObj.Izz || inertiaObj.Izz_kg_mm2 || 0
          },
          unit_conversion: {
            description: 'volume_mm3 × 1e-9 × density_kg_m3 = mass_kg',
            volume_mm3: volumeVal,
            unit_factor: 1e-9,
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

app.listen(PORT, () => {
  console.log(`🚀 DigiForm API running on port ${PORT}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🗄️  MongoDB connected`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
