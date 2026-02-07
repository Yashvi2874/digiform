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

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

export const createSession = async () => {
  const session = new Session();
  await session.save();
  return session._id.toString();
};

export const saveMessage = async (sessionId, role, content) => {
  const message = new Message({ sessionId, role, content });
  await message.save();
  return message._id.toString();
};

export const getMessages = async (sessionId) => {
  return await Message.find({ sessionId }).sort({ timestamp: 1 });
};

export const saveDesign = async (sessionId, messageId, design) => {
  const newDesign = new Design({ sessionId, messageId, ...design });
  await newDesign.save();
  return newDesign._id.toString();
};

export const getDesign = async (id) => {
  return await Design.findById(id);
};

export const getDesigns = async (sessionId) => {
  return await Design.find({ sessionId }).sort({ createdAt: -1 });
};

export const approveDesign = async (id) => {
  return await Design.findByIdAndUpdate(id, { approved: true, status: 'approved' });
};

export const updateDesignStatus = async (id, status) => {
  return await Design.findByIdAndUpdate(id, { status });
};

export const saveAnalysis = async (designId, analysis) => {
  const newAnalysis = new Analysis({ designId, ...analysis });
  await newAnalysis.save();
  return newAnalysis._id.toString();
};

export const getAnalysis = async (designId) => {
  return await Analysis.findOne({ designId }).sort({ createdAt: -1 });
};

export const saveCADFile = async (designId, format, filePath, fileSize) => {
  const cadFile = new CADFile({ designId, format, filePath, fileSize });
  await cadFile.save();
  return cadFile._id.toString();
};

export const getCADFiles = async (designId) => {
  return await CADFile.find({ designId });
};
