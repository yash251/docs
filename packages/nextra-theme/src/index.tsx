import merge from 'lodash/merge'
import { NextSeo, type NextSeoProps } from 'next-seo'
import type { NextraThemeLayoutProps } from 'nextra'
import { useFSRoute } from 'nextra/hooks'
import { MDXProvider } from 'nextra/mdx'
import { normalizePages } from 'nextra/normalize-pages'
import { type ReactElement, useCallback, useMemo } from 'react'
import { useSet } from 'react-use'
import type { ThemeUICSSObject } from 'theme-ui'

import { Divider, type DividerProps, Flex, Icon, Spacing, useI18n } from '@edgeandnode/gds'

import {
  Callout,
  CodeBlock,
  CodeInline,
  Difficulty,
  DocSearch,
  EditPageLink,
  Heading,
  Image,
  LinkInline,
  ListItem,
  ListOrdered,
  ListUnordered,
  Paragraph,
  Table,
  VideoEmbed,
} from '@/components'
import { DocumentContext, MDXLayoutNav, MDXLayoutOutline, MDXLayoutPagination, NavContext } from '@/layout'

const mdxComponents = {
  blockquote: Callout,
  pre: CodeBlock,
  code: CodeInline,
  hr: (props: DividerProps) => <Divider sx={{ my: Spacing['32px'] }} {...props} />,
  h1: Heading.H1,
  h2: Heading.H2,
  h3: Heading.H3,
  h4: Heading.H4,
  h5: Heading.H5,
  h6: Heading.H6,
  img: Image,
  a: LinkInline,
  li: ListItem,
  ol: ListOrdered,
  ul: ListUnordered,
  p: Paragraph,
  table: Table,
  Callout,
  CodeBlock,
  CodeInline,
  Difficulty,
  Heading,
  Image,
  LinkInline,
  ListItem,
  ListOrdered,
  ListUnordered,
  Paragraph,
  Table,
  VideoEmbed,
}

const mdxStyles: ThemeUICSSObject = {
  overflowWrap: 'break-word',
  'img + em': {
    mt: Spacing['16px'],
    display: 'block',
    textAlign: 'center',
  },
}

export {
  Callout,
  CodeBlock,
  CodeInline,
  Difficulty,
  DocSearch,
  Heading,
  Image,
  LinkInline,
  ListItem,
  ListOrdered,
  ListUnordered,
  Paragraph,
  Table,
  VideoEmbed,
}

