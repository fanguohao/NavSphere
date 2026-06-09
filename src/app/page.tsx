import { NavigationContent } from '@/components/navigation-content'
import { Metadata } from 'next/types'
import { ScrollToTop } from '@/components/ScrollToTop'
import { Container } from '@/components/ui/container'
import type { SiteConfig } from '@/types/site'
import type { NavigationData } from '@/types/navigation'
import { getFileContentPublic } from '@/lib/github'
import { getProcessedData } from '@/lib/data-loader'

export const dynamic = 'force-dynamic'

async function getData() {
  const [navigationRaw, siteDataRaw] = await Promise.all([
    getFileContentPublic('src/navsphere/content/navigation.json'),
    getFileContentPublic('src/navsphere/content/site.json'),
  ])
  return getProcessedData(navigationRaw as any, siteDataRaw as any)
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteData } = await getData()

  return {
    title: siteData.basic.title,
    description: siteData.basic.description,
    keywords: siteData.basic.keywords,
    icons: {
      icon: siteData.appearance.favicon,
    },
  }
}

export default async function HomePage() {
  const { navigationData, siteData } = await getData()

  return (
    <Container>
      <NavigationContent navigationData={navigationData} siteData={siteData} />
      <ScrollToTop />
    </Container>
  )
}
