import { writeFileSync, readFileSync } from 'fs';
import { JURA_POINTS_OF_INTEREST } from './src/app/constants/jura-points-of-interest.constants';

const xml = (strings: TemplateStringsArray, ...values: Array<unknown>): string => {
  let result = '';
  for (let i = 0; i < values.length; i++) {
    result += strings[i];
    const value = values[i];
    if (value instanceof Array) {
      result += value.join('');
    }
    else {
      result += value;
    }
  }
  result += strings[values.length];
  return result;
};

const sitemapBaseUrl = 'https://jura.live/';

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

const angularConfig = JSON.parse(readFileSync(`${__dirname}/angular.json`).toString());
const outputPath = angularConfig.projects['jura-poi'].architect.build.options.outputPath;
const sitemapFile = `${__dirname}/${outputPath}/sitemap.xml`;

writeFileSync(sitemapFile, sitemapContent);