export default function NextraLayout({ children, pageOpts, pageProps }: NextraThemeLayoutProps): ReactElement {
  const { frontMatter, filePath, pageMap, headings, title, timestamp, readingTime } = pageOpts
  const { locale, defaultLocale } = useI18n<any>()
  const fsPath = useFSRoute()

  const args = useMemo(() => {
    const result = normalizePages({
      list: pageMap,
      locale,
      defaultLocale,
      route: fsPath,
    })
    if (typeof window === 'undefined') {
      // Execute this check for sidebar links only on server, will be stripped from client build
      const checkIfRouteExists = (item: (typeof result.docsDirectories)[number], baseRoute = '') => {
        const expectedRoute = `${baseRoute}/${item.name}`
        // TODO: When a page doesn't exist in languages other than English, `item.route` is `#` for some reason
        if (item.type === 'doc' && !item.route) {
          throw new Error(`Route "${expectedRoute}" does not exist. Remove this field from _meta.js file`)
        }
        if (item.children) {
          for (const child of item.children) {
            checkIfRouteExists(child, item.route)
          }
        }
      }
      result.docsDirectories.forEach((item) => checkIfRouteExists(item))
    }
    return result
  }, [defaultLocale, fsPath, locale, pageMap])

  // Provide `markOutlineItem` to the `DocumentContext` so child `Heading` components can mark outline items as "in or above view" or not
  const [
    ,
    { add: markOutlineItemAsInOrAboveView, remove: markOutlineItemAsNotInOrAboveView, has: outlineItemIsInOrAboveView },
  ] = useSet(new Set<string>([]))

  const markOutlineItem = useCallback(
    (id: string, inOrAboveView: boolean) => {
      if (inOrAboveView) {
        markOutlineItemAsInOrAboveView(id)
      } else {
        markOutlineItemAsNotInOrAboveView(id)
      }
    },
    [markOutlineItemAsInOrAboveView, markOutlineItemAsNotInOrAboveView],
  )
  // Compute `highlightedOutlineItemId` for the `DocumentContext` based on outline items that have been marked as "in or above view"
  const highlightedOutlineItemId = useMemo(() => {
    let _highlightedOutlineItemId = null
    for (const heading of headings) {
      if (heading.depth <= 3 && outlineItemIsInOrAboveView(heading.id)) {
        _highlightedOutlineItemId = heading.id
      }
    }
    return _highlightedOutlineItemId
  }, [headings, outlineItemIsInOrAboveView])

  let seo: NextSeoProps = {
    title: `${title ? `${title} | ` : ''}Docs | The Graph`,
    description: frontMatter.description,
    openGraph: {
      title,
      images: [
        {
          url:
            frontMatter.socialImage || `https://thegraph-docs-opengraph-image.the-guild.dev?title=${encodeURI(title)}`,
        },
      ],
    },
  }
  if (frontMatter.seo) {
    seo = merge(seo, frontMatter.seo)
  }

  const lastUpdated = timestamp ? new Date(timestamp) : null

  return (
    <NavContext.Provider value={{ filePath: pageProps.remoteFilePath || filePath, ...args }}>
      <DocumentContext.Provider value={{ frontMatter, headings, markOutlineItem, highlightedOutlineItemId }}>
        <NextSeo {...seo} />

        <div
          sx={{
            display: ['flex', null, null, 'grid'],
            flexDirection: 'column',
            gridTemplateColumns: '224px auto 224px',
          }}
        >
          <div
            sx={{
              display: ['none', null, null, 'block'],
              marginInlineStart: '-8px',
              marginInlineEnd: '16px',
            }}
          >
            <MDXLayoutNav />
          </div>

          <div sx={{ pt: [null, null, null, Spacing['24px']] }}>
            <div sx={{ display: [null, null, null, 'none'], mb: Spacing['32px'] }}>
              <MDXLayoutNav mobile />
            </div>

            <article className="graph-docs-content" sx={mdxStyles}>
              {args.activePath.length > 1 ? (
                <div className="graph-docs-current-group" sx={{ display: 'none' }}>
                  {args.activePath.map((item) => item.title).join(' > ')}
                </div>
              ) : null}
              {frontMatter.title || args.activeIndex === 0 ? (
                <Heading.H1>{args.activeIndex === 0 ? 'The Graph Docs' : frontMatter.title}</Heading.H1>
              ) : null}
              {lastUpdated || readingTime ? (
                <Paragraph size="14px">
                  {lastUpdated ? (
                    <span>
                      <span sx={{ color: 'White64' }}>Last updated:</span>{' '}
                      <time dateTime={lastUpdated.toISOString()}>
                        {lastUpdated.toLocaleDateString(locale, {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </span>
                  ) : null}
                  <span
                    sx={{
                      mx: Spacing['16px'],
                      display: 'inline-block',
                      verticalAlign: 'top',
                      width: '1px',
                      height: '20px',
                      bg: 'White16',
                      '&:not(span + span), &:not(:has(+ span))': {
                        display: 'none',
                      },
                    }}
                  />
                  {(readingTime?.minutes ?? 0) > 0 ? (
                    <span>
                      <span sx={{ color: 'White64' }}>Reading time:</span> {Math.ceil(readingTime!.minutes)} min
                    </span>
                  ) : null}
                </Paragraph>
              ) : null}
              <MDXProvider components={mdxComponents}>{children}</MDXProvider>
            </article>

            <Flex.Row sx={{ display: [null, null, null, 'none'], mt: Spacing['48px'] }}>
              <EditPageLink mobile />
            </Flex.Row>

            <div sx={{ mt: Spacing['64px'] }}>
              <MDXLayoutPagination />
            </div>
          </div>

          <div
            sx={{
              display: ['none', null, null, 'block'],
              marginInlineStart: '32px',
              marginInlineEnd: '-8px',
            }}
          >
            <MDXLayoutOutline />
          </div>
        </div>
      </DocumentContext.Provider>
    </NavContext.Provider>
  )
}
