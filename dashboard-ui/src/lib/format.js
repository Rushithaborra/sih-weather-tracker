export function fmtTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC'
}

export function fmtShort(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

export function hoursBetween(isoA, isoB) {
  return Math.round((new Date(isoB) - new Date(isoA)) / 36e5)
}
