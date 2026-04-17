import React, { useState, useEffect } from 'react'

function App(): JSX.Element {
  const [trackInfo, setTrackInfo] = useState({ title: 'Not Playing', artist: '', albumArt: '' })
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // @ts-ignore
    window.api.onSpotifyUpdate((data: any) => {
      setTrackInfo({
        title: data.item?.name || 'Not Playing',
        artist: data.item?.artists?.map((a: any) => a.name).join(', ') || '',
        albumArt: data.item?.album?.images[0]?.url || ''
      })
      setIsPlaying(data.is_playing)
    })
  }, [])

  const handlePlayPause = () => {
    // @ts-ignore
    window.api.spotifyCommand(isPlaying ? 'pause' : 'play')
  }

  const handleSkip = () => {
    // @ts-ignore
    window.api.spotifyCommand('skip')
  }

  const handleHide = () => {
    // @ts-ignore
    window.api.windowCommand('hide')
  }

  return (
    <div className="widget-container">
      <div className="track-info">
        {trackInfo.albumArt && <img src={trackInfo.albumArt} alt="Album Art" className="album-art" />}
        <div className="text-container">
          <div className="title">{trackInfo.title}</div>
          <div className="artist">{trackInfo.artist}</div>
        </div>
      </div>
      <div className="controls">
        <button onClick={handlePlayPause} className="control-btn">
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={handleSkip} className="control-btn">Skip</button>
        <button onClick={handleHide} className="control-btn hide-btn">Hide</button>
      </div>
    </div>
  )
}

export default App
