import { ActivityType, Assets } from 'premid'

const presence = new Presence({
  clientId: '1468559565766398046',
})
const browsingTimestamp = Math.floor(Date.now() / 1000)
const strings = presence.getStrings({
  play: 'general.playing',
  pause: 'general.paused',
})

enum ActivityAssets {
  Logo = 'https://i.imgur.com/KyVbxbF.png',
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3)
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
  if (parts.length === 2)
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
  return 0
}

presence.on('UpdateData', async () => {
  const { hostname, pathname } = document.location
  let details = 'ASOBI STORE'

  if (hostname === 'asobichannel.asobistore.jp')
    details = 'ASOBI CHANNEL'
  else if (hostname === 'shop.asobistore.jp')
    details = 'アソビストア'
  else if (hostname === 'asobiticket2.asobistore.jp')
    details = 'ASOBI TICKET'
  else if (hostname === 'asobistage.asobistore.jp')
    details = 'ASOBI STAGE'
  else if (hostname === 'webstore.asobistore.jp')
    details = 'ASOBI STORE'
  else if (hostname === 'book.asobistore.jp')
    details = 'アソビストアbook'

  let state = document.title
  if (
    (pathname === '/' && hostname !== 'asobistore.jp')
    || (hostname === 'asobiticket2.asobistore.jp' && pathname === '/booths')
  )
    state = 'ホーム'

  const presenceData: PresenceData = {
    largeImageKey: ActivityAssets.Logo,
    startTimestamp: browsingTimestamp,
    details,
    state,
    stateUrl: document.location.href,
  }

  if (hostname === 'asobistage.asobistore.jp') {
    const appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    if (appleTouchIcon?.href)
      presenceData.largeImageKey = appleTouchIcon.href
  }

  if (hostname === 'asobichannel.asobistore.jp' && pathname.startsWith('/watch/')) {
    const thumbnailImg = document.querySelector<HTMLImageElement>('div.VideoInfo_info_data_thumb__8fd7M > img')
    if (thumbnailImg?.src)
      presenceData.largeImageKey = thumbnailImg.src

    presenceData.largeImageText = document.title as any
    presenceData.largeImageUrl = document.location.href as any

    const videoPlayer = document.querySelector('[class*="video-js"]')

    if (videoPlayer) {
      const isPlaying = videoPlayer.classList.contains('vjs-playing')
      const hasStarted = videoPlayer.classList.contains('vjs-has-started')
      const hasEnded = videoPlayer.classList.contains('vjs-ended')

      if (hasStarted && !hasEnded) {
        presenceData.type = ActivityType.Watching as any
        presenceData.smallImageKey = isPlaying ? Assets.Play : Assets.Pause
        presenceData.smallImageText = isPlaying
          ? (await strings).play
          : (await strings).pause

        const currentTimeEl = videoPlayer.querySelector('.vjs-current-time-display')
        const durationEl = videoPlayer.querySelector('.vjs-duration-display')

        if (currentTimeEl?.textContent && durationEl?.textContent) {
          const currentSeconds = parseTime(currentTimeEl.textContent)
          const durationSeconds = parseTime(durationEl.textContent)

          if (isPlaying && durationSeconds > 0) {
            const now = Math.floor(Date.now() / 1000)
            presenceData.startTimestamp = now - currentSeconds
            presenceData.endTimestamp = now + (durationSeconds - currentSeconds)
          }
          else {
            delete presenceData.startTimestamp
            delete presenceData.endTimestamp
          }
        }
      }
    }
  }

  presence.setActivity(presenceData)
})
