import 'dotenv/config';
import Koa from 'koa';
import { bodyParser } from '@koa/bodyparser';
import cors from 'koa-cors';
import serve from 'koa-static';
import generateRouter from './routes/generate';
import draftsRouter from './routes/drafts';
import uploadRouter from './routes/upload';
import fs from 'fs';
import path from 'path';

// Ensure the data directory exists for SQLite
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const app = new Koa();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(bodyParser());

// API routes first
app.use(generateRouter.routes());
app.use(generateRouter.allowedMethods());
app.use(draftsRouter.routes());
app.use(draftsRouter.allowedMethods());
app.use(uploadRouter.routes());
app.use(uploadRouter.allowedMethods());

// Serve frontend static files in production
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(serve(publicDir));
  // Fallback: serve index.html for any unmatched route (React client-side routing)
  app.use(async (ctx) => {
    const indexHtml = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      ctx.type = 'html';
      ctx.body = fs.createReadStream(indexHtml);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Job Pack running on http://localhost:${PORT}`);
});
