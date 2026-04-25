import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;
const commonOptions = { timestamps: true, strict: false };

const LeadSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  email: String,
  address: String,
  loadRequirement: Number,
  source: String,
  status: String,
  followUpDate: Date,
  notes: String,
  convertedAt: Date,
  stage: String
}, commonOptions);

const ProjectSchema = new Schema({
  id: { type: String, required: true, unique: true },
  leadId: String,
  customerName: String,
  phone: String,
  email: String,
  address: String,
  systemSize: Number,
  inverter: String,
  panelType: String,
  panelCount: Number,
  stage: String,
  netMeterStatus: String,
  subsidyStatus: String,
  notes: String,
  dcrQty: Number,
  dcrModel: String,
  nonDcrQty: Number,
  nonDcrModel: String,
  acdb: String,
  dcdb: String,
  structure: String,
  dcCable: String,
  acCable: String,
  copperEarthing: String,
  chemicalEarthing: String,
  accessories: String,
  startDate: String
}, commonOptions);

const PaymentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  projectId: String,
  customerName: String,
  totalCost: Number,
  advancePaid: Number,
  remainingBalance: Number,
  paymentHistory: { type: Array, default: [] }
}, commonOptions);

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, index: true },
  password: String,
  role: String,
  createdBy: String
}, commonOptions);

const ActivitySchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: String,
  description: String,
  entityId: String,
  entityType: String,
  userId: String,
  projectId: String,
  customerName: String,
  updatedBy: String
}, commonOptions);

const SettingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  key: String,
  value: Schema.Types.Mixed,
  updatedBy: String
}, commonOptions);

const createModel = (name, schema) => models[name] || model(name, schema);

export const MongooseModels = {
  leads: createModel('Lead', LeadSchema),
  projects: createModel('Project', ProjectSchema),
  payments: createModel('Payment', PaymentSchema),
  users: createModel('User', UserSchema),
  activities: createModel('Activity', ActivitySchema),
  settings: createModel('Setting', SettingSchema)
};

export const getMongooseModel = (collection) => {
  const modelName = MongooseModels[collection];
  if (!modelName) {
    throw new Error(`No mongoose model defined for collection: ${collection}`);
  }
  return modelName;
};
