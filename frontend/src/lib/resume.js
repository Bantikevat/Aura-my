// Resume Auto-Fill: read a PDF in the browser and turn it into career-profile fields.
// The PDF never leaves the device; only the extracted plain text is sent to the local
// assistant server, which uses the free model to pull out the vault fields.
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ASSISTANT_URL } from './assistant';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Pull selectable text out of a PDF, in the browser. Scanned (image-only) PDFs return little or nothing.
export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';
  const pages = Math.min(pdf.numPages, 8); // a resume is rarely longer than this
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return text.replace(/[ \t]+/g, ' ').trim();
}

// Ask the assistant server to extract profile fields from resume text. Returns only non-empty fields.
export async function parseResumeToProfile(text) {
  const res = await fetch(`${ASSISTANT_URL}/parse-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Resume read failed (${res.status})`);
  return body.profile || {};
}
