/** Convert any ISO 3166-1 alpha-2 code to flag emoji */
export function countryFlag(code: string): string {
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

/** Get German country name for ISO code */
export function countryName(code: string): string {
  const upper = code.toUpperCase()
  try {
    const dn = new Intl.DisplayNames(['de'], { type: 'region' })
    return dn.of(upper) ?? upper
  } catch {
    return upper
  }
}
