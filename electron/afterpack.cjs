/**
 * electron-builder afterPack hook — runs after packaging, before installer creation.
 *
 * electron-builder's signAndEditExecutable:false skips its own rcedit step
 * (needed to avoid the winCodeSign symlink error on Windows without Developer Mode).
 * This hook applies the icon and version metadata ourselves using the rcedit npm
 * package so the final EXE shows InternalX branding instead of Electron defaults.
 */

'use strict'

const path = require('path')
const fs   = require('fs')

/**
 * @param {import('electron-builder').AfterPackContext} context
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return

  const productName = context.packager.appInfo.productName
  const version     = context.packager.appInfo.version
  const exeName     = `${productName}.exe`
  const exePath     = path.join(context.appOutDir, exeName)

  if (!fs.existsSync(exePath)) {
    console.warn(`[afterPack] EXE not found at ${exePath} — skipping icon set`)
    return
  }

  const iconPath = path.resolve(process.cwd(), 'resources', 'icon.ico')
  if (!fs.existsSync(iconPath)) {
    console.warn(`[afterPack] icon.ico not found at ${iconPath} — skipping icon set`)
    return
  }

  let rcedit
  try {
    rcedit = require('rcedit').rcedit
  } catch {
    console.warn('[afterPack] rcedit module not found — icon will not be embedded in EXE')
    return
  }

  console.log(`[afterPack] Setting icon and version on ${exeName} …`)

  try {
    await rcedit(exePath, {
      icon: iconPath,
      'product-name':       productName,
      'file-description':   productName,
      'company-name':       productName,
      'internal-name':      productName,
      'original-filename':  exeName,
      'file-version':       version,
      'product-version':    version,
    })
    console.log(`[afterPack] ✓ ${exeName} icon and version info updated`)
  } catch (err) {
    console.error('[afterPack] rcedit failed:', err.message)
  }
}
