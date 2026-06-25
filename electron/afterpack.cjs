/**
 * electron-builder afterPack hook — embed InternalX icon into the Windows EXE.
 *
 * signAndEditExecutable:false skips electron-builder's own rcedit step (avoids
 * the winCodeSign symlink error without Developer Mode). This hook applies the
 * icon and version metadata using rcedit v5's API directly.
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
    console.warn(`[afterPack] EXE not found at ${exePath} — skipping`)
    return
  }

  const iconPath = path.resolve(process.cwd(), 'resources', 'icon.ico')
  if (!fs.existsSync(iconPath)) {
    console.warn(`[afterPack] icon.ico not found at ${iconPath} — skipping`)
    return
  }

  let rceditFn
  try {
    const mod = await import('rcedit')
    rceditFn = mod.rcedit
  } catch (err) {
    console.warn('[afterPack] rcedit import failed:', err.message)
    return
  }

  console.log(`[afterPack] Embedding icon into ${exeName} …`)

  try {
    await rceditFn(exePath, {
      icon: iconPath,
      'file-version': version,
      'product-version': version,
      'version-string': {
        ProductName: productName,
        FileDescription: productName,
        CompanyName: productName,
        InternalName: productName,
        OriginalFilename: exeName,
        LegalCopyright: `Copyright © ${productName}`,
      },
    })
    console.log(`[afterPack] ✓ ${exeName} icon embedded`)
  } catch (err) {
    console.error('[afterPack] rcedit failed:', err.message)
  }
}
