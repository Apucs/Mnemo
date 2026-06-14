import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Mnemo/1.0; +https://mnemo.app)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    const html = await response.text();

    let title = '';
    let description = '';
    let image = '';
    let siteName = '';

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].trim();

    // Extract meta tags — match all variants: <meta ...>, <meta .../>, <meta ... />
    const tags = html.match(/<meta\s[^>]+>/gi) || [];
    for (const tag of tags) {
      const propMatch = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i);
      const contMatch = tag.match(/content\s*=\s*["']([^"']+)["']/i);
      if (!propMatch || !contMatch) continue;

      const prop = propMatch[1].toLowerCase();
      const cont = contMatch[1];

      switch (prop) {
        case 'og:title': title = cont; break;
        case 'og:description': description = cont; break;
        case 'og:image': image = cont; break;
        case 'og:site_name': siteName = cont; break;
        case 'description': if (!description) description = cont; break;
      }
    }

    // Resolve relative image URLs
    if (image && !image.startsWith('http')) {
      const base = new URL(url);
      image = image.startsWith('/') ? `${base.origin}${image}` : `${base.origin}/${image}`;
    }

    // Favicon
    let favicon = '';
    const iconTag = html.match(/<link[^>]+rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]+>/i);
    if (iconTag) {
      const hrefMatch = iconTag[0].match(/href\s*=\s*["']([^"']+)["']/i);
      if (hrefMatch) {
        favicon = hrefMatch[1];
        if (!favicon.startsWith('http')) {
          const base = new URL(url);
          favicon = favicon.startsWith('/') ? `${base.origin}${favicon}` : `${base.origin}/${favicon}`;
        }
      }
    }
    if (!favicon) favicon = `${new URL(url).origin}/favicon.ico`;

    const hostname = new URL(url).hostname;

    return NextResponse.json({
      title: title || hostname,
      description,
      image,
      siteName: siteName || hostname,
      favicon,
    });
  } catch {
    const hostname = new URL(url).hostname;
    return NextResponse.json({
      title: hostname,
      description: '',
      image: '',
      siteName: hostname,
      favicon: `${new URL(url).origin}/favicon.ico`,
    });
  }
}
