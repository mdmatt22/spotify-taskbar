import React, { useState, useEffect } from 'react'

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M7 6v12l10-6z" />
  </svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
)

const SkipIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
)

const HideIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19 13H5v-2h14v2z" />
  </svg>
)

function Marquee({ children, className }: { children: React.ReactNode; className: string }): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const textRef = React.useRef<HTMLSpanElement>(null)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const hasOverflow = textRef.current.offsetWidth > containerRef.current.offsetWidth
      setOverflows(hasOverflow)
    }
  }, [children])

  return (
    <div className={`${className} marquee-container`} ref={containerRef}>
      <div className={`marquee-content ${overflows ? 'scrolling' : ''}`}>
        <span ref={textRef}>{children}</span>
        {overflows && <span className="marquee-spacer" />}
        {overflows && <span>{children}</span>}
      </div>
    </div>
  )
}

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
          <Marquee className="title">{trackInfo.title}</Marquee>
          <Marquee className="artist">{trackInfo.artist}</Marquee>
        </div>
      </div>
      <div className="controls">
        <button onClick={handlePlayPause} className="control-btn" title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={handleSkip} className="control-btn" title="Skip">
          <SkipIcon />
        </button>
        <button onClick={handleHide} className="control-btn hide-btn" title="Hide">
          <HideIcon />
        </button>
      </div>
    </div>
  )
}

export default App
