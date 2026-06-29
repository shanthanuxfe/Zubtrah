export type LogoInfo = {
  type: 'clearbit';
  domain: string;
} | {
  type: 'simpleicons';
  slug: string;
  color: string;
} | {
  type: 'initials';
  letter: string;
  bg: string;
  fg: string;
};

// Maps common subscription names to Clearbit domains (real brand favicon/logo service)
const CLEARBIT_DOMAINS: Record<string, string> = {
  netflix: 'netflix.com',
  spotify: 'spotify.com',
  sportify: 'spotify.com',
  youtube: 'youtube.com',
  'youtube premium': 'youtube.com',
  'amazon prime': 'primevideo.com',
  amazon: 'amazon.com',
  'prime video': 'primevideo.com',
  'amazon prime video': 'primevideo.com',
  chatgpt: 'openai.com',
  openai: 'openai.com',
  'chat gpt': 'openai.com',
  canva: 'canva.com',
  notion: 'notion.so',
  figma: 'figma.com',
  apple: 'apple.com',
  'apple tv': 'apple.com',
  'apple tv+': 'apple.com',
  'apple music': 'music.apple.com',
  icloud: 'icloud.com',
  'icloud+': 'icloud.com',
  disney: 'disneyplus.com',
  'disney+': 'disneyplus.com',
  'disney plus': 'disneyplus.com',
  hulu: 'hulu.com',
  hbo: 'hbomax.com',
  'hbo max': 'hbomax.com',
  max: 'max.com',
  microsoft: 'microsoft.com',
  'microsoft 365': 'microsoft.com',
  'office 365': 'office.com',
  'microsoft office': 'office.com',
  google: 'google.com',
  'google one': 'one.google.com',
  'google workspace': 'workspace.google.com',
  dropbox: 'dropbox.com',
  github: 'github.com',
  slack: 'slack.com',
  zoom: 'zoom.us',
  adobe: 'adobe.com',
  'adobe creative cloud': 'adobe.com',
  'creative cloud': 'adobe.com',
  twitch: 'twitch.tv',
  twitter: 'twitter.com',
  x: 'x.com',
  linkedin: 'linkedin.com',
  'linkedin premium': 'linkedin.com',
  duolingo: 'duolingo.com',
  grammarly: 'grammarly.com',
  headspace: 'headspace.com',
  calm: 'calm.com',
  'nytimes': 'nytimes.com',
  'new york times': 'nytimes.com',
  'wall street journal': 'wsj.com',
  wsj: 'wsj.com',
  paramount: 'paramountplus.com',
  'paramount+': 'paramountplus.com',
  peacock: 'peacocktv.com',
  crunchyroll: 'crunchyroll.com',
  'xbox game pass': 'xbox.com',
  xbox: 'xbox.com',
  playstation: 'playstation.com',
  'playstation plus': 'playstation.com',
  'ps plus': 'playstation.com',
  'nintendo switch online': 'nintendo.com',
  nintendo: 'nintendo.com',
  'ea play': 'ea.com',
  steam: 'store.steampowered.com',
  discord: 'discord.com',
  'discord nitro': 'discord.com',
  evernote: 'evernote.com',
  trello: 'trello.com',
  asana: 'asana.com',
  'monday.com': 'monday.com',
  monday: 'monday.com',
  jira: 'atlassian.com',
  atlassian: 'atlassian.com',
  hubspot: 'hubspot.com',
  salesforce: 'salesforce.com',
  shopify: 'shopify.com',
  wix: 'wix.com',
  squarespace: 'squarespace.com',
  wordpress: 'wordpress.com',
  webflow: 'webflow.com',
  mailchimp: 'mailchimp.com',
  sendgrid: 'sendgrid.com',
  twilio: 'twilio.com',
  aws: 'aws.amazon.com',
  'amazon web services': 'aws.amazon.com',
  gcp: 'cloud.google.com',
  'google cloud': 'cloud.google.com',
  azure: 'azure.microsoft.com',
  digitalocean: 'digitalocean.com',
  heroku: 'heroku.com',
  netlify: 'netlify.com',
  vercel: 'vercel.com',
  cloudflare: 'cloudflare.com',
  dashlane: 'dashlane.com',
  '1password': '1password.com',
  lastpass: 'lastpass.com',
  nordvpn: 'nordvpn.com',
  expressvpn: 'expressvpn.com',
  vpn: 'nordvpn.com',
  malwarebytes: 'malwarebytes.com',
  norton: 'norton.com',
  mcafee: 'mcafee.com',
  avast: 'avast.com',
  proton: 'proton.me',
  'proton mail': 'proton.me',
  protonmail: 'proton.me',
  'proton vpn': 'protonvpn.com',
};

const INITIALS_PALETTE: { bg: string; fg: string }[] = [
  { bg: '#1A1A1A', fg: '#FFFFFF' },
  { bg: '#1A6B5A', fg: '#FFFFFF' },
  { bg: '#2D3748', fg: '#FFFFFF' },
  { bg: '#9333EA', fg: '#FFFFFF' },
  { bg: '#1D4ED8', fg: '#FFFFFF' },
  { bg: '#DC2626', fg: '#FFFFFF' },
  { bg: '#D97706', fg: '#FFFFFF' },
  { bg: '#0891B2', fg: '#FFFFFF' },
  { bg: '#059669', fg: '#FFFFFF' },
  { bg: '#7C3AED', fg: '#FFFFFF' },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

export function getLogoInfo(name: string): LogoInfo {
  const key = name.trim().toLowerCase();

  // Exact match first
  const domain = CLEARBIT_DOMAINS[key];
  if (domain) return { type: 'clearbit', domain };

  // Try matching any word in the name
  const words = key.split(/\s+/);
  for (const word of words) {
    const wordDomain = CLEARBIT_DOMAINS[word];
    if (wordDomain) return { type: 'clearbit', domain: wordDomain };
  }

  // Partial match — check if any known key is contained in the input
  for (const [knownKey, knownDomain] of Object.entries(CLEARBIT_DOMAINS)) {
    if (key.includes(knownKey) || knownKey.includes(key)) {
      return { type: 'clearbit', domain: knownDomain };
    }
  }

  // Fall back to initials
  const palette = INITIALS_PALETTE[hashString(name) % INITIALS_PALETTE.length];
  const nameWords = name.trim().split(/\s+/);
  const letter =
    nameWords.length === 1
      ? nameWords[0].slice(0, 2).toUpperCase()
      : (nameWords[0][0] + nameWords[1][0]).toUpperCase();
  return { type: 'initials', letter, bg: palette.bg, fg: palette.fg };
}

// Clearbit logo URL — high-quality PNG via their Logo API
export function clearbitLogoUrl(domain: string, size = 128): string {
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}
