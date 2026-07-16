/**
 * Embed node specification.
 *
 * Supports embedding external content like YouTube videos, Twitter posts,
 * CodePen, Figma, and other embed providers.
 *
 * @module
 */

import type { NodeSpec } from 'prosemirror-model';

import { getBlockIdAttrs, blockIdToDOM, safeParseInt } from '../blockIdAttrs';
import { sanitizeEmbedUrl } from '../sanitizeUrl';

/**
 * Supported embed providers.
 */
export type EmbedProvider =
  | 'youtube'
  | 'vimeo'
  | 'twitter'
  | 'codepen'
  | 'codesandbox'
  | 'figma'
  | 'loom'
  | 'spotify'
  | 'soundcloud'
  | 'generic';

/**
 * List of valid embed providers, used to validate parsed attributes.
 */
const EMBED_PROVIDERS: readonly EmbedProvider[] = [
  'youtube',
  'vimeo',
  'twitter',
  'codepen',
  'codesandbox',
  'figma',
  'loom',
  'spotify',
  'soundcloud',
  'generic',
];

function isEmbedProvider(value: string | null): value is EmbedProvider {
  return value !== null && (EMBED_PROVIDERS as readonly string[]).includes(value);
}

/** Aspect ratio must look like '16:9', '4:3', etc. */
const ASPECT_RATIO_RE = /^\d+:\d+$/;

function sanitizeAspectRatio(value: string | null | undefined): string {
  return value && ASPECT_RATIO_RE.test(value) ? value : '16:9';
}

/**
 * Sanitizes the width attribute: a positive integer (pixels) or a
 * percentage string like '50%'. Anything else becomes null (auto).
 */
function sanitizeWidth(value: unknown): number | string | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string') {
    if (/^\d+(\.\d+)?%$/.test(value)) return value;
    return safeParseInt(value, null);
  }
  return null;
}

/**
 * Embed node for external content.
 *
 * Renders as an iframe or embedded widget based on the provider.
 * Iframe sources are restricted to known provider URLs; 'generic' embeds
 * only accept absolute http(s) URLs.
 */
export const embedNode: NodeSpec = {
  group: 'block',
  atom: true,
  draggable: true,
  attrs: {
    id: { default: null },
    /** The original URL of the embed */
    url: { default: '' },
    /** The embed provider (youtube, twitter, etc.) */
    provider: { default: 'generic' as EmbedProvider },
    /** The embed ID extracted from the URL (video ID, tweet ID, etc.) */
    embedId: { default: '' },
    /** Optional caption */
    caption: { default: '' },
    /** Width in pixels or percentage */
    width: { default: null as number | string | null },
    /** Aspect ratio (e.g., '16:9', '4:3') */
    aspectRatio: { default: '16:9' },
  },
  parseDOM: [
    {
      tag: 'figure.openblock-embed',
      getAttrs: (dom) => {
        const element = dom as HTMLElement;
        const provider = element.getAttribute('data-provider');
        return {
          ...getBlockIdAttrs(element),
          url: element.getAttribute('data-url') || '',
          provider: isEmbedProvider(provider) ? provider : 'generic',
          embedId: element.getAttribute('data-embed-id') || '',
          caption: element.querySelector('figcaption')?.textContent || '',
          width: sanitizeWidth(element.getAttribute('data-width')),
          aspectRatio: sanitizeAspectRatio(element.getAttribute('data-aspect-ratio')),
        };
      },
    },
  ],
  toDOM: (node) => {
    const { url, caption } = node.attrs;
    // Attrs can come from JSON (not only parseDOM), so re-validate here.
    const provider: EmbedProvider = isEmbedProvider(node.attrs.provider)
      ? node.attrs.provider
      : 'generic';
    const embedId = node.attrs.embedId;
    const aspectRatio = sanitizeAspectRatio(node.attrs.aspectRatio);
    const width = sanitizeWidth(node.attrs.width);
    const embedUrl = getEmbedUrl(provider, embedId, url);

    const style = width ? `max-width: ${typeof width === 'number' ? `${width}px` : width}` : '';

    return [
      'figure',
      {
        class: `openblock-embed openblock-embed--${provider}`,
        ...blockIdToDOM(node),
        'data-url': url,
        'data-provider': provider,
        'data-embed-id': embedId,
        'data-aspect-ratio': aspectRatio,
        ...(width ? { 'data-width': String(width) } : {}),
        style,
      },
      [
        'div',
        {
          class: 'openblock-embed-container',
          style: `aspect-ratio: ${aspectRatio.replace(':', '/')}`,
        },
        embedUrl
          ? [
              'iframe',
              {
                src: embedUrl,
                frameborder: '0',
                allowfullscreen: 'true',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                sandbox: 'allow-scripts allow-same-origin allow-presentation allow-popups',
                referrerpolicy: 'strict-origin-when-cross-origin',
                loading: 'lazy',
              },
            ]
          : [
              'div',
              { class: 'openblock-embed-placeholder' },
              ['span', { class: 'openblock-embed-placeholder-text' }, 'Paste a URL to embed'],
            ],
      ],
      ...(caption
        ? [['figcaption', { class: 'openblock-embed-caption' }, caption]]
        : []),
    ];
  },
};

