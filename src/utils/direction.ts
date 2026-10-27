const RTL_SCRIPT_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const LTR_SCRIPT_REGEX = /[A-Za-z\u00C0-\u024F]/;

/**
 * Detects text direction ('rtl' | 'ltr') from the first strong directional character.
 * Falls back to `defaultDir` when input has no strong directional characters.
 */
export function detectTextDirection(
  text: string,
  defaultDir: 'rtl' | 'ltr' = 'rtl'
): 'rtl' | 'ltr' {
  for (const ch of text) {
    if (RTL_SCRIPT_REGEX.test(ch)) return 'rtl';
    if (LTR_SCRIPT_REGEX.test(ch)) return 'ltr';
  }
  return defaultDir;
}
