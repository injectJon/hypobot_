import winston from 'winston'
import { Channel, Command } from '../models'

export function editCommand(context, sendTwitchIrcCommand) {
  const { code, parts, channel, userstate, message } = context

  const chanStr = channel

  // piece together command to edit
  const cmdToEdit = parts.shift()
  const newOutput = parts
  const updatedBy = userstate.username
 
  Channel
    .findOne({ ownerId: userstate['room-id'] })
    .exec((err, channel) => {

      Command
        .find({ 
          code: cmdToEdit,
          channel: channel._id
        })
        .exec((err, commands) => {
          if (err) {
            winston.error('Error while querying for command in database.', { ERROR: err })
            return
          }

          if (commands.length > 1) {
            winston.warn('Multiple commands with same code detected..')
          }
          const command = commands[0]

          if (!command) {
            const actions = [{
              method: 'say',
              channel: chanStr,
              message: "Unable to update command: the command doesn't exist."
            }]

            sendTwitchIrcCommand(actions)
            return
          }

          // make changes to command output
          command.output = newOutput
          command.updatedBy = updatedBy

          // save changes
          command.save((err) => {
            if (err) {
              winston.error('Unable to save changes to command.', { ERROR, err })
            }

            const actions = [{
              method: 'say',
              channel: chanStr,
              message: 'Successfully updated the command.'
            }]

            sendTwitchIrcCommand(actions)
          })
        })

    })

}
