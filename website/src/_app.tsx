import { DocSearch } from '@graphprotocol/nextra-theme'
import mixpanel from 'mixpanel-browser'
import type { AppProps } from 'next/app'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { DefaultSeo } from 'next-seo'
import type { PropsWithChildren } from 'react'
import googleAnalytics from 'react-ga4'

import {
  AnalyticsProvider,
  type ButtonOrLinkProps,
  defaultLocale,
  ExperimentalLocaleSwitcher,
  extractLocaleFromPath,
  extractLocaleFromRouter,
  GDSProvider,
  I18nProvider,
  Layout as GDSLayout,
  Link,
  type NestedStrings,
} from '@edgeandnode/gds'
import { CookieBanner, GlobalFooter, MarketingNavbar } from '@edgeandnode/go'

import { supportedLocales, translations, useI18n } from '@/i18n'

import '@edgeandnode/gds/style.css'
import '@docsearch/css'

const internalAbsoluteHrefRegex = /^(((https?:)?\/\/((www|staging)\.)?thegraph\.com)?\/docs\/|\/(?!\/))/i
const externalHrefRegex = /^(?!(https?:)?\/\/((www|staging)\.)?thegraph\.com)([a-zA-Z0-9+.-]+:)?\/\//i

const removeBasePathFromUrl = (url: string) => url.substring((process.env.BASE_PATH ?? '').length)

const DocSearchHit = ({ hit, children }: PropsWithChildren<{ hit: { url: string } }>) => (
  <Link.Unstyled href={removeBasePathFromUrl(hit.url)}>{children}</Link.Unstyled>
)

function MyApp({ Component, router, pageProps }: AppProps) {
  const hideLocaleSwitcher = pageProps.hideLocaleSwitcher ?? false
  const { locale } = extractLocaleFromRouter(router, supportedLocales)

  return (
    <>
      <DefaultSeo
        title="Docs | The Graph"
        description="Browse the latest developer documentation including API reference, articles, and sample code"
        openGraph={{
          type: 'website',
          locale: locale ?? defaultLocale,
          url: 'https://thegraph.com/',
          siteName: 'The Graph',
          images: [
            {
              url: 'https://thegraph-docs-opengraph-image.the-guild.dev',
              alt: 'The Graph',
            },
          ],
        }}
        twitter={{
          handle: '@graphprotocol',
          site: '@graphprotocol',
          cardType: 'summary_large_image',
        }}
      />
      <GDSProvider
        clientRouter={router}
        clientLink={NextLink}
        mapButtonOrLinkProps={(props) => {
          // Only continue if `href` is set to a string that is not an anchor on the same page
          if (!props.href || typeof props.href === 'object' || props.href.startsWith('#')) {
            return props
          }

          let { href, target } = props as ButtonOrLinkProps.ExternalLinkProps

          // If the link is internal and absolute, ensure `href` is relative to the base path (i.e. starts with `/`,
          // not `/docs/` or `https://...`) and includes a locale (by prepending the current locale if there is none)
          const internalAbsoluteHrefMatches = internalAbsoluteHrefRegex.exec(href)
          if (internalAbsoluteHrefMatches) {
            href = href.substring(internalAbsoluteHrefMatches[0].length - 1)
            const { locale: pathLocale, pathWithoutLocale } = extractLocaleFromPath(href, supportedLocales)
            href = `/${pathLocale ?? locale ?? defaultLocale}${pathWithoutLocale}`
          }

          // If the link is external, default the target to `_blank`
          if (externalHrefRegex.test(href)) {
            target = target ?? '_blank'
          }

          return { ...props, href, target }
        }}
        useThemeUI
      >
        <I18nProvider supportedLocales={supportedLocales} translations={translations}>
          <AnalyticsProvider
            app="DOCS"
            mixpanel={{
              sdk: mixpanel,
              token: process.env.MIXPANEL_TOKEN ?? null,
            }}
            googleAnalytics={{
              sdk: googleAnalytics,
              measurementId: process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID ?? null,
            }}
          >
            <Layout showLocaleSwitcher={!hideLocaleSwitcher}>
              <Component {...pageProps} />
            </Layout>
          </AnalyticsProvider>
        </I18nProvider>
      </GDSProvider>
    </>
  )
}

function Layout({ showLocaleSwitcher, children }: PropsWithChildren<{ showLocaleSwitcher: boolean }>) {
  const router = useRouter()
  const { t, translations, locale } = useI18n()

  return (
    <>
      <div sx={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
        <div
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            minHeight: '768px',
            backgroundImage: `url('${process.env.BASE_PATH ?? ''}/img/page-background.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            '@media (min-width: 1440px)': {
              aspectRatio: '1440/768',
            },
          }}
        />
      </div>
      <GDSLayout
        header={
          <MarketingNavbar
            children={(defaultChildren) => (
              <>
                {defaultChildren}
                {showLocaleSwitcher ? <ExperimentalLocaleSwitcher className="sm:hidden" /> : null}
              </>
            )}
            contentAfter={(defaultContentAfter) => (
              <>
                <DocSearch
                  apiKey={process.env.ALGOLIA_API_KEY ?? ''}
                  appId={process.env.ALGOLIA_APP_ID ?? ''}
                  indexName="thegraph-docs"
                  searchParameters={{
                    facetFilters: [`language:${locale}`],
                  }}
                  disableUserPersonalization={true}
                  transformItems={(items: any) =>
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    items.map((item: any) => ({
                      ...item,
                      url: item.url.replace('https://thegraph.com/docs', process.env.BASE_PATH ?? ''),
                    }))
                  }
                  hitComponent={DocSearchHit}
                  navigator={{
                    navigate({ itemUrl }: { itemUrl: string }) {
                      void router.push(removeBasePathFromUrl(itemUrl))
                    },
                    navigateNewTab({ itemUrl }: { itemUrl: string }) {
                      const windowReference = window.open(itemUrl, '_blank', 'noopener')
                      if (windowReference) {
                        windowReference.focus()
                      }
                    },
                    navigateNewWindow({ itemUrl }: { itemUrl: string }) {
                      window.open(itemUrl, '_blank', 'noopener')
                    },
                  }}
                  translations={translations.docsearch as NestedStrings}
                  placeholder={t('docsearch.button.buttonText')}
                />
                {showLocaleSwitcher ? (
                  <ExperimentalLocaleSwitcher className="prop-display-format-short max-sm:hidden xl:prop-display-format-full" />
                ) : null}
                {defaultContentAfter}
              </>
            )}
          />
        }
        headerSticky
        footer={<GlobalFooter showLogo={true} showLocaleSwitcher={showLocaleSwitcher} />}
      >
        <CookieBanner />
        {children}
      </GDSLayout>
    </>
  )
}

export default MyApp
