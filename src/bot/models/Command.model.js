// bot/models/Command.model.js

import mongoose from 'mongoose'
import { Channel } from '../models'
const Schema = mongoose.Schema

const options = {
  timestamps: true,
}

const CommandSchema = new Schema({
  code: { type: String, required: true },
  output: [{ type: String, required: true }],
  channel: { type: Schema.Types.ObjectId, required: true },
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
}, options)

const Command = mongoose.model('Command', CommandSchema)

export {
  Command,
}
