// README imagery: node scripts/readme-shots.mjs [outDir] [url]  (dev server must be running)
// Set CHROMIUM_PATH to reuse a locally cached browser instead of Playwright's pinned one.
import { mkdir, writeFile } from 'node:fs/promises'
import gifenc from 'gifenc'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const { GIFEncoder, quantize, applyPalette } = gifenc
const [outDir = '.github/readme', url = 'http://localhost:5173'] = process.argv.slice(2)
await mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

async function open({ width = 1280, height = 900, colorScheme = 'light', scale = 2, view } = {}) {
  const page = await browser.newPage({
    viewport: { width, height },
    colorScheme,
    deviceScaleFactor: scale,
  })
  if (view) await page.addInitScript((v) => localStorage.setItem('words-viz:view', v), view)
  await page.goto(url)
  await page.evaluate(() => document.fonts.ready)
  await page.getByRole('button', { name: /Provost/ }).click()
  return page
}

async function analyzed(options) {
  const page = await open(options)
  await page.getByRole('button', { name: 'Show the rhythm' }).click()
  await page.waitForTimeout(4500)
  return page
}

/** Screenshot an element with breathing room around it, mouse parked out of frame. */
async function padded(page, selector, path, pad = 32) {
  await page.mouse.move(0, 0)
  await page.waitForTimeout(250)
  const el = page.locator(selector)
  await el.scrollIntoViewIfNeeded()
  const box = await el.boundingBox()
  const clip = {
    x: box.x - pad,
    y: box.y - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  }
  await page.screenshot({ path, clip })
}

async function stageShot(name, options) {
  const page = await analyzed(options)
  await padded(page, '.stage', `${outDir}/${name}.png`)
  await page.close()
}

// Hero: the analyzed paragraph wearing its pitch colours.
{
  const page = await analyzed({ view: 'score' })
  await page.evaluate(() => window.scrollTo(0, 0))
  await padded(page, '.composer', `${outDir}/hero.png`)
  await page.close()
}

await stageShot('pulse', { view: 'pulse' })
await stageShot('waveform', { view: 'waveform' })
await stageShot('length-mix', { view: 'mix' })
await stageShot('score', { view: 'score' })
await stageShot('pulse-dark', { view: 'pulse', colorScheme: 'dark' })

// Hover: one bar lights up its sentence in the paragraph.
{
  const page = await analyzed({ view: 'pulse', height: 1800 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('.chart .mark').nth(9).hover()
  await page.waitForTimeout(400)
  const top = (await page.locator('.paragraph').boundingBox()).y - 24
  const bottom = await page
    .locator('.chart')
    .evaluate((el) => el.getBoundingClientRect().bottom + 16)
  await page.screenshot({
    path: `${outDir}/hover.png`,
    clip: { x: 0, y: top, width: 1280, height: bottom - top },
  })
  await page.close()
}

// Mobile.
{
  const page = await analyzed({ view: 'pulse', width: 390, height: 844, scale: 3 })
  await padded(page, '.stage', `${outDir}/mobile.png`, 16)
  await page.close()
}

// The flight, as a GIF. A tall viewport keeps paragraph and chart in frame without scrolling.
{
  const size = { width: 1040, height: 1900, scale: 1, view: 'pulse' }
  const probe = await analyzed(size)
  const paragraph = await probe.locator('.paragraph').boundingBox()
  const chart = await probe.locator('.chart').boundingBox()
  const axis = await probe.locator('.chart .axis').first().boundingBox()
  await probe.close()

  // Crop to the content itself: paragraph column on the left, pulse strip on the right.
  const left = paragraph.x - 24
  const right = Math.max(paragraph.x + paragraph.width, axis.x + axis.width) + 24
  const top = paragraph.y - 16
  const clip = {
    x: left,
    y: top,
    width: Math.round(right - left),
    height: Math.round(chart.y + chart.height + 16 - top),
  }
  const page = await open(size)
  const frames = []
  const grab = async () => frames.push({ at: Date.now(), png: await page.screenshot({ clip }) })
  await grab()
  await page.waitForTimeout(500)
  await grab()
  await page.getByRole('button', { name: 'Show the rhythm' }).click()
  const start = Date.now()
  while (Date.now() - start < 3600) await grab()
  await page.waitForTimeout(1200)
  await grab()
  await page.close()

  // Drop frames identical to their predecessor, then every other one; delays absorb the gaps.
  const kept = frames
    .filter((f, i) => i === 0 || !f.png.equals(frames[i - 1].png))
    .filter((_, i, all) => i % 2 === 0 || i === all.length - 1)
  const decoded = kept.map((f) => PNG.sync.read(f.png))
  const palette = quantize(decoded.at(-1).data, 128)
  const gif = GIFEncoder()
  decoded.forEach((img, i) => {
    const next = kept[i + 1]
    const delay = next ? next.at - kept[i].at : 2500
    gif.writeFrame(applyPalette(img.data, palette), img.width, img.height, { palette, delay })
  })
  gif.finish()
  await writeFile(`${outDir}/flight.gif`, gif.bytes())
  console.log(`flight.gif: ${kept.length} of ${frames.length} frames`)
}

await browser.close()
console.log(`wrote ${outDir}`)
