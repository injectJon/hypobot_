import { Channel, Commands } from '../models'
import winston from 'winston'
import * as commands from '../commands'

// TODO: parse all custom commands' outputs, implementing e.g. @user@ api

function commandHandler(eventType, context, sendTwitchIrcCommand) {

  switch (eventType) {
    case 'chat': {
      const { channel, userstate, message } = context

      const chanStr = channel

      // respond to dirty registered stream test
      if (message === '!ping') {
        const actions = [{
          method: 'say',
          channel: channel,
          message: 'pong!',
        }]

        sendTwitchIrcCommand(actions)
        return
      }

      const parts = message.split(' ')
      const code = parts.shift()

      // check static commands:
      for (let c of staticCommands) 
        if (c.code === code) {
          // check role
          if (c.role >= ROLE.MODERATOR) {
            // check if user is moderator
            if (userstate['user-id'] === userstate['room-id'] || userstate.mod) {
              // else call command
              c.action({ code, parts, channel, userstate, message }, sendTwitchIrcCommand)
              return
            }

            return
          }
        }

      // check custom commands
      // if we find a match, respond in chat with custom command output
      Channel
        .findOne({ ownerId: userstate['room-id'] })
        .populate('commands')
        .exec((err, channel) => {
          if (err) {
            winston.error('Error looking up channel in database', { ERROR: err })
            return
          }

          for (let c of channel.commands) 
            if (c.code === code) {
              const actions = [{
                method: 'say',
                channel: chanStr, 
                message: c.output.join(' ')
              }]

              sendTwitchIrcCommand(actions)
            }
          
        })

      // STEP 2: if role >= MODERATOR, check user's role
       

      break
    }
    case 'whisper': {
      // CURRENTLY:
      // !register and !unregister are working flawlessly
      // no other whisper support has been implemented, yet.
      const { from, userstate, message } = context

      if (message === '!register') {
        const name = `#${userstate.username}`
        const owner = userstate.username
        const ownerId = userstate['user-id']

        const channel = new Channel()
        channel.name = name
        channel.owner = owner
        channel.ownerId = ownerId

        channel.save((err) => {
          if (err) {
            winston.error('Unable to save new channel to database.', { ERROR: err })
          }

          const actions = [
            {
              method: 'whisper',
              username: owner,
              message: 'Your channel has been registered!',
            },
            {
              method: 'join',
              channel: name,
            }
          ]

          sendTwitchIrcCommand(actions)
        })
      }

      if (message === '!unregister') {
        const name = `#${userstate.username}`
        const owner = userstate.username
        const ownerId = userstate['user-id']

        Channel
          .findOne({ ownerId })
          .exec((err, channel) => {
            if (err) {
              winston.error('Unable to retrieve channel from database', { ERROR: err })
              return
            }

            let msg
            if (!channel) {
              msg = 'Your channel was never registered.'
            } else if (!channel.registered) {
              msg = 'Your channel is already unregistered.'
            } else {
              channel.unregistered = false

              channel.save((err) => {
                if (err) {
                  winston.error('Unable to save changes to channel', { ERROR: err })
                  return
                }

                msg = 'Your channel was successfully unregistered.'
              })
            }

            const actions = [
              {
                method: 'whisper',
                username: owner,
                message: msg,
              },
              {
                method: 'part',
                channel: name,
              },
            ]

            sendTwitchIrcCommand(actions)
          })
      }

      break
    }
  }
}

const ROLE = {
  ADMIN: 99,
  OWNER: 4,
  MODERATOR: 3,
  SUBSCRIBER: 2,
  EVERYONE: 1,
}

const staticCommands = [
  // TODO: add command aliases (global and/or custom aliases?)
  {
    code: '!commands',
    // aliases: ['!list', '!cmdlist', '!command', '!commandlist', '!cmds'],
    role: ROLE.EVERYONE,
    action: (context, sendTwitchIrcCommand) => {
      commands.commandList(context, sendTwitchIrcCommand)
    }
  },
  {
    code: '!addcmd',
    role: ROLE.MODERATOR,
    action: (context, sendTwitchIrcCommand) => {
      commands.addCommand(context, sendTwitchIrcCommand)
    }
  },
  {
    code: '!editcmd',
    role: ROLE.MODERATOR,
    action: (context, sendTwitchIrcCommand) => {
      commands.editCommand(context, sendTwitchIrcCommand)
    }
  },
  {
    code: '!delcmd',
    role: ROLE.MODERATOR,
    action: (context, sendTwitchIrcCommand) => {
      commands.deleteCommand(context, sendTwitchIrcCommand)
    }
  },
]


export {
  commandHandler,
}
