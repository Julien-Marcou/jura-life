import { writeFileSync } from 'fs';

import { JURA_POINTS_OF_INTEREST } from './src/app/constants/jura-points-of-interest.constants';

const xml = (strings: TemplateStringsArray, ...values: unknown[]): string => {
  let result = '';
  for (let i = 0; i < values.length; i++) {
    result += strings[i];
    const value = values[i];
    if (value instanceof Array) {
      result += value.join('');
    }
    else {
      result += `${value}`;
    }
  }
  result += strings[values.length];
  return result;
};

const sitemapBaseUrl = 'https://jura.life/';

const sitemapContent = xml`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${sitemapBaseUrl}</loc>
    <priority>1.00</priority>
  </url>${Object.keys(JURA_POINTS_OF_INTEREST).map((id) => xml`
  <url>
    <loc>${sitemapBaseUrl}?poi=${id}</loc>
    <priority>0.30</priority>
  </url>`)}
</urlset>`;

const sitemapFile = `${__dirname}/dist/jura-life/browser/sitemap.xml`;
writeFileSync(sitemapFile, sitemapContent);
