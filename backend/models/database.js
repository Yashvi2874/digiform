import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const designSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  type: { type: String, required: true },
  description: { type: String, required: true },
  material: { type: String, required: true },
  complexity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  application: String,
  parameters: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Design' },
  createdAt: { type: Date, default: Date.now }
});

const analysisSchema = new mongoose.Schema({
  designId: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', required: true },
  maxStress: Number,
  safetyFactor: Number,
  deformation: Number,
  material: String,
  yieldStrength: Number,
  mass: Number,
  loadConditions: mongoose.Schema.Types.Mixed,
  stressDistribution: mongoose.Schema.Types.Mixed,
  warnings: [String],
  createdAt: { type: Date, default: Date.now }
});

const cadFileSchema = new mongoose.Schema({
  designId: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', required: true },
  format: { type: String, enum: ['stl', 'glb', 'obj', 'step'], required: true },
  filePath: String,
  fileSize: Number,
  createdAt: { type: Date, default: Date.now }
});

export const Session = mongoose.model('Session', sessionSchema);
export const Message = mongoose.model('Message', messageSchema);
export const Design = mongoose.model('Design', designSchema);
export const Analysis = mongoose.model('Analysis', analysisSchema);
export const CADFile = mongoose.model('CADFile', cadFileSchema);

// In-memory storage for development when MongoDB is not available
let inMemoryStorage = {
  sessions: [],
  messages: [],
  designs: [],
  analyses: [],
  cadFiles: []
};

let isMongoConnected = false;

export const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      isMongoConnected = true;
      return conn;
    } else {
      console.log('⚠️  MongoDB URI not provided - using in-memory storage');
      isMongoConnected = false;
      return { connection: { host: 'in-memory' } };
    }
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    console.log('⚠️  Falling back to in-memory storage');
    isMongoConnected = false;
    return { connection: { host: 'in-memory-fallback' } };
  }
};

// Session functions
export const createSession = async () => {
  if (isMongoConnected) {
    const session = new Session();
    await session.save();
    return session._id.toString();
  } else {
    const sessionId = 'session_' + Date.now();
    inMemoryStorage.sessions.push({ _id: sessionId, createdAt: new Date(), updatedAt: new Date() });
    return sessionId;
  }
};

export const saveMessage = async (sessionId, role, content) => {
  if (isMongoConnected) {
    const message = new Message({ sessionId, role, content });
    await message.save();
    return message._id.toString();
  } else {
    const messageId = 'message_' + Date.now();
    inMemoryStorage.messages.push({ 
      _id: messageId, 
      sessionId, 
      role, 
      content, 
      timestamp: new Date() 
    });
    return messageId;
  }
};

export const getMessages = async (sessionId) => {
  if (isMongoConnected) {
    return await Message.find({ sessionId }).sort({ timestamp: 1 });
  } else {
    return inMemoryStorage.messages
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
};

// Design functions
export const saveDesign = async (sessionId, messageId, design) => {
  if (isMongoConnected) {
    const newDesign = new Design({ sessionId, messageId, ...design });
    await newDesign.save();
    return newDesign._id.toString();
  } else {
    const designId = 'design_' + Date.now();
    inMemoryStorage.designs.push({ 
      _id: designId, 
      sessionId, 
      messageId, 
      ...design,
      createdAt: new Date()
    });
    return designId;
  }
};

export const getDesign = async (id) => {
  if (isMongoConnected) {
    return await Design.findById(id);
  } else {
    return inMemoryStorage.designs.find(d => d._id === id);
  }
};

export const getDesigns = async (sessionId) => {
  if (isMongoConnected) {
    return await Design.find({ sessionId }).sort({ createdAt: -1 });
  } else {
    return inMemoryStorage.designs
      .filter(d => d.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

export const approveDesign = async (id) => {
  if (isMongoConnected) {
    return await Design.findByIdAndUpdate(id, { approved: true, status: 'approved' });
  } else {
    const design = inMemoryStorage.designs.find(d => d._id === id);
    if (design) {
      design.approved = true;
      design.status = 'approved';
    }
    return design;
  }
};

export const updateDesignStatus = async (id, status) => {
  if (isMongoConnected) {
    return await Design.findByIdAndUpdate(id, { status });
  } else {
    const design = inMemoryStorage.designs.find(d => d._id === id);
    if (design) {
      design.status = status;
    }
    return design;
  }
};

// Analysis functions
export const saveAnalysis = async (designId, analysis) => {
  if (isMongoConnected) {
    const newAnalysis = new Analysis({ designId, ...analysis });
    await newAnalysis.save();
    return newAnalysis._id.toString();
  } else {
    const analysisId = 'analysis_' + Date.now();
    inMemoryStorage.analyses.push({ 
      _id: analysisId, 
      designId, 
      ...analysis,
      createdAt: new Date()
    });
    return analysisId;
  }
};

export const getAnalysis = async (designId) => {
  if (isMongoConnected) {
    return await Analysis.findOne({ designId }).sort({ createdAt: -1 });
  } else {
    return inMemoryStorage.analyses
      .filter(a => a.designId === designId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }
};

// CAD File functions
export const saveCADFile = async (designId, format, filePath, fileSize) => {
  if (isMongoConnected) {
    const cadFile = new CADFile({ designId, format, filePath, fileSize });
    await cadFile.save();
    return cadFile._id.toString();
  } else {
    const cadFileId = 'cadfile_' + Date.now();
    inMemoryStorage.cadFiles.push({ 
      _id: cadFileId, 
      designId, 
      format, 
      filePath, 
      fileSize,
      createdAt: new Date()
    });
    return cadFileId;
  }
};

export const getCADFiles = async (designId) => {
  if (isMongoConnected) {
    return await CADFile.find({ designId });
  } else {
    return inMemoryStorage.cadFiles.filter(f => f.designId === designId);
  }
};
