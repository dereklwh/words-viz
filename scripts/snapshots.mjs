// Visual check: node scripts/snapshots.mjs <outDir> [url]
// Set CHROMIUM_PATH to reuse a locally cached browser instead of Playwright's pinned one.
import { chromium } from 'playwright'

const [outDir = 'snapshots', url = 'http://localhost:5173'] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

async function run(name, { width, height, colorScheme, frames = [] }) {
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
  await page.screenshot({ path: `${outDir}/${name}-landing.png` })
  await page.getByRole('button', { name: /Provost/ }).click()
  await page.getByRole('button', { name: 'Show the rhythm' }).click()
  const start = Date.now()
  for (const t of frames) {
    await page.waitForTimeout(Math.max(0, t * 1000 - (Date.now() - start)))
    await page.screenshot({ path: `${outDir}/${name}-flight-${t}s.png` })
  }
  await page.waitForTimeout(Math.max(0, 4500 - (Date.now() - start)))
  // Viewport shots: full-page capture drops motion-animated SVG nodes that started off-screen.
  await page.screenshot({ path: `${outDir}/${name}-scored.png` })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${outDir}/${name}-scored-top.png` })
  await page.close()
  if (errors.length) console.log(name, 'errors:', errors)
}

await run('desktop-light', {
  width: 1360,
  height: 900,
  colorScheme: 'light',
  frames: [0.4, 0.9, 1.5, 2.2],
})
await run('desktop-dark', { width: 1360, height: 900, colorScheme: 'dark' })
await run('mobile-light', { width: 390, height: 844, colorScheme: 'light' })
await browser.close()
console.log('done')
