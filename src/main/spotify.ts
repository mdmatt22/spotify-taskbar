import SpotifyWebApi from 'spotify-web-api-node'
import { ipcMain, shell, BrowserWindow, app } from 'electron'
import { join } from 'path'
import express from 'express'

// Handle .env in both development and production
const isDev = !app.isPackaged
const envPath = isDev ? join(__dirname, '../../.env') : join(process.resourcesPath, '.env')
require('dotenv').config({ path: envPath })

const Store = require('electron-store')
const store = new (typeof Store === 'function' ? Store : Store.default)()
const PORT = 8888
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`

// Use a fallback mechanism to find credentials in both dev and prod
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
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
  if (!CLIENT_ID || !CLIENT_SECRET) {
    const { dialog } = require('electron')
    dialog.showErrorBox(
      'Missing Spotify Credentials',
      'SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing from .env file. Please check your configuration.'
    )
    return
  }

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
