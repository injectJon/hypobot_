import winston from 'winston'
import { Channel, Command } from '../models'

export function deleteCommand(context, sendTwitchIrcCommand) {
  const { code, parts, channel, userstate, message } = context

  const chanStr = channel

  // command code we will delete
  const cmdToDelete = parts.shift()

  Channel
    .findOne({ ownerId: userstate['room-id'] })
    .exec((err, channel) => {
      if (err) {
        winston.error('Error while looking up channel in database', { ERROR: err })
        return
      }

      Command
        .remove({ 
          channel: channel._id,
          code: cmdToDelete
        })
        .exec((err, command) => {
          if (err) {
            winston.error('Unable to delete command from database')
            return
          }

          const cmdIdIndex = channel.commands.indexOf(command._id)
          channel.commands.splice(cmdIdIndex, 1)

          channel.save((err) => {
            if (err) {
              winston.error('Unable to save changes to channel.', { ERROR: err })
              return
            }

            const actions = [{
              method: 'say',
              channel: chanStr,
              message: 'Successfully deleted the command.',
            }]

            sendTwitchIrcCommand(actions)
          })
        })

    })
}
