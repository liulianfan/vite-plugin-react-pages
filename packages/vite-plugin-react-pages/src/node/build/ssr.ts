import { ssrBuild as viteSSRBuild, build as viteBuild, UserConfig } from 'vite'
import * as path from 'path'
import * as fs from 'fs-extra'

import { CLIENT_PATH } from '../constants'

export async function ssrBuild(viteOptions: UserConfig) {
  let { outDir = 'dist' } = viteOptions
  outDir = path.resolve(process.cwd(), outDir)
  await fs.emptyDir(outDir)

  const ssrOutDir = path.join(outDir, 'ssr-tmp')
  const clientOutDir = path.join(outDir, 'client-tmp')

  console.log('\n\npreparing vite pages ssr bundle...')
  await viteSSRBuild({
    ...viteOptions,
    rollupInputOptions: {
      ...viteOptions.rollupInputOptions,
      input: path.join(CLIENT_PATH, 'ssr', 'serverRender.js'),
      preserveEntrySignatures: 'strict',
      // TODO: don't hard code this
      external: ['react', 'react-router-dom', 'react-dom', 'react-dom/server'],
    },
    outDir: ssrOutDir,
  })

  console.log('\n\nrendering html...')

  const { renderToString, ssrData } = require(path.join(
    ssrOutDir,
    'serverRender.js'
  ))

  const pagePaths = Object.keys(ssrData)

  console.log('\n\npreparing vite pages client bundle...')
  const clientResult = await viteBuild({
    ...viteOptions,
    rollupInputOptions: {
      ...viteOptions.rollupInputOptions,
      input: path.join(CLIENT_PATH, 'ssr', 'clientRender.js'),
      preserveEntrySignatures: 'strict',
    },
    assetsDir: '_assets',
    outDir: clientOutDir,
  })

  const mapPagePublicPathToDataPublicPath = clientResult.assets.reduce(
    (acc, asset, index) => {
      if (asset.type === 'chunk') {
        const match = asset.facadeModuleId?.match(/^\/@generated\/pages\/(.*)$/)
        if (match) {
          let pagePublicPath = '/' + match[1]
          if (pagePublicPath === '/__rootIndex__') pagePublicPath = '/'
          let basePath = viteOptions.base ?? ''
          basePath = basePath.replace(/\/$/, '')
          acc[pagePublicPath] = path.join(`${basePath}/_assets`, asset.fileName)
        }
      }
      return acc
    },
    {} as Record<string, string>
  )

  // remove the default html emitted by vite
  await fs.remove(path.join(clientOutDir, 'index.html'))
  await Promise.all(
    pagePaths.map(async (pagePath) => {
      const ssrContent = renderToString(pagePath)
      if (!clientResult.html?.includes('<div id="root"></div>')) {
        throw new Error(
          `Your index.html should contain "<div id="root"></div>"`
        )
      }
      const pageDataPublicPath = mapPagePublicPathToDataPublicPath[pagePath]
      if (!pageDataPublicPath) {
        throw new Error(`can not find pageDataPublicPath for "${pagePath}"`)
      }
      const ssrInfo = {
        pagePublicPath: pagePath,
        pageData: pageDataPublicPath,
      }
      let html = clientResult.html.replace(
        '<div id="root"></div>',
        // let client know the current ssr page
        `<script>window._vitePagesSSR=${JSON.stringify(ssrInfo)};</script>
<div id="root">${ssrContent}</div>`
      )
      // preload data module for this page
      html = injectPreload(html, ssrInfo.pageData)
      const writePath = path.join(clientOutDir, pagePath.slice(1), 'index.html')
      await fs.ensureDir(path.dirname(writePath))
      await fs.writeFile(writePath, html)
    })
  )

  // move 404 page to `/` if `/` doesn't exists
  const html404 = path.join(clientOutDir, '404', 'index.html')
  if (!pagePaths.includes('/') && (await fs.pathExists(html404))) {
    await fs.copy(html404, path.join(clientOutDir, 'index.html'))
  }

  await fs.copy(clientOutDir, outDir)
  await fs.remove(clientOutDir)
  await fs.remove(ssrOutDir)
  console.log('vite pages ssr build finished successfully.')
}

const injectPreload = (html: string, filePath: string) => {
  const tag = `<link rel="modulepreload" href="${filePath}" />`
  if (/<\/head>/.test(html)) {
    return html.replace(/<\/head>/, `${tag}\n</head>`)
  } else {
    return tag + '\n' + html
  }
}