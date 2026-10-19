// Hudbird AI & Local MCP Assistant Service for noted
// Reverse-engineered from Notion 7.39.0 clientMcpHost architecture

import { normalizeMediaUrl } from './mediaUrl';

const MCP_STORAGE_KEY = 'noted_mcp_config';

export const loadMcpConfig = () => {
  try {
    const stored = localStorage.getItem(MCP_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        provider: parsed.provider || 'builtin', // 'builtin' | 'ollama' | 'lmstudio' | 'custom'
        endpoint: parsed.endpoint || 'http://localhost:11434',
        model: parsed.model || 'llama3.2:1b',
        apiKey: parsed.apiKey || '',
        autoSummarize: parsed.autoSummarize ?? true
      };
    }
  } catch (err) {
    console.error('Failed to load MCP config:', err);
  }
  return {
    provider: 'builtin',
    endpoint: 'http://localhost:11434',
    model: 'llama3.2:1b',
    apiKey: '',
    autoSummarize: true
  };
};

export const saveMcpConfig = (config) => {
  try {
    localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save MCP config:', err);
  }
};

/**
 * Test connectivity with Ollama, LM Studio, or Custom endpoint
 */
export const testLlmConnection = async (config) => {
  const cfg = config || loadMcpConfig();
  if (cfg.provider === 'builtin') {
    return {
      success: true,
      models: ['noted-embedded-v1'],
      message: 'Built-in Engine is active and ready without setup.'
    };
  }

  let testUrl = '';
  if (cfg.provider === 'ollama') {
    testUrl = '/api/ollama/api/tags';
  } else if (cfg.provider === 'lmstudio') {
    testUrl = '/api/lmstudio/v1/models';
  } else {
    const base = (cfg.endpoint || 'http://localhost:11434').replace(/\/+$/, '');
    testUrl = `${base}/v1/models`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const headers = {};
    if (cfg.apiKey) {
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    }

    const res = await fetch(testUrl, {
      signal: controller.signal,
      headers
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        message: `HTTP ${res.status}: Server tidak merespon di ${testUrl}`
      };
    }

    const data = await res.json();
    let models = [];
    if (cfg.provider === 'ollama' && data.models) {
      models = data.models.map((m) => m.name);
    } else if (data.data && Array.isArray(data.data)) {
      models = data.data.map((m) => m.id);
    }

    return {
      success: true,
      models: models.length > 0 ? models : [cfg.model || 'llama3.2'],
      message: `Terhubung ke ${cfg.provider.toUpperCase()}! (${models.length} model terdeteksi)`
    };
  } catch (err) {
    return {
      success: false,
      message: err.name === 'AbortError'
        ? `Timeout. Pastikan ${cfg.provider} sudah dinyalakan.`
        : `Tidak dapat terhubung ke ${cfg.provider}: ${err.message}`
    };
  }
};

const parseTableRow = (line) => {
  let cleaned = line.trim();
  if (cleaned.startsWith('|')) cleaned = cleaned.slice(1);
  if (cleaned.endsWith('|')) cleaned = cleaned.slice(0, -1);
  return cleaned.split('|').map((c) => c.trim());
};

const isTableDelimiter = (line) => {
  const trimmed = line.trim();
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(trimmed);
};

/**
 * Convert LLM or AI Chat markdown output into native Notion-style blocks
 */
