import winston from 'winston'
import { Channel, Command } from '../models'

export function addCommand(context, sendTwitchIrcCommand) {
  const { code, parts, channel, userstate, message } = context
  
  const chanStr = channel

  console.log('here!')
  // piece together new command
  const newCmd = parts.shift()
  const newCmdOutput = parts
  const createdBy = userstate.username

  // make sure command doesnt already exist
  Channel
    .findOne({ ownerId: userstate['room-id'] })
    .populate('commands')
    .exec((err, channel) => {
      if (err) {
        winston.error('Error while looking up channel in database', { ERROR: err }) 
        return
      }
      
      for (let cmd of channel.commands) {
        if (cmd.code === newCmd) {
          // that command already exists
          const actions = [{
            method: 'say',
            channel: chanStr,
            message: 'A command with that name already exists.'
          }]

          sendTwitchIrcCommand(actions) // respond in chat
          return
        }
      }

      // cool, command doesnt exist, lets create it
      const command = new Command()
      command.code = newCmd
      command.output = newCmdOutput
      command.channel = channel._id
      command.createdBy = createdBy

      // and finally lets save the command
      command.save((err) => {
        if (err) {
          winston.error('ERROR saving command to database', { ERROR: err }) 
          return
        }

        // and add it to channels command list
        channel.commands.push(command._id)

        // then save the updated channel
        channel.save((err) => {
          if (err) {
            winston.error('ERROR saving command to channel', { ERROR: err })
            return
          }

          const actions = [{
            method: 'say',
            channel: chanStr,
            message: 'Command was added successfully.',
          }]

          sendTwitchIrcCommand(actions) // respond in chat
          return
        })
      })
    })

}