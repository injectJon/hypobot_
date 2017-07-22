// bot/models/Channel.model.js

import mongoose from 'mongoose'
const Schema = mongoose.Schema

const options = {
  timestamps: true,
}

const ChannelSchema = new Schema({
  name: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  ownerId: { type: String, required: true },
  registered: { type: Boolean, default: true, required: true },
  subscribers: [{ type: String }],
  commands: [ { type: Schema.Types.ObjectId, ref: 'Command' } ],
}, options)

const Channel = mongoose.model('Channel', ChannelSchema)

export {
  Channel,
}