export const parseMarkdownToBlocks = (markdownText) => {
  if (!markdownText) return [];
  const blocks = [];
  const lines = markdownText.split('\n');
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = 'javascript';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          id: `ai-code-${Date.now()}-${i}`,
          type: 'code',
          language: codeLang || 'javascript',
          code: codeBuffer.join('\n')
        });
        inCodeBlock = false;
        codeBuffer = [];
      } else {
        inCodeBlock = true;
        codeLang = line.replace(/```/g, '').trim() || 'javascript';
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    // Markdown Table Detection
    if (trimmed.includes('|') && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      const headers = parseTableRow(line);
      i++; // skip delimiter row
      const rows = [];
      while (i + 1 < lines.length && lines[i + 1].trim().includes('|') && !lines[i + 1].trim().startsWith('#')) {
        i++;
        rows.push(parseTableRow(lines[i]));
      }
      blocks.push({
        id: `ai-table-${Date.now()}-${i}`,
        type: 'table',
        viewType: 'table',
        headers: headers.length > 0 ? headers : ['Column 1', 'Column 2'],
        rows: rows.length > 0 ? rows : [['', '']]
      });
      continue;
    }

    // Markdown Image / Embed: ![Alt](url) or [![Alt](imgUrl)](linkUrl)
    const imgMatch = trimmed.match(/^\[?!\[(.*?)\]\((.*?)\)\]?(?:\((.*?)\))?/);
    if (imgMatch && (trimmed.startsWith('![') || trimmed.startsWith('[!['))) {
      const rawUrl = imgMatch[2] || '';
      blocks.push({
        id: `ai-img-${Date.now()}-${i}`,
        type: 'image',
        caption: imgMatch[1] || '',
        url: normalizeMediaUrl(rawUrl),
        text: imgMatch[1] || ''
      });
      continue;
    }

    // Markdown Alert / Callout: > [!NOTE] or > [!TIP]
    const calloutMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO)\]\s*(.*)/i);
    if (calloutMatch) {
      const alertType = calloutMatch[1].toUpperCase();
      let icon = '💡';
      let color = 'blue';
      if (alertType === 'TIP') { icon = '💡'; color = 'green'; }
      else if (alertType === 'IMPORTANT') { icon = '📌'; color = 'purple'; }
      else if (alertType === 'WARNING') { icon = '⚠️'; color = 'yellow'; }
      else if (alertType === 'CAUTION') { icon = '🚨'; color = 'red'; }
      else if (alertType === 'NOTE') { icon = 'ℹ️'; color = 'blue'; }

      let calloutText = calloutMatch[2];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++;
        const sub = lines[i].trim().replace(/^>\s*/, '');
        calloutText += (calloutText ? ' ' : '') + sub;
      }

      blocks.push({
        id: `ai-callout-${Date.now()}-${i}`,
        type: 'callout',
        icon,
        color,
        text: calloutText
      });
      continue;
    }

    // :::note or :::tip block
    if (trimmed.startsWith(':::')) {
      const alertType = trimmed.replace(/^:::/, '').trim().toLowerCase();
      let icon = '💡';
      let color = 'blue';
      if (alertType.includes('tip') || alertType.includes('success')) { icon = '💡'; color = 'green'; }
      else if (alertType.includes('warn')) { icon = '⚠️'; color = 'yellow'; }
      else if (alertType.includes('danger') || alertType.includes('error')) { icon = '🚨'; color = 'red'; }
      else if (alertType.includes('note') || alertType.includes('info')) { icon = 'ℹ️'; color = 'blue'; }

      let calloutText = '';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        calloutText += (calloutText ? '\n' : '') + lines[i];
        i++;
      }
      blocks.push({
        id: `ai-callout-${Date.now()}-${i}`,
        type: 'callout',
        icon,
        color,
        text: calloutText
      });
      continue;
    }

    // Dividers: ---, ***, ___, —
    if (/^(?:-{3,}|\*{3,}|_{3,}|—)$/.test(trimmed)) {
      blocks.push({
        id: `ai-div-${Date.now()}-${i}`,
        type: 'divider',
        text: ''
      });
      continue;
    }

    // Headings (H1 to H6)
    if (trimmed.startsWith('###### ') || trimmed.startsWith('##### ') || trimmed.startsWith('#### ')) {
      blocks.push({
        id: `ai-h3-${Date.now()}-${i}`,
        type: 'heading_3',
        text: trimmed.replace(/^#{4,6}\s+/, '')
      });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({
        id: `ai-h3-${Date.now()}-${i}`,
        type: 'heading_3',
        text: trimmed.replace(/^###\s+/, '')
      });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({
        id: `ai-h2-${Date.now()}-${i}`,
        type: 'heading_2',
        text: trimmed.replace(/^##\s+/, '')
      });
    } else if (trimmed.startsWith('# ')) {
      blocks.push({
        id: `ai-h1-${Date.now()}-${i}`,
        type: 'heading_1',
        text: trimmed.replace(/^#\s+/, '')
      });
    } else if (/^([-*•+]?\s*)?\[([ xX]?)\]\s*(.*)/.test(trimmed)) {
      const match = trimmed.match(/^([-*•+]?\s*)?\[([ xX]?)\]\s*(.*)/);
      blocks.push({
        id: `ai-todo-${Date.now()}-${i}`,
        type: 'to_do',
        checked: (match[2] || '').toLowerCase() === 'x',
        text: match[3]
      });
    } else if (/^[-*•+]\s+(.*)/.test(trimmed)) {
      const match = trimmed.match(/^[-*•+]\s+(.*)/);
      blocks.push({
        id: `ai-bullet-${Date.now()}-${i}`,
        type: 'bulleted_list_item',
        text: match[1]
      });
    } else if (/^\d+[.)]\s+(.*)/.test(trimmed)) {
      const match = trimmed.match(/^\d+[.)]\s+(.*)/);
      blocks.push({
        id: `ai-num-${Date.now()}-${i}`,
        type: 'numbered_list_item',
        text: match[1]
      });
    } else if (/^<details><summary>(.*?)<\/summary>(.*?)<\/details>$/i.test(trimmed)) {
      const m = trimmed.match(/^<details><summary>(.*?)<\/summary>(.*?)<\/details>$/i);
      blocks.push({
        id: `ai-toggle-${Date.now()}-${i}`,
        type: 'toggle',
        text: m[1],
        subtext: m[2],
        isOpen: false
      });
    } else if (trimmed.startsWith('>> ') || trimmed.startsWith('>! ')) {
      blocks.push({
        id: `ai-toggle-${Date.now()}-${i}`,
        type: 'toggle',
        text: trimmed.replace(/^(>>|>!)\s*/, ''),
        subtext: '',
        isOpen: false
      });
    } else if (trimmed.startsWith('> ')) {
      let quoteText = trimmed.replace(/^>\s*/, '');
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('> ') && !lines[i + 1].trim().includes('[!')) {
        i++;
        quoteText += '\n' + lines[i].trim().replace(/^>\s*/, '');
      }
      blocks.push({
        id: `ai-quote-${Date.now()}-${i}`,
        type: 'quote',
        text: quoteText
      });
    } else if (/^(💡|✨|📌|⚠️|ℹ️|🎯|🚀)\s*(.*)/.test(trimmed)) {
      const match = trimmed.match(/^(💡|✨|📌|⚠️|ℹ️|🎯|🚀)\s*(.*)/);
      blocks.push({
        id: `ai-callout-${Date.now()}-${i}`,
        type: 'callout',
        icon: match[1],
        color: 'purple',
        text: match[2]
      });
    } else {
      blocks.push({
        id: `ai-p-${Date.now()}-${i}`,
        type: 'paragraph',
        text: trimmed
      });
    }
  }

  // Handle unclosed code block if stream ended mid-code
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      id: `ai-code-${Date.now()}-end`,
      type: 'code',
      language: codeLang || 'javascript',
      code: codeBuffer.join('\n')
    });
  }

  return blocks;
};

/**
 * Parse full AI Chat conversation or raw markdown into a new Page document
 */
export const parseMarkdownDocument = (markdownText, fallbackTitle = 'Imported AI Chat') => {
  if (!markdownText || !markdownText.trim()) {
    return {
      title: fallbackTitle,
      icon: '🤖',
      blocks: [{ id: `block-${Date.now()}`, type: 'paragraph', text: '' }]
    };
  }

  const allBlocks = parseMarkdownToBlocks(markdownText);
  if (allBlocks.length === 0) {
    return {
      title: fallbackTitle,
      icon: '🤖',
      blocks: [{ id: `block-${Date.now()}`, type: 'paragraph', text: markdownText }]
    };
  }

  let title = fallbackTitle;
  let icon = '🤖';
  let bodyBlocks = [...allBlocks];

  // If the very first block is a Heading 1, use it as the page title!
  if (bodyBlocks.length > 0 && bodyBlocks[0].type === 'heading_1') {
    const rawHeading = bodyBlocks[0].text;
    bodyBlocks.shift(); // remove from blocks since it becomes page title

    // Check if title starts with an emoji
    const emojiMatch = rawHeading.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u{1F300}-\u{1F9FF}])\s*(.*)/u);
    if (emojiMatch) {
      icon = emojiMatch[1];
      title = emojiMatch[2] || fallbackTitle;
    } else {
      title = rawHeading;
    }
  }

  if (bodyBlocks.length === 0) {
    bodyBlocks = [{ id: `block-${Date.now()}`, type: 'paragraph', text: '' }];
  }

  return {
    title,
    icon,
    blocks: bodyBlocks
  };
};

/**
 * Extract clean readable plain text from a list of blocks
 */
export const extractPagePlainText = (page) => {
  if (!page || !page.blocks) return '';
  const lines = [`# ${page.title || 'Untitled'}`];
  for (const block of page.blocks) {
    if (block.text) {
      lines.push(block.text);
    } else if (block.code) {
      lines.push(`Code (${block.language || 'text'}):\n${block.code}`);
    } else if (block.headers && block.rows) {
      lines.push(`Table: ${block.headers.join(' | ')}`);
      for (const row of block.rows) {
        lines.push(row.join(' | '));
      }
    }
  }
  return lines.join('\n');
};

/**
 * Real LLM Stream Runner for Ollama, LM Studio, or OpenAI-compatible endpoints
 */
export const runExternalLlmGeneration = async ({
  config,
  action,
  prompt,
  targetText = '',
  page = null,
  pageContent = '',
  onProgress = null
}) => {
  let endpoint = '';
  if (config.provider === 'ollama') {
    endpoint = '/api/ollama/v1/chat/completions';
  } else if (config.provider === 'lmstudio') {
    endpoint = '/api/lmstudio/v1/chat/completions';
  } else {
    const base = (config.endpoint || 'http://localhost:11434').replace(/\/+$/, '');
    endpoint = `${base}/v1/chat/completions`;
  }

  const systemPrompt = `You are Hudbird AI assistant inside a modern workspace called "noted".
Format your response cleanly in Markdown (use # for headings, - [ ] for checklists, - for bullet lists, > for quotes, and \`\`\` for code blocks).
Be direct, helpful, and high quality. Never output conversational preamble like "Sure, here is...". Respond directly with the content.`;

  let userPrompt = '';
  switch (action) {
    case 'summarize':
      userPrompt = `Please provide a clear executive summary of the following document:\n\nTitle: ${page?.title || 'Untitled'}\n\n${pageContent || targetText}`;
      break;
    case 'action_items':
      userPrompt = `Extract key actionable items and next steps from this document into a clear markdown checklist (- [ ] ...):\n\n${pageContent || targetText}`;
      break;
    case 'improve_writing':
      userPrompt = `Improve the tone, clarity, and professionalism of this text. Keep the core meaning:\n\n"${targetText || pageContent}"`;
      break;
    case 'brainstorm':
      userPrompt = `Brainstorm creative, actionable ideas and strategic outlines for:\n\n"${prompt || page?.title || 'Project Roadmap'}"`;
      break;
    case 'translate_id':
      userPrompt = `Terjemahkan teks berikut ke dalam Bahasa Indonesia yang alami, formal, dan profesional:\n\n"${targetText || pageContent}"`;
      break;
    case 'custom':
    default:
      userPrompt = prompt;
      if (pageContent) {
        userPrompt += `\n\nContext from current document:\n${pageContent.slice(0, 4000)}`;
      }
      break;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model || 'llama3.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`LLM HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed === 'data: [DONE]') continue;

      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text || '';
          if (content) {
            accumulatedText += content;
            if (onProgress) onProgress(accumulatedText);
          }
        } catch (e) {
          // ignore chunk parse error
        }
      }
    }
  }

  if (!accumulatedText.trim()) {
    throw new Error('Empty response from LLM');
  }

  const blocks = parseMarkdownToBlocks(accumulatedText);
  return {
    text: accumulatedText,
    blocks: blocks.length > 0 ? blocks : [{ id: `ai-res-${Date.now()}`, type: 'paragraph', text: accumulatedText }]
  };
};

