import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { connectDB } from '../config/database';
import { Blog } from '../models/Blog';
import { pingIndexNow } from '../lib/indexNow';

const BACKUP_DIR = path.resolve(__dirname, '../../../content-ml/data/backups');
const EDITABLE = ['title', 'excerpt', 'content', 'metaTitle', 'metaDescription', 'metaKeywords', 'tags'] as const;

function stamp() {
  return new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
}

async function backup(slugs: string[]) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const docs = await Blog.find({ slug: { $in: slugs } }).lean();
  const file = path.join(BACKUP_DIR, `blogs-${stamp()}.json`);
  fs.writeFileSync(file, JSON.stringify(docs, null, 2));
  return { file, count: docs.length };
}

async function show(slugs: string[]) {
  const docs = await Blog.find({ slug: { $in: slugs } }).lean();
  for (const d of docs as any[]) {
    const h2 = (d.content.match(/<h2[^>]*>(.*?)<\/h2>/g) || []).map((h: string) => h.replace(/<[^>]+>/g, ''));
    console.log(`\n== ${d.slug} | ${d.wordCount} words | updated ${new Date(d.updatedAt).toISOString().slice(0, 10)}`);
    console.log(`title: ${d.title}\nmetaTitle: ${d.metaTitle}\nmetaDescription: ${d.metaDescription}\nexcerpt: ${d.excerpt}`);
    console.log(`H2s: ${h2.join(' | ')}`);
  }
}

async function apply(file: string) {
  const updates: Array<Record<string, unknown> & { slug: string }> = JSON.parse(fs.readFileSync(file, 'utf8'));
  const slugs = updates.map((u) => u.slug);
  const b = await backup(slugs);
  console.log(`backup of ${b.count} blog(s) -> ${b.file}`);
  for (const u of updates) {
    const blog = await Blog.findOne({ slug: u.slug });
    if (!blog) {
      console.log(`skip ${u.slug}: not found`);
      continue;
    }
    const changed: string[] = [];
    for (const key of EDITABLE) {
      if (u[key] !== undefined) {
        (blog as any)[key] = u[key];
        changed.push(key);
      }
    }
    await blog.save();
    console.log(`updated ${u.slug}: ${changed.join(', ')} (${blog.wordCount} words)`);
  }
  await pingIndexNow(slugs.map((s) => `/blogs/${s}`));
}

async function run() {
  const [mode, ...args] = process.argv.slice(2);
  await connectDB();
  if (mode === 'backup') console.log(await backup(args));
  else if (mode === 'show') await show(args);
  else if (mode === 'apply' && args[0]) await apply(args[0]);
  else console.log('usage: refreshBlogs.ts backup <slug...> | show <slug...> | apply <updates.json>');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
