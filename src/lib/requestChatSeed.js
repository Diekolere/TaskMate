/**
 * Initial chat messages for a private (direct) request — shown as customer-sent bubbles.
 */

export function isPrivateDirectJob(job) {
  if (!job) return false;
  const t = String(job.request_type || job.visibility || '').toLowerCase();
  if (t === 'private') return true;
  const wid = job.providerId || job.worker_id;
  return Boolean(wid && t !== 'public');
}

function chunkText(text, maxLen) {
  const t = text.trim();
  if (!t) return [];
  if (t.length <= maxLen) return [t];

  const paragraphs = t.split(/\n\s*\n/);
  const chunks = [];
  let buf = '';

  const flush = () => {
    if (buf.trim()) chunks.push(buf.trim());
    buf = '';
  };

  for (const para of paragraphs) {
    const p = para.trim();
    if (!p) continue;
    const joined = buf ? `${buf}\n\n${p}` : p;
    if (joined.length <= maxLen) {
      buf = joined;
    } else {
      flush();
      if (p.length <= maxLen) buf = p;
      else {
        let rest = p;
        while (rest.length > maxLen) {
          let cut = rest.lastIndexOf(' ', maxLen);
          if (cut < maxLen * 0.5) cut = maxLen;
          chunks.push(rest.slice(0, cut).trim());
          rest = rest.slice(cut).trim();
        }
        buf = rest;
      }
    }
  }
  flush();
  return chunks.length ? chunks : [t];
}

export function buildPrivateRequestIntroMessages(request, provider) {
  const messages = [];
  let idCounter = 1;
  const baseTime = new Date();

  const add = (msg) => {
    messages.push({
      id: idCounter++,
      time: new Date(baseTime.getTime() + idCounter * 800),
      ...msg,
    });
  };

  const rawName = (provider?.full_name || provider?.displayName || 'there').trim();
  const firstName = rawName.includes(' ') ? rawName.split(/\s+/)[0] : rawName.replace(/,$/, '');

  const title = (request.title || 'Service request').trim();
  const category = (request.category || 'General').trim();
  const loc = (request.location || request.location_name || '').trim();
  const urgencyRaw = request.urgency ? String(request.urgency).replace(/_/g, ' ').trim() : '';
  const urgency =
    urgencyRaw &&
    urgencyRaw.charAt(0).toUpperCase() + urgencyRaw.slice(1).toLowerCase();

  const budgetVal =
    request.budget != null && request.budget !== ''
      ? Number(request.budget)
      : request.budget_estimate != null && request.budget_estimate !== ''
        ? Number(request.budget_estimate)
        : NaN;
  const hasBudget = Number.isFinite(budgetVal) && budgetVal > 0;

  add({
    from: 'customer',
    text: `Hi ${firstName},\n\nI've sent you a direct request on TaskMate — here's what I need.`,
  });

  const detailLines = [`Task: ${title}`, `Category: ${category}`];
  if (loc) detailLines.push(`Location: ${loc}`);
  if (urgency) detailLines.push(`Urgency: ${urgency}`);
  if (hasBudget) detailLines.push(`Budget guide: ₦${budgetVal.toLocaleString()}`);

  add({
    from: 'customer',
    text: detailLines.join('\n'),
  });

  const desc = (request.description || '').trim();
  if (desc) {
    const parts = chunkText(desc, 520);
    parts.forEach((part, i) => {
      add({
        from: 'customer',
        text: parts.length > 1 ? (i === 0 ? `Details:\n${part}` : part) : `Details:\n${part}`,
      });
    });
  }

  const imageUrls = [];
  if (Array.isArray(request.images)) {
    request.images.filter(Boolean).forEach((u) => imageUrls.push(u));
  }
  if (request.image && !imageUrls.includes(request.image)) {
    imageUrls.unshift(request.image);
  }

  if (imageUrls.length > 0) {
    add({
      from: 'customer',
      text: imageUrls.length === 1 ? 'Photo attached.' : `${imageUrls.length} photos attached.`,
      images: imageUrls,
    });
  }

  return messages;
}