/**
 * Gets the embed URL for a given provider and embed ID.
 *
 * For the 'generic' provider, only absolute http(s) URLs are allowed
 * (anything else renders the placeholder instead of an iframe).
 */
function getEmbedUrl(provider: EmbedProvider, embedId: string, originalUrl: string): string {
  if (!embedId && !originalUrl) return '';

  switch (provider) {
    case 'youtube':
      return `https://www.youtube.com/embed/${embedId}`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${embedId}`;
    case 'twitter':
      // Twitter embeds use their widget script, not iframe
      return '';
    case 'codepen':
      return `https://codepen.io/${embedId}/embed/preview`;
    case 'codesandbox':
      return `https://codesandbox.io/embed/${embedId}`;
    case 'figma':
      return `https://www.figma.com/embed?embed_host=openblock&url=${encodeURIComponent(originalUrl)}`;
    case 'loom':
      return `https://www.loom.com/embed/${embedId}`;
    case 'spotify':
      return `https://open.spotify.com/embed/${embedId}`;
    case 'soundcloud':
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(originalUrl)}&auto_play=false`;
    case 'generic':
    default:
      return sanitizeEmbedUrl(originalUrl) ?? '';
  }
}

/**
 * Parses a URL and extracts embed information.
 *
 * Only absolute http(s) URLs are considered embeddable; other schemes
 * (javascript:, data:, etc.) return null.
 *
 * @param url - The URL to parse
 * @returns Provider and embed ID, or null if not recognized
 */
export function parseEmbedUrl(url: string): { provider: EmbedProvider; embedId: string } | null {
  // Never fall back to 'generic' for non-http(s) URLs
  if (sanitizeEmbedUrl(url) === null) return null;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');

    // YouTube
    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
      let videoId = '';
      if (hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
        // Handle /embed/ URLs
        if (!videoId && urlObj.pathname.startsWith('/embed/')) {
          videoId = urlObj.pathname.split('/embed/')[1];
        }
      }
      if (videoId) {
        return { provider: 'youtube', embedId: videoId };
      }
    }

    // Vimeo
    if (hostname === 'vimeo.com') {
      const match = urlObj.pathname.match(/\/(\d+)/);
      if (match) {
        return { provider: 'vimeo', embedId: match[1] };
      }
    }

    // Twitter/X
    if (hostname === 'twitter.com' || hostname === 'x.com') {
      const match = urlObj.pathname.match(/\/\w+\/status\/(\d+)/);
      if (match) {
        return { provider: 'twitter', embedId: match[1] };
      }
    }

    // CodePen
    if (hostname === 'codepen.io') {
      const match = urlObj.pathname.match(/\/(\w+)\/pen\/(\w+)/);
      if (match) {
        return { provider: 'codepen', embedId: `${match[1]}/pen/${match[2]}` };
      }
    }

    // CodeSandbox
    if (hostname === 'codesandbox.io') {
      const match = urlObj.pathname.match(/\/s\/([^/]+)/);
      if (match) {
        return { provider: 'codesandbox', embedId: match[1] };
      }
    }

    // Figma
    if (hostname === 'figma.com') {
      if (urlObj.pathname.includes('/file/') || urlObj.pathname.includes('/proto/')) {
        return { provider: 'figma', embedId: url };
      }
    }

    // Loom
    if (hostname === 'loom.com') {
      const match = urlObj.pathname.match(/\/share\/([^/]+)/);
      if (match) {
        return { provider: 'loom', embedId: match[1] };
      }
    }

    // Spotify
    if (hostname === 'open.spotify.com') {
      const match = urlObj.pathname.match(/\/(track|album|playlist|episode)\/([^/]+)/);
      if (match) {
        return { provider: 'spotify', embedId: `${match[1]}/${match[2]}` };
      }
    }

    // SoundCloud
    if (hostname === 'soundcloud.com') {
      return { provider: 'soundcloud', embedId: url };
    }

    // Generic http(s) URL - try to embed as iframe
    return { provider: 'generic', embedId: url };
  } catch {
    return null;
  }
}
