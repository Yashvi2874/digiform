import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  company: { type: String, trim: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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

export const User = mongoose.model('User', userSchema);
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

export const createUser = async (email, password, name, company) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  const user = new User({ email, password, name, company });
  await user.save();
  return { id: user._id.toString(), email: user.email, name: user.name };
};

export const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  user.lastLogin = new Date();
  await user.save();
  return { id: user._id.toString(), email: user.email, name: user.name, company: user.company };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  return user;
};

export const createSession = async (userId) => {
  const session = new Session({ userId });
  await session.save();
  return session._id.toString();
};

export const getUserSessions = async (userId) => {
  const sessions = await Session.find({ userId }).sort({ updatedAt: -1 });
  
  console.log(`Found ${sessions.length} sessions for user ${userId}`);
  
  // Get first message for each session as preview and filter out empty sessions
  const sessionsWithPreview = await Promise.all(
    sessions.map(async (session) => {
      const messageCount = await Message.countDocuments({ sessionId: session._id });
      
      console.log(`Session ${session._id}: ${messageCount} messages`);
      
      // Skip empty sessions
      if (messageCount === 0) {
        console.log(`Skipping empty session ${session._id}`);
        return null;
      }
      
      const firstMessage = await Message.findOne({ 
        sessionId: session._id, 
        role: 'user' 
      }).sort({ timestamp: 1 });
      
      console.log(`First message for session ${session._id}:`, firstMessage ? firstMessage.content.substring(0, 30) : 'NONE');
      
      // Use first 60 characters of first user message as preview
      const preview = firstMessage 
        ? firstMessage.content.substring(0, 60) + (firstMessage.content.length > 60 ? '...' : '')
        : 'New Chat';
      
      console.log(`Preview for session ${session._id}: "${preview}"`);
      
      return {
        _id: session._id,
        userId: session.userId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        preview,
        messageCount
      };
    })
  );
  
  // Filter out null values (empty sessions)
  const filtered = sessionsWithPreview.filter(session => session !== null);
  console.log(`Returning ${filtered.length} sessions with previews`);
  return filtered;
};

export const deleteSession = async (sessionId) => {
  // Delete all related data
  await Message.deleteMany({ sessionId });
  const designs = await Design.find({ sessionId });
  const designIds = designs.map(d => d._id);
  
  // Delete analyses and CAD files for these designs
  await Analysis.deleteMany({ designId: { $in: designIds } });
  await CADFile.deleteMany({ designId: { $in: designIds } });
  
  // Delete designs
  await Design.deleteMany({ sessionId });
  
  // Delete session
  await Session.findByIdAndDelete(sessionId);
};

export const deleteEmptySessions = async (userId) => {
  // Find all sessions for this user
  const sessions = await Session.find({ userId });
  
  // Delete sessions with no messages
  for (const session of sessions) {
    const messageCount = await Message.countDocuments({ sessionId: session._id });
    if (messageCount === 0) {
      await Session.findByIdAndDelete(session._id);
    }
  }
};

export const saveMessage = async (sessionId, role, content) => {
  const message = new Message({ sessionId, role, content });
  await message.save();
  
  // Update session's updatedAt timestamp
  await Session.findByIdAndUpdate(sessionId, { updatedAt: new Date() });
  
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
