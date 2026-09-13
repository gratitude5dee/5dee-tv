/** Labeled local fixtures used until an item has an approved visual reference. */
export function assetPlaceholder(label: string, hue = 260) {
  const safe = label.replace(/[<>&]/g, '').slice(0, 28)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 68% 35%)"/><stop offset="1" stop-color="#080a12"/></linearGradient></defs><rect width="800" height="520" fill="url(#g)"/><circle cx="630" cy="110" r="170" fill="white" fill-opacity=".08"/><path d="M0 430 220 250l160 120 145-165L800 430v90H0z" fill="white" fill-opacity=".10"/><text x="44" y="448" fill="white" font-family="Arial, sans-serif" font-size="34" font-weight="600">${safe}</text><text x="44" y="482" fill="white" fill-opacity=".7" font-family="Arial, sans-serif" font-size="18">visual fixture · add approved reference</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
