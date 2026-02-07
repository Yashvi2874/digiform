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
    const { design } = req.body;
    
    if (!design) {
      return res.status(400).json({ error: 'Design is required' });
    }
    
    const analysis = await simulateComponent(design);
    
    // Save analysis to database if design has an ID
    if (design.id) {
      try {
        await db.saveAnalysis(design.id, analysis);
      } catch (dbError) {
        console.error('Failed to save analysis to DB:', dbError);
        // Continue even if DB save fails
      }
    }
    
    res.json(analysis);
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
        contentType = 'model/gltf-binary';
        filename += '.glb';
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
    
    // Save CAD file record to database if design has an ID
    if (design.id) {
      try {
        const filePath = join(outputDir, filename);
        fs.writeFileSync(filePath, buffer);
        await db.saveCADFile(design.id, format, filePath, buffer.length);
      } catch (dbError) {
        console.error('Failed to save CAD file to DB:', dbError);
        // Continue even if DB save fails
      }
    }
    
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
