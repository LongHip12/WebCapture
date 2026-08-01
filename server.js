import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

let browser;

async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
  }
  return browser;
}

app.get('/', (req, res) => {
  res.send('.gg/lonelyhub');
});

app.post('/api/preview', async (req, res) => {
  try {
    const { Type, Source, size } = req.body;

    if (!Type || !Source || !size || !size.x || !size.y) {
      return res.status(400).json({
        error: 'Missing required fields: Type, Source, size (with x, y)'
      });
    }

    if (!['html', 'url'].includes(Type)) {
      return res.status(400).json({
        error: 'Type must be "html" or "url"'
      });
    }

    const width = parseInt(size.x);
    const height = parseInt(size.y);

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      return res.status(400).json({
        error: 'Size must have positive numeric values for x and y'
      });
    }

    const browserInstance = await initBrowser();
    const page = await browserInstance.newPage();

    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: 1
    });

    if (Type === 'html') {
      await page.setContent(Source, { waitUntil: 'networkidle0' });
    } else if (Type === 'url') {
      await page.goto(Source, { waitUntil: 'networkidle0', timeout: 30000 });
    }

    const screenshot = await page.screenshot({ type: 'png' });
    await page.close();

    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);

  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      error: 'Failed to generate preview',
      message: error.message
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  server.close();
  process.exit(0);
});
