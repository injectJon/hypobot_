import { commandHandler } from '../handlers'

function twitchIrcHandler(eventType, context, sendTwitchIrcCommand) {

  switch (eventType) {
    case 'chat': {
      const { channel, userstate, message } = context

      if (message.startsWith('!')) {
        commandHandler(eventType, { channel, userstate, message }, sendTwitchIrcCommand)
      }

      break
    }
    case 'whisper': {
      const { from, userstate, message } = context

      if ( !(message.startsWith('!')) ) return

      // TODO: register/unregister channel through whisper, nothing else yet
      commandHandler(eventType, { from, userstate, message }, sendTwitchIrcCommand)

      break
    }
  }
}

export {
  twitchIrcHandler,
}