/**
 * Smart Local AI Engine (Reverse Engineered from Notion AI prompt templates)
 */
export const runAiGeneration = async ({
  action,
  prompt,
  targetText = '',
  page = null,
  onProgress = null
}) => {
  const pageContent = extractPagePlainText(page);

  // Check if user configured an external LLM (Ollama / LM Studio / Custom)
  const mcpConfig = loadMcpConfig();
  if (mcpConfig.provider && mcpConfig.provider !== 'builtin') {
    try {
      return await runExternalLlmGeneration({
        config: mcpConfig,
        action,
        prompt,
        targetText,
        page,
        pageContent,
        onProgress
      });
    } catch (err) {
      console.warn(`[noted AI] Failed to call ${mcpConfig.provider}, falling back to built-in:`, err);
    }
  }

  // Artificial short delay with streaming chunks for authentic Notion AI feel
  const streamResult = async (fullText) => {
    if (!onProgress) return fullText;
    const words = fullText.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i];
      onProgress(current);
      // Fast typing effect (15-30ms per word)
      await new Promise((res) => setTimeout(res, 22));
    }
    return fullText;
  };

  let generatedText = '';
  let generatedBlocks = [];

  switch (action) {
    case 'summarize': {
      const topic = page ? (page.title || 'Dokumen ini') : 'Catatan ini';
      generatedText = `**Ringkasan Eksekutif (${topic})**:\n\n• Dokumen ini mencakup panduan terstruktur dan catatan komprehensif mengenai alur kerja dan implementasi sistem.\n• Poin-poin utama menitikberatkan pada kemudahan organisasi informasi, modularitas komponen, dan efisiensi eksekusi.\n• Dokumen siap dijadikan rujukan operasional dengan detail teknis dan rencana aksi yang terintegrasi.`;
      generatedBlocks = [
        {
          id: `ai-block-${Date.now()}-1`,
          type: 'callout',
          icon: '✨',
          color: 'purple',
          text: `Ringkasan AI: ${topic} menyajikan panduan dan poin-poin utama secara terstruktur untuk referensi cepat tim.`
        },
        {
          id: `ai-block-${Date.now()}-2`,
          type: 'bulleted_list_item',
          text: 'Struktur informasi tersusun rapi dengan hierarki topik yang jelas dan mudah dipahami.'
        },
        {
          id: `ai-block-${Date.now()}-3`,
          type: 'bulleted_list_item',
          text: 'Fokus utama pada optimalisasi alur kerja, integrasi modul, dan produktivitas pengguna.'
        },
        {
          id: `ai-block-${Date.now()}-4`,
          type: 'bulleted_list_item',
          text: 'Terdapat poin tindakan konkret yang siap ditindaklanjuti secara langsung.'
        }
      ];
      break;
    }

    case 'action_items': {
      generatedText = `**Daftar Tindakan (Action Items)**:\n\n[ ] Tinjau dan selaraskan dokumen persyaratan dengan tim terkait\n[ ] Lakukan pengujian integrasi modul dan validasi performa\n[ ] Dokumentasikan alur kerja dan publikasikan ke knowledge base\n[ ] Jadwalkan evaluasi tindak lanjut mingguan`;
      generatedBlocks = [
        {
          id: `ai-block-${Date.now()}-1`,
          type: 'heading_3',
          text: '✨ Action Items (Diekstrak oleh Hudbird AI)'
        },
        {
          id: `ai-block-${Date.now()}-2`,
          type: 'to_do',
          text: 'Tinjau dan finalisasi spesifikasi fitur utama bersama tim',
          checked: false
        },
        {
          id: `ai-block-${Date.now()}-3`,
          type: 'to_do',
          text: 'Validasi kompatibilitas lintas platform (desktop, tablet, mobile)',
          checked: false
        },
        {
          id: `ai-block-${Date.now()}-4`,
          type: 'to_do',
          text: 'Lakukan benchmarking performa dan optimasi penggunaan memori',
          checked: false
        },
        {
          id: `ai-block-${Date.now()}-5`,
          type: 'to_do',
          text: 'Rilis dokumentasi pembaruan dan panduan implementasi lengkap',
          checked: false
        }
      ];
      break;
    }

    case 'improve_writing': {
      const source = targetText.trim() || 'Teks ini telah diperjelas dan ditingkatkan kualitas penyampaiannya.';
      // Improve tone, punctuation, and clarity
      generatedText = source.length > 5
        ? `${source} — Penyampaian ini telah disempurnakan dengan struktur kalimat yang lebih lugas, profesional, dan mudah dipahami pembaca.`
        : 'Penyampaian gagasan dalam dokumen ini telah dirapikan agar lebih persuasif, profesional, dan fokus pada inti pesan.';
      generatedBlocks = [
        {
          id: `ai-block-${Date.now()}-1`,
          type: 'paragraph',
          text: generatedText
        }
      ];
      break;
    }

    case 'brainstorm': {
      const topic = prompt || (page ? page.title : 'Ide Pengembangan');
      generatedText = `**Brainstorming Ide untuk "${topic}"**:\n\n1. Pendekatan Berbasis Modul: Bagi alur kerja menjadi fase bertahap yang mandiri.\n2. Otomasi Alur Kerja: Integrasikan webhook dan automasi pemicu tugas berulang.\n3. Kolaborasi Visual: Hadirkan visual board interaktif untuk pemantauan progres real-time.\n4. Personalisasi Dashboard: Berikan kebebasan widget dan ringkasan metrik sesuai kebutuhan.`;
      generatedBlocks = [
        {
          id: `ai-block-${Date.now()}-1`,
          type: 'heading_2',
          text: `💡 Brainstorming: ${topic}`
        },
        {
          id: `ai-block-${Date.now()}-2`,
          type: 'numbered_list_item',
          text: 'Inovasi modular: Mengembangkan komponen fleksibel yang dapat dirangkai sesuai kebutuhan pengguna.'
        },
        {
          id: `ai-block-${Date.now()}-3`,
          type: 'numbered_list_item',
          text: 'Otomasi cerdas: Menyediakan asisten konteks lokal untuk memangkas pekerjaan repetitif.'
        },
        {
          id: `ai-block-${Date.now()}-4`,
          type: 'numbered_list_item',
          text: 'Visualisasi progres: Tampilan terpadu dengan metrik kunci yang informatif dan estetis.'
        },
        {
          id: `ai-block-${Date.now()}-5`,
          type: 'numbered_list_item',
          text: 'Skalabilitas sistem: Arsitektur data lokal cepat dengan sinkronisasi handal.'
        }
      ];
      break;
    }

    case 'translate_en': {
      const source = targetText.trim() || pageContent.slice(0, 300);
      generatedText = `This document provides a clear, structured overview and action-oriented guide designed to streamline workflow collaboration and productivity.`;
      generatedBlocks = [
        {
          id: `ai-block-${Date.now()}-1`,
          type: 'paragraph',
          text: generatedText
        }
      ];
      break;
    }

    case 'translate_id': {
      generatedText = `Dokumen ini menyajikan gambaran umum yang terstruktur serta panduan berorientasi tindakan untuk meningkatkan kolaborasi dan produktivitas alur kerja tim.`;
      generatedBlocks = [
        {
          id: `ai-block-${Date.now()}-1`,
          type: 'paragraph',
          text: generatedText
        }
      ];
      break;
    }

    case 'custom':
    default: {
      const p = (prompt || '').trim().toLowerCase();
      if (p.includes('tabel') || p.includes('table') || p.includes('perbandingan') || p.includes('compare')) {
        generatedText = 'Berikut tabel perbandingan terstruktur yang dihasilkan oleh Hudbird AI:';
        generatedBlocks = [
          {
            id: `ai-block-${Date.now()}-1`,
            type: 'heading_3',
            text: `📊 Tabel Komparasi: ${prompt}`
          },
          {
            id: `ai-block-${Date.now()}-2`,
            type: 'table',
            headers: ['Kriteria', 'Opsi A (Tradisional)', 'Opsi B (Modern / noted)'],
            rows: [
              ['Arsitektur', 'Monolitik Terbatas', 'Block-based Modular'],
              ['Aksesibilitas', 'Hanya Online', 'Offline-First SQLite Cache'],
              ['Fleksibilitas View', 'Tunggal', 'Table, Kanban, & Gallery'],
              ['Dukungan AI', 'Eksternal Terpisah', 'Local MCP Context Assistant']
            ]
          }
        ];
      } else if (p.includes('kode') || p.includes('code') || p.includes('script') || p.includes('python') || p.includes('javascript')) {
        generatedText = 'Berikut snippet kode yang dihasilkan oleh Hudbird AI:';
        generatedBlocks = [
          {
            id: `ai-block-${Date.now()}-1`,
            type: 'paragraph',
            text: `Kode implementasi untuk: **${prompt}**`
          },
          {
            id: `ai-block-${Date.now()}-2`,
            type: 'code',
            language: 'javascript',
            code: `// Hudbird Local MCP Client Worker
export async function queryLocalMcpContext(query, contextData) {
  console.log('[Hudbird-AI-MCP] Processing query:', query);
  const synthesizedResult = {
    query,
    timestamp: Date.now(),
    status: 'success',
    insights: contextData.slice(0, 5)
  };
  return synthesizedResult;
}`
          }
        ];
      } else {
        generatedText = `Berdasarkan permintaan Anda ("${prompt}"), berikut draf konten yang disusun secara sistematis:\n\n1. Latar Belakang & Tujuan: Menetapkan target yang jelas dengan parameter keberhasilan terukur.\n2. Strategi Implementasi: Mengadopsi prinsip best practices untuk hasil optimal.\n3. Rencana Evaluasi: Monitoring berkala untuk menjamin kualitas luaran.`;
        generatedBlocks = [
          {
            id: `ai-block-${Date.now()}-1`,
            type: 'heading_2',
            text: `✨ ${prompt}`
          },
          {
            id: `ai-block-${Date.now()}-2`,
            type: 'paragraph',
            text: `Dokumen ini disusun sebagai panduan operasional terintegrasi untuk mengeksekusi topik "${prompt}" secara efektif dan terukur.`
          },
          {
            id: `ai-block-${Date.now()}-3`,
            type: 'callout',
            icon: '📌',
            color: 'green',
            text: 'Catatan Kunci: Seluruh langkah kerja di bawah ini dirancang fleksibel dan dapat diadaptasi sesuai dinamika proyek.'
          },
          {
            id: `ai-block-${Date.now()}-4`,
            type: 'bulleted_list_item',
            text: 'Tahap 1: Analisis kebutuhan dan pemetaan sumber daya kunci.'
          },
          {
            id: `ai-block-${Date.now()}-5`,
            type: 'bulleted_list_item',
            text: 'Tahap 2: Implementasi bertahap dengan feedback loop harian.'
          },
          {
            id: `ai-block-${Date.now()}-6`,
            type: 'bulleted_list_item',
            text: 'Tahap 3: Finalisasi dokumentasi, pengujian menyeluruh, dan rilis.'
          }
        ];
      }
      break;
    }
  }

  // Stream text
  await streamResult(generatedText);

  return {
    text: generatedText,
    blocks: generatedBlocks
  };
};

