declare module '@scrapingant/scrapingant-client' {
  class ScrapingAntClient {
    constructor(opts: { apiKey: string });
    scrape(url: string, opts?: { browser?: boolean }): Promise<string>;
  }
  export default ScrapingAntClient;
}
