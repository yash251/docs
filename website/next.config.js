import nextra from 'nextra'

const env = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  ORIGIN: process.env.ORIGIN,
  BASE_PATH: process.env.BASE_PATH,
  ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
  ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
  MIXPANEL_TOKEN:
    process.env.NODE_ENV === 'production'
      ? process.env.ENVIRONMENT === 'production'
        ? 'cfeac8baf33c9b4d255f28d57f3c9148' // production
        : 'e57a9892339b2acfd02943c86b746d32' // staging
      : '', // local dev (no tracking)
  GOOGLE_ANALYTICS_MEASUREMENT_ID: process.env.NODE_ENV === 'production' ? 'G-5MK48LFNKY' : '',
}

const withNextra = nextra({
  theme: '@graphprotocol/nextra-theme',
  staticImage: true,
  flexsearch: false,
  codeHighlight: false,
  defaultShowCopyCode: false,
  readingTime: true,
  transform(result, { route }) {
    if (route && !result.includes('getStaticProps')) {
      const banner = `
import { getPageMap } from '@/src/getPageMap'

export const getStaticProps = async context => ({
  props: {
    __nextra_pageMap: await getPageMap('${route.split('/')[1]}')
  }
})`
      result += banner
    }
    return result
  },
})

/** @type {import('next').NextConfig} */
export default withNextra({
  env,
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../out/docs' : undefined,
  experimental: {
    // Fix scroll restoration (see https://github.com/vercel/next.js/issues/37893#issuecomment-1221335543)
    scrollRestoration: true,
  },
  pageExtensions: ['tsx'],
  reactStrictMode: true,
  basePath: env.BASE_PATH,
  trailingSlash: true,
  redirects: () => [
    {
      source: '/',
      destination: '/en/',
      permanent: true,
    },
    // If we ever change `output` to not be `export`, we should move all the redirects from `nginx.conf` here
  ],
  images: {
    unoptimized: true,
  },
})
