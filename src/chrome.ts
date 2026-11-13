/**
 * Colours the browser around the app to match the screen: the theme colour (status
 * bar in installed apps, Android) and the page background, which iOS Safari uses
 * for the area behind the status bar and the edges. Without the background, Safari
 * shows the default dark page colour as a black band at the top.
 */
export function paintChrome(color: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color)
  document.documentElement.style.backgroundColor = color
  document.body.style.backgroundColor = color
}
