export function formatINR(amount: number, withDecimals = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(amount || 0);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n || 0);
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function relativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function deliveryLabel(days: number): string {
  if (days <= 0) return 'Same day';
  if (days === 1) return 'Next day';
  return `${days} days`;
}

/** Strip <think> blocks, leaked chain-of-thought reasoning, and stray markdown from AI text. */
export function cleanAIText(text: string): string {
  try {
    let cleaned = text;
    // Strip complete <think>...</think> blocks
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    // Strip truncated/unclosed <think> blocks
    cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');
    // Remove stray markdown bold/italic/heading markers
    cleaned = cleaned.replace(/\*\*/g, '').replace(/##?\s*/g, '');
    // Detect leaked chain-of-thought reasoning (no <think> tags but visible planning)
    const reasoningMarkers = ['Drafting', 'Critique:', 'Goal:', 'Data Points:', 'Sentence 1', 'Sentence 2', 'Step 1', 'Step 2', 'Let me ', 'I need to'];
    const markerCount = reasoningMarkers.filter(m => cleaned.includes(m)).length;
    if (markerCount >= 2) return '';
    // Strip garbage prefixes like "` tags. Content: ..."
    cleaned = cleaned.replace(/^[`\s]*tags\.?\s*/i, '').replace(/^Content:\s*/i, '');
    return cleaned.trim();
  } catch {
    return text;
  }
}
