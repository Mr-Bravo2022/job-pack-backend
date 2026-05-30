import puppeteer, { Browser } from 'puppeteer';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    const isProduction = process.env.NODE_ENV === 'production';
    browser = await puppeteer.launch({
      headless: true,
      // On Render (Linux), use the system Chromium instead of the bundled one
      executablePath: isProduction ? '/usr/bin/chromium-browser' : undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }
  return browser;
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'Letter',
      margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

// Graceful shutdown
process.on('exit', () => { browser?.close(); });
process.on('SIGINT', () => { browser?.close(); process.exit(); });