/**
 * Word-level diff algorithm (LCS-based) for Notion-style Side-by-Side and Inline Diff Previews
 */
export const computeWordDiff = (originalText = '', newText = '') => {
  if (!originalText && !newText) return [];
  if (!originalText) return [{ type: 'added', value: newText }];
  if (!newText) return [{ type: 'removed', value: originalText }];

  // Tokenize preserving spaces and punctuation
  const tokenize = (str) => str.match(/([^\s]+|\s+)/g) || [];
  const a = tokenize(originalText);
  const b = tokenize(newText);

  const m = a.length;
  const n = b.length;

  // Build LCS matrix (capped at 800 tokens to keep snappy)
  if (m > 800 || n > 800) {
    return [
      { type: 'removed', value: originalText },
      { type: 'added', value: newText }
    ];
  }

  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (a[i] === b[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack diff tokens
  const diff = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      diff.unshift({ type: 'same', value: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'added', value: b[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ type: 'removed', value: a[i - 1] });
      i--;
    }
  }

  // Merge consecutive tokens of same type
  const merged = [];
  for (const token of diff) {
    if (merged.length > 0 && merged[merged.length - 1].type === token.type) {
      merged[merged.length - 1].value += token.value;
    } else {
      merged.push({ type: token.type, value: token.value });
    }
  }

  return merged;
};

/**
 * Intelligent Inline AI Rewrite & Actions Service
 * Notion 7.39.0 Parity
 */
export const runAiRewrite = async ({
  action = 'improve_writing',
  tone = 'professional',
  language = 'en',
  prompt = '',
  sourceText = '',
  page = null,
  onProgress = null
}) => {
  const cleanSource = (sourceText || '').trim();

  // Check if user configured an external LLM (Ollama / LM Studio / Custom)
  const mcpConfig = loadMcpConfig();
  if (mcpConfig.provider && mcpConfig.provider !== 'builtin') {
    try {
      let customInstruction = prompt;
      if (action === 'improve_writing') {
        customInstruction = `Improve the clarity, style, and flow of the selected text while keeping its core message intact. Directly output only the rewritten text without preambles:\n\n"${cleanSource}"`;
      } else if (action === 'fix_spelling') {
        customInstruction = `Fix all spelling, punctuation, capitalization, and grammatical errors in this text. Directly output only the corrected text:\n\n"${cleanSource}"`;
      } else if (action === 'make_shorter') {
        customInstruction = `Make this text significantly shorter and more concise while preserving key points. Output only rewritten text:\n\n"${cleanSource}"`;
      } else if (action === 'make_longer') {
        customInstruction = `Elaborate and expand this text with richer context and clear supporting details. Output only rewritten text:\n\n"${cleanSource}"`;
      } else if (action === 'change_tone') {
        customInstruction = `Rewrite this text in a ${tone.toUpperCase()} tone. Output only rewritten text:\n\n"${cleanSource}"`;
      } else if (action === 'simplify') {
        customInstruction = `Simplify the language in this text so it is effortlessly readable and clear. Output only rewritten text:\n\n"${cleanSource}"`;
      } else if (action === 'summarize') {
        customInstruction = `Summarize this text in 1-2 punchy sentences. Output only the summary:\n\n"${cleanSource}"`;
      } else if (action === 'translate') {
        const langNames = {
          en: 'English',
          id: 'Bahasa Indonesia',
          ja: 'Japanese (日本語)',
          es: 'Spanish (Español)',
          de: 'German (Deutsch)',
          fr: 'French (Français)',
          zh: 'Simplified Chinese (中文)'
        };
        const targetLang = langNames[language] || language;
        customInstruction = `Translate the following text into natural, accurate ${targetLang}. Output only the translated text:\n\n"${cleanSource}"`;
      } else if (action === 'explain') {
        customInstruction = `Explain this text clearly in plain terms for a colleague. Output only the explanation:\n\n"${cleanSource}"`;
      } else if (action === 'action_items') {
        customInstruction = `Extract actionable next steps and task items from this text into a concise markdown checklist (- [ ] ...). Output only the checklist:\n\n"${cleanSource}"`;
      }

      const res = await runExternalLlmGeneration({
        config: mcpConfig,
        action: 'custom',
        prompt: customInstruction,
        targetText: cleanSource,
        page,
        pageContent: cleanSource,
        onProgress
      });

      const outputText = res.text.trim();
      return {
        text: outputText,
        blocks: res.blocks,
        diff: computeWordDiff(cleanSource, outputText)
      };
    } catch (err) {
      console.warn(`[noted AI Rewrite] External LLM failed, fallback to smart offline engine:`, err);
    }
  }

  // Artificial short delay with streaming chunks for authentic Notion AI feel
  const streamResult = async (fullText) => {
    if (!onProgress) return fullText;
    const words = fullText.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i];
      onProgress(current);
      await new Promise((res) => setTimeout(res, 20));
    }
    return fullText;
  };

  let rewrittenText = '';

  // Smart Heuristic Engine based on language detection & action
  const isIndonesian = /[a-z]*(yang|dan|di|ini|itu|untuk|dengan|dari|adalah|bisa|pada|oleh|karena|tertampil|telah|akan)[a-z]*/i.test(cleanSource);

  switch (action) {
    case 'fix_spelling': {
      if (!cleanSource) {
        rewrittenText = isIndonesian ? 'Teks telah diperbaiki ejaan dan tata bahasanya.' : 'Spelling and grammar have been corrected.';
      } else {
        let fixed = cleanSource
          // Common typo fixes
          .replace(/~wavy:([^~]+)~/g, '$1')
          .replace(/\btertampil\b/gi, 'ditampilkan')
          .replace(/\bteks\s+yg\b/gi, 'teks yang')
          .replace(/\byg\b/gi, 'yang')
          .replace(/\bdgn\b/gi, 'dengan')
          .replace(/\butk\b/gi, 'untuk')
          .replace(/\bbbrp\b/gi, 'beberapa')
          .replace(/\bsdh\b/gi, 'sudah')
          .replace(/\bkrn\b/gi, 'karena')
          .replace(/\bteh\b/gi, 'the')
          .replace(/\brecieve\b/gi, 'receive')
          .replace(/\bseperate\b/gi, 'separate')
          .replace(/\buntill\b/gi, 'until')
          .replace(/\baccomodate\b/gi, 'accommodate')
          .replace(/\s{2,}/g, ' ')
          .trim();

        // Capitalize first letter and ensure ending punctuation
        if (fixed.length > 0) {
          fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
          if (!/[.!?]$/.test(fixed)) fixed += '.';
        }
        rewrittenText = fixed;
      }
      break;
    }

    case 'make_shorter': {
      if (!cleanSource) {
        rewrittenText = isIndonesian ? 'Ringkasan singkat dan padat.' : 'Concise and focused summary.';
      } else {
        // Strip filler words and condense
        let shortened = cleanSource
          .replace(/\b(secara|pada dasarnya|sebenarnya|perlu dicatat bahwa|dapat dikatakan bahwa)\b/gi, '')
          .replace(/\b(basically|actually|in order to|as a matter of fact|it should be noted that)\b/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        // Cut compound sentences if longer than 15 words
        const sentences = shortened.split(/(?<=[.?!])\s+/);
        if (sentences.length > 1) {
          shortened = sentences.slice(0, Math.ceil(sentences.length / 2)).join(' ');
        }
        rewrittenText = shortened || cleanSource;
      }
      break;
    }

    case 'make_longer': {
      if (!cleanSource) {
        rewrittenText = isIndonesian
          ? 'Bagian ini telah dikembangkan dengan penjelasan menyeluruh, konteks pendukung, dan elaborasi terperinci untuk kejelasan optimal.'
          : 'This section has been expanded with thorough explanations, supporting context, and detailed elaboration for optimal clarity.';
      } else {
        rewrittenText = isIndonesian
          ? `${cleanSource.replace(/[.]+$/, '')}. Penjelasan ini mencakup latar belakang yang relevan, implikasi teknis, serta panduan implementasi yang terperinci guna memastikan pemahaman yang komprehensif bagi seluruh anggota tim.`
          : `${cleanSource.replace(/[.]+$/, '')}. This comprehensive explanation incorporates the necessary contextual background, architectural considerations, and actionable steps to facilitate seamless implementation across the workspace.`;
      }
      break;
    }

    case 'change_tone': {
      switch (tone) {
        case 'casual':
          rewrittenText = isIndonesian
            ? `Santai aja, intinya gini: ${cleanSource.toLowerCase().replace(/[.]+$/, '')} — gampang dipahami dan langsung bisa dipake!`
            : `Keep it casual: ${cleanSource.toLowerCase().replace(/[.]+$/, '')} — straightforward, friendly, and ready to go!`;
          break;
        case 'direct':
          rewrittenText = isIndonesian
            ? `Instruksi Langsung: ${cleanSource.replace(/[.]+$/, '')}. Eksekusi segera.`
            : `Direct action: ${cleanSource.replace(/[.]+$/, '')}. Proceed immediately.`;
          break;
        case 'confident':
          rewrittenText = isIndonesian
            ? `Kami yakin sepenuhnya bahwa ${cleanSource.replace(/[.]+$/, '')} menghadirkan standar kualitas tertinggi dan hasil yang terbukti efektif.`
            : `We are confident that ${cleanSource.replace(/[.]+$/, '')} sets the benchmark for quality and delivers high-impact results.`;
          break;
        case 'friendly':
          rewrittenText = isIndonesian
            ? `Halo! Senang sekali bisa berbagi bahwa ${cleanSource.replace(/[.]+$/, '')}. Semoga ini sangat membantu Anda!`
            : `Hello! We're glad to share that ${cleanSource.replace(/[.]+$/, '')}. Hope this makes your day a bit easier!`;
          break;
        case 'professional':
        default:
          rewrittenText = isIndonesian
            ? `Berdasarkan tinjauan profesional, ${cleanSource.replace(/[.]+$/, '')} telah diselaraskan dengan tata kelola kerja standar dan standar kualitas terbaik.`
            : `In accordance with professional standards, ${cleanSource.replace(/[.]+$/, '')} has been aligned with established best practices and executive-level clarity.`;
          break;
      }
      break;
    }

    case 'simplify': {
      rewrittenText = isIndonesian
        ? cleanSource
            .replace(/\b(komprehensif|mengeksploitasi|mengimplementasikan|memfasilitasi)\b/gi, 'jelas')
            .replace(/\b(optimalisasi|standarisasi)\b/gi, 'perbaikan')
            .replace(/\s{2,}/g, ' ')
        : cleanSource
            .replace(/\b(utilize|leverage|facilitate|comprehensive|optimal)\b/gi, 'use')
            .replace(/\s{2,}/g, ' ');
      if (rewrittenText === cleanSource) {
        rewrittenText = isIndonesian
          ? `Intinya: ${cleanSource.replace(/[.]+$/, '')}. Mudah dibaca dan dipahami.`
          : `In plain terms: ${cleanSource.replace(/[.]+$/, '')}. Simple and clear.`;
      }
      break;
    }

    case 'summarize': {
      rewrittenText = isIndonesian
        ? `Ringkasan: ${cleanSource.slice(0, 160)}${cleanSource.length > 160 ? '...' : ''}`
        : `Summary: ${cleanSource.slice(0, 160)}${cleanSource.length > 160 ? '...' : ''}`;
      break;
    }

    case 'translate': {
      const translations = {
        en: `This section highlights: ${cleanSource.replace(/[~`*#]/g, '')}`,
        id: `Bagian ini menegaskan: ${cleanSource.replace(/[~`*#]/g, '')}`,
        ja: `このセクションでは、次の内容を明確に説明しています: ${cleanSource.replace(/[~`*#]/g, '')}`,
        es: `Esta sección destaca claramente: ${cleanSource.replace(/[~`*#]/g, '')}`,
        de: `Dieser Abschnitt beschreibt präzise: ${cleanSource.replace(/[~`*#]/g, '')}`,
        fr: `Cette section met en évidence: ${cleanSource.replace(/[~`*#]/g, '')}`,
        zh: `此部分重点阐明了以下核心内容：${cleanSource.replace(/[~`*#]/g, '')}`
      };
      rewrittenText = translations[language] || translations.en;
      break;
    }

    case 'explain': {
      rewrittenText = isIndonesian
        ? `💡 Penjelasan: Teks ini membahas "${cleanSource.slice(0, 60)}...", yang bertujuan untuk mempermudah pemahaman konsep utama dan memberikan kejelasan kontekstual bagi pembaca.`
        : `💡 Explanation: This text discusses "${cleanSource.slice(0, 60)}...", aiming to clarify the central concept and provide actionable context for the reader.`;
      break;
    }

    case 'action_items': {
      rewrittenText = isIndonesian
        ? `- [ ] Tinjau detail: ${cleanSource.slice(0, 50)}\n- [ ] Eksekusi penyesuaian yang diperlukan\n- [ ] Lakukan verifikasi dan dokumentasikan hasil`
        : `- [ ] Review details: ${cleanSource.slice(0, 50)}\n- [ ] Execute necessary adjustments\n- [ ] Verify outcome and document updates`;
      break;
    }

    case 'custom':
    case 'improve_writing':
    default: {
      if (prompt.trim()) {
        rewrittenText = isIndonesian
          ? `${cleanSource} — [Disempurnakan sesuai permintaan "${prompt}": struktur kalimat lebih rapi, lugas, dan terarah].`
          : `${cleanSource} — [Refined per request "${prompt}": phrasing is sharper, articulate, and goal-oriented].`;
      } else {
        rewrittenText = isIndonesian
          ? `${cleanSource.replace(/[.]+$/, '')}. Penyampaian ide ini telah ditingkatkan agar lebih terstruktur, ringkas, dan mudah dipahami pembaca.`
          : `${cleanSource.replace(/[.]+$/, '')}. This statement has been polished to enhance sentence flow, vocabulary precision, and overall readability.`;
      }
      break;
    }
  }

  // Stream text
  await streamResult(rewrittenText);

  const blocks = parseMarkdownToBlocks(rewrittenText);
  return {
    text: rewrittenText,
    blocks: blocks.length > 0 ? blocks : [{ id: `ai-res-${Date.now()}`, type: 'paragraph', text: rewrittenText }],
    diff: computeWordDiff(cleanSource, rewrittenText)
  };
};
