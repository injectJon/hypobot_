import tmi from 'tmi.js'
import Promise from 'bluebird'
import winston from 'winston'
import mongoose from 'mongoose'

import { Channel } from './models'

mongoose.connect('mongodb://localhost:27017/hypobot_')

// bot configuration
import { twitchOptions } from '../config'
import { twitchIrcHandler } from './handlers'

// bot initialization and event listeners
function twitchIrcBot(options) {
  const twitchIrc = new tmi.client(options)

  twitchIrc.on('chat', (channel, userstate, message, self) => {
    if (self) return

    twitchIrcHandler('chat', { channel, userstate, message }, (response, callback) => {
      if (!response) return

      sendTwitchIrcCommand(response, callback)
    })
  })

  twitchIrc.on('whisper', (from, userstate, message, self) => {
    if (self) return

    twitchIrcHandler('whisper', { from, userstate, message }, (response) => {
      if (!response) return

      sendTwitchIrcCommand(response)
    })
  })

  function sendTwitchIrcCommand(actions, cmdCallback) {
    actions.forEach((action) => {
      switch (action.method) {
        case 'say':
          twitchIrc.say(action.channel, action.message, (err) => {
            winston.warn('Unable to send message in channel', { ERROR: err })
          })
          break
        case 'whisper':
          twitchIrc.whisper(action.username, action.message, (err) => {
            winston.warn('Unable to send whisper to user', { ERROR: err })
          })
          break
        case 'join':
          twitchIrc.join(action.channel, (err) => {
            winston.warn('Unable to join channel', { ERROR: err })
          })
          break
        case 'part':
          twitchIrc.part(action.channel, (err) => {
            winston.warn('Unable to part channel', { ERROR: err })
          })
          break
        case 'color':
          twitchIrc.color(action.color)

          break
        default:
          winston.warn('Invalid action @sendTwitchIrcCommand', { ACTION: action })
          break
      }
    })
  }

  twitchIrc.connect()
}

// load registered channels from database and start irc bot
function loadTwitchChannels(options) {
  Channel
    .find({})
    .exec((err, channels) => {
      if (err) {
        winston.error('Unable to retrieve channels from database.', { ERROR: err })
        return
      }

      if (!channels || channels.length === 0) {
        twitchIrcBot(options)
        winston.warn('No channels registered.. starting dark..')
        return
      }

      let i = 0
      for (let c of channels) 
        if (c.registered) {
          options.channels.push(c.name)
        }

        i++
        if (i === channels.length) {
          twitchIrcBot(options)
          return
        }
      
    })

}

loadTwitchChannels(twitchOptions)
