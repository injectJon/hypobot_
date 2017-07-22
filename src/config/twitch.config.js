import { tAuth } from '../../local_auth'

export const twitchOptions = {
  options: {
      clientId: tAuth.clientId,
      debug: true,
  },
  connection: {
      reconnect: true,
      reconnectInterval: 500,
      secure: true,
  },
  identity: {
      username: tAuth.username,
      password: tAuth.password,
  },
  channels: [],
}
