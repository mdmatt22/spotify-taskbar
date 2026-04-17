import SpotifyWebApi from 'spotify-web-api-node'
import { ipcMain, shell, BrowserWindow } from 'electron'
import express from 'express'
require('dotenv').config()

const Store = require('electron-store')
const store = new (typeof Store === 'function' ? Store : Store.default)()
const PORT = 8888
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

const spotifyApi = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI
})

const scopes = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
]

export function setupSpotify(mainWindow: BrowserWindow): void {
  const server = express()

  server.get('/callback', (req, res) => {
    const code = req.query.code as string
    spotifyApi.authorizationCodeGrant(code).then(
      (data) => {
        const accessToken = data.body['access_token']
        const refreshToken = data.body['refresh_token']

        store.set('accessToken', accessToken)
        store.set('refreshToken', refreshToken)

        spotifyApi.setAccessToken(accessToken)
        spotifyApi.setRefreshToken(refreshToken)

        res.send('Login successful! You can close this window.')
        startPolling(mainWindow)
      },
      (err) => {
        res.send('Login failed.')
        console.error('Error during authorizationCodeGrant:', err)
      }
    )
  })

  server.listen(PORT)

  ipcMain.on('spotify-command', (_, command) => {
    if (command === 'play') {
      spotifyApi.play().catch(console.error)
    } else if (command === 'pause') {
      spotifyApi.pause().catch(console.error)
    } else if (command === 'skip') {
      spotifyApi.skipToNext().catch(console.error)
    }
  })

  // Try to load saved tokens
  const savedRefreshToken = store.get('refreshToken') as string
  if (savedRefreshToken) {
    spotifyApi.setRefreshToken(savedRefreshToken)
    refreshAccessToken().then(() => startPolling(mainWindow))
  } else {
    // Prompt login
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state')
    shell.openExternal(authorizeURL)
  }
}

async function refreshAccessToken(): Promise<void> {
  try {
    const data = await spotifyApi.refreshAccessToken()
    const accessToken = data.body['access_token']
    spotifyApi.setAccessToken(accessToken)
    store.set('accessToken', accessToken)
  } catch (err) {
    console.error('Could not refresh access token', err)
  }
}

function startPolling(mainWindow: BrowserWindow): void {
  setInterval(async () => {
    try {
      const data = await spotifyApi.getMyCurrentPlayingTrack()
      if (data.body) {
        mainWindow.webContents.send('spotify-update', data.body)
      }
    } catch (err: any) {
      if (err.statusCode === 401) {
        await refreshAccessToken()
      }
      console.error('Error fetching current track:', err)
    }
  }, 3000)
}
