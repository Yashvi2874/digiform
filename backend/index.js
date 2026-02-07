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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

await db.connectDB();

const outputDir = join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/output', express.static(outputDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DigiForm API is running' });
});


app.post('/api/chat/session', async (req, res) => {
  try {
    const sessionId = await db.createSession();
    res.json({ sessionId });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/api/chat/message', async (req, res) => {
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

app.get('/api/chat/history/:sessionId', async (req, res) => {
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
    const design = await generateDesignFromNL(description);
    res.json(design);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate design', details: error.message });
  }
});

app.post('/api/simulate', async (req, res) => {
  try {
    const { design } = req.body;
    const analysis = await simulateComponent(design);
    
    // Save analysis to database if design has an ID
    if (design.id) {
      await db.saveAnalysis(design.id, analysis);
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Failed to run simulation' });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { design, format } = req.body;
    
    let buffer;
    let contentType;
    let filename = `${design.type}_${Date.now()}`;
    
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
        throw new Error('Unsupported format');
    }
    
    // Save CAD file record to database if design has an ID
    if (design.id) {
      const filePath = join(outputDir, filename);
      fs.writeFileSync(filePath, buffer);
      await db.saveCADFile(design.id, format, filePath, buffer.length);
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export design', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DigiForm API running on port ${PORT}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🗄️  MongoDB connected`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
