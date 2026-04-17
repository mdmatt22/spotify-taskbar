# Spotify Widget Setup Guide

To get your widget working, you need to register it on the Spotify Developer Dashboard.

## 1. Get your Spotify API Credentials
1.  Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2.  Log in with your Spotify account.
3.  Click **Create App**.
4.  Enter a name (e.g., `My Taskbar Widget`) and description.
5.  In the **Redirect URIs** field, enter: `http://127.0.0.1:8888/callback`
6.  Agree to the terms and click **Save**.
7.  Go to the **Users and Access** section (left sidebar) and add your Spotify account's email address as a user. This is required because your app is in "Development" mode.
8.  Go back to **Settings** to find your **Client ID** and **Client Secret**.

## 2. Configure the App
1.  Open the file `src/main/spotify.ts` in this project.
2.  Find the lines:
    ```typescript
    const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'
    const CLIENT_SECRET = 'YOUR_SPOTIFY_CLIENT_SECRET'
    ```
3.  Replace the placeholders with your actual **Client ID** and **Client Secret**.

## 3. Run the App
1.  Open your terminal in the project folder.
2.  Run: `npm run dev`
3.  Your default browser will open to log you into Spotify.
4.  Once authorized, the widget will appear on your taskbar!

## Troubleshooting
*   **No song showing:** Make sure you actually have a song playing (or paused) in your main Spotify desktop app.
*   **Controls not working:** Spotify Premium is required for the "Remote Control" features of their API (Play/Pause/Skip). If you have a free account, the widget can still display the song but may not be able to control it.
