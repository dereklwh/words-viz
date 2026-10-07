// Visual check: node scripts/snapshots.mjs <outDir> [url]
// Set CHROMIUM_PATH to reuse a locally cached browser instead of Playwright's pinned one.
import { chromium } from 'playwright'

const [outDir = 'snapshots', url = 'http://localhost:5173'] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

const VIEWS = ['Pulse', 'Waveform', 'Length mix', 'Score']
const SHORT_PARAGRAPH =
  "A random paragraph can also be an excellent way for a writer to tackle writers' block. Writing block can often happen due to being stuck with a current project that the writer is trying to complete. By inserting a completely random paragraph from which to begin, it can take down some of the issues that may have been causing the writers' block in the first place."

async function run(name, { width, height, colorScheme, text, frames = [], hover = false }) {
  const page = await browser.newPage({
    viewport: { width, height },
    colorScheme,
    deviceScaleFactor: 2,
  })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
  if (text) await page.getByLabel('Paragraph to analyze').fill(text)
  else await page.getByRole('button', { name: /Provost/ }).click()
  await page.getByRole('button', { name: 'Show the rhythm' }).click()

  const start = Date.now()
  for (const t of frames) {
    await page.waitForTimeout(Math.max(0, t * 1000 - (Date.now() - start)))
    await page.screenshot({ path: `${outDir}/${name}-flight-${t}s.png` })
  }
  await page.waitForTimeout(Math.max(0, 4500 - (Date.now() - start)))

  // Viewport shots: full-page capture drops motion-animated SVG nodes that started off-screen.
  for (const view of VIEWS) {
    await page.getByRole('radio', { name: view }).click()
    await page.waitForTimeout(500)
    await page.locator('.headline').scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -40))
    await page.screenshot({ path: `${outDir}/${name}-${view.toLowerCase().replace(' ', '-')}.png` })
  }

  if (hover) {
    await page.getByRole('radio', { name: 'Pulse' }).click()
    await page.waitForTimeout(400)
    await page.locator('.headline').scrollIntoViewIfNeeded()
    await page.locator('.chart .mark').nth(9).hover()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${outDir}/${name}-hover.png` })
  }

  await page.close()
  if (errors.length) console.log(name, 'errors:', errors)
}

await run('provost-light', {
  width: 1360,
  height: 900,
  colorScheme: 'light',
  frames: [0.6, 1.4, 2.2],
  hover: true,
})
await run('provost-dark', { width: 1360, height: 900, colorScheme: 'dark' })
await run('short-light', { width: 1360, height: 900, colorScheme: 'light', text: SHORT_PARAGRAPH })
await run('provost-mobile', { width: 390, height: 844, colorScheme: 'light' })
await browser.close()
console.log('done')
