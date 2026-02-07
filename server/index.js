import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { generateDesignFromNL, simulateComponent } from './aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure output directory exists
const outputDir = join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/output', express.static(outputDir));

// Generate CAD using Python backend
async function generateCAD(design) {
  return new Promise((resolve, reject) => {
    const pythonScript = join(__dirname, '..', 'python_backend', 'simple_cad.py');
    const python = spawn('python', [pythonScript]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse Python output: ' + output));
        }
      } else {
        reject(new Error('Python script failed: ' + errorOutput));
      }
    });
    
    // Send design data to Python script
    python.stdin.write(JSON.stringify(design));
    python.stdin.end();
  });
}

app.post('/api/generate', async (req, res) => {
  try {
    const { description } = req.body;
    const design = await generateDesignFromNL(description);
    
    // Try to generate CAD file (optional, won't fail if Python not available)
    try {
      const cadResult = await generateCAD(design);
      design.cadFile = cadResult.stl_file;
      design.cadProperties = cadResult.properties;
    } catch (cadError) {
      console.log('CAD generation skipped:', cadError.message);
    }
    
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
    res.json(analysis);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Failed to run simulation' });
  }
});

app.post('/api/refine', async (req, res) => {
  try {
    const { designId, refinement } = req.body;
    const updatedDesign = await generateDesignFromNL(refinement);
    res.json(updatedDesign);
  } catch (error) {
    console.error('Refinement error:', error);
    res.status(500).json({ error: 'Failed to refine design' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Output directory: ${outputDir}`);
});
