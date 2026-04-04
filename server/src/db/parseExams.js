/**
 * YKS Sınav Dosyası Parser
 * /tmp/yksler/ klasöründeki txt dosyalarını okuyup veritabanına ekler
 */
const fs = require('fs');
const path = require('path');

// TYT sections in order (global question numbering)
const TYT_SECTIONS = [
  { name: 'turkce', subjectId: 'tyt-turkce', count: 40 },
  { name: 'sosyal', subjectId: 'tyt-sosyal', count: 25 },
  { name: 'matematik', subjectId: 'tyt-mat', count: 40 },
  { name: 'fen', subjectId: 'tyt-fen', count: 20 },
];

// AYT sections in order
const AYT_SECTIONS = [
  { name: 'sosyal1', subjectId: 'ayt-sosyal1', count: 40 },
  { name: 'sosyal2', subjectId: 'ayt-sosyal2', count: 46 },
  { name: 'matematik', subjectId: 'ayt-mat', count: 40 },
  { name: 'fen', subjectId: 'ayt-fen', count: 40 },
];

// File mapping
const FILE_MAP = {
  'TYT_01072018.txt': { year: 2018, type: 'TYT' },
  'tyt_yks_2019_web.txt': { year: 2019, type: 'TYT' },
  'tyt_yks_2020.txt': { year: 2020, type: 'TYT' },
  'tyt_yks_2021.txt': { year: 2021, type: 'TYT' },
  'yks_2022_tyt.txt': { year: 2022, type: 'TYT' },
  'yks_tyt_2023_kitapcik_T23ky.txt': { year: 2023, type: 'TYT' },
  'yks_tyt_2024_kitapcik_T24kt.txt': { year: 2024, type: 'TYT' },
  'yks_tyt_2025_kitapcik_d250.txt': { year: 2025, type: 'TYT' },
  'AYT_01072018.txt': { year: 2018, type: 'AYT' },
  'ayt_yks_2019_web.txt': { year: 2019, type: 'AYT' },
  'ayt_yks_2020.txt': { year: 2020, type: 'AYT' },
  'ayt_yks_2021.txt': { year: 2021, type: 'AYT' },
  'yks_2022_ayt.txt': { year: 2022, type: 'AYT' },
  'yks_ayt_2023_kitapcik_g5A2H.txt': { year: 2023, type: 'AYT' },
  'yks_ayt_2024_kitapcik_ts85k.txt': { year: 2024, type: 'AYT' },
  'yks_ayt_2025_kitapcik_st12.txt': { year: 2025, type: 'AYT' },
};

/**
 * Normalize file content: handle encoding issues and CR/LF
 */
function normalizeContent(buffer) {
  // Try UTF-8 first, fallback to latin-1
  let text = buffer.toString('utf-8');

  // Normalize Turkish chars that might be mangled
  // Replace common latin-1 misinterpretations
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');  // Remaining \r to \n

  return text;
}

/**
 * Check if a line is a section header, return section key or null
 */
function detectSectionHeader(line) {
  const t = line.trim().toUpperCase();

  // Skip lines that are instructions like "TESTINE GECINIZ" or "TESTI BITTI"
  if (/GE[CÇ].?[İI]N[İI]Z/i.test(t)) return null;
  if (/B[İI]TT[İI]/i.test(t)) return null;
  if (/CEVAPLARINIZI/i.test(t)) return null;
  if (/CEVAP K/i.test(t)) return null;
  if (/^\d+\.\s/.test(t)) return null;  // Numbered instruction lines

  // TYT sections - handle encoding issues by matching partial ASCII
  if (/T.?RK.?E\s*TEST/i.test(t)) return 'turkce';
  if (/SOSYAL\s*B.?L.?MLER\s*TEST/i.test(t) && !/-1|-2|SOSYAL\s*B.*1|SOSYAL\s*B.*2/.test(t)) return 'sosyal';

  // AYT sections
  if (/T.?RK\s*D.?L.?.*SOSYAL.*1/i.test(t) || /SOSYAL\s*B.?L.?MLER.?1/i.test(t)) return 'sosyal1';
  if (/SOSYAL\s*B.?L.?MLER.?2/i.test(t)) return 'sosyal2';
  if (/MATEMAT.?K\s*TEST/i.test(t) && !/TEMEL/i.test(t)) return 'matematik';
  if (/TEMEL\s*MATEMAT.?K\s*TEST/i.test(t)) return 'matematik';  // TYT mat
  if (/FEN\s*B.?L.?MLER.?\s*TEST/i.test(t)) return 'fen';

  return null;
}

/**
 * Extract answers from file content.
 * Returns array of { subjectId, answers: [letter, ...] }
 */
function extractAnswers(content, examType) {
  const lines = content.split('\n');
  const sections = examType === 'TYT' ? TYT_SECTIONS : AYT_SECTIONS;
  const expectedTotal = sections.reduce((s, sec) => s + sec.count, 0);

  // Strategy 1: Try sectioned format first (AYT 2024+ with "N.  X" per section)
  const headerPositions = [];
  for (let i = 0; i < lines.length; i++) {
    const section = detectSectionHeader(lines[i]);
    if (section) {
      headerPositions.push({ line: i, section, text: lines[i].trim() });
    }
  }

  if (headerPositions.length >= 2) {
    // Find last cluster of headers
    let clusterStart = headerPositions.length - 1;
    for (let i = headerPositions.length - 2; i >= 0; i--) {
      if (headerPositions[clusterStart].line - headerPositions[i].line < 350) {
        clusterStart = i;
      } else {
        break;
      }
    }
    const answerHeaders = headerPositions.slice(clusterStart);

    // Check if there are actual answers between section headers
    if (checkAnswersBetweenHeaders(lines, answerHeaders)) {
      const result = parseSectionedAnswers(lines, answerHeaders, examType);
      const totalFound = result.reduce((s, r) => s + r.answers.length, 0);
      if (totalFound >= expectedTotal * 0.8) return result;
    }

    // Check for compressed format (TYT 2024+)
    const answerContent = lines.slice(answerHeaders[0].line).join('\n');
    const numberedPatterns = answerContent.match(/^\d+\.$/gm);
    if (numberedPatterns && numberedPatterns.length > 30) {
      const result = parseCompressedAnswers(answerContent, examType);
      const totalFound = result.reduce((s, r) => s + r.answers.length, 0);
      if (totalFound >= expectedTotal * 0.8) return result;
    }
  }

  // Strategy 2: Flat extraction - collect ALL single letters from the last ~40% of file
  // PDF answer keys always appear at the end of the document
  const startLine = Math.floor(lines.length * 0.6);
  const allLetters = [];
  for (let i = startLine; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^[A-E]$/.test(t)) allLetters.push(t);
  }

  if (allLetters.length >= expectedTotal * 0.9) {
    // Distribute by known section sizes
    const results = [];
    let idx = 0;
    for (const section of sections) {
      const count = Math.min(section.count, allLetters.length - idx);
      if (count <= 0) break;
      results.push({
        subjectId: section.subjectId,
        answers: allLetters.slice(idx, idx + count),
      });
      idx += count;
    }
    return results;
  }

  // Strategy 3: Try with N.X numbered patterns in the last part
  const tailContent = lines.slice(startLine).join('\n');
  const numberedMatches = tailContent.match(/(\d+)\.\s+([A-E])/g);
  if (numberedMatches && numberedMatches.length >= expectedTotal * 0.8) {
    const answers = numberedMatches.map(m => {
      const parsed = m.match(/\d+\.\s+([A-E])/);
      return parsed[1];
    });
    const results = [];
    let idx = 0;
    for (const section of sections) {
      const count = Math.min(section.count, answers.length - idx);
      if (count <= 0) break;
      results.push({
        subjectId: section.subjectId,
        answers: answers.slice(idx, idx + count),
      });
      idx += count;
    }
    return results;
  }

  return [];
}

/**
 * Check if there are actual answers between section headers
 */
function checkAnswersBetweenHeaders(lines, headers) {
  if (headers.length < 2) return false;

  for (let h = 0; h < headers.length - 1; h++) {
    const start = headers[h].line + 1;
    const end = headers[h + 1].line;
    let answerCount = 0;

    for (let i = start; i < end && i < lines.length; i++) {
      const t = lines[i].trim();
      if (/^[A-E]$/.test(t) || /^\d+\.\s+[A-E]\s*$/.test(t)) {
        answerCount++;
      }
    }

    if (answerCount >= 5) return true;
  }

  return false;
}

/**
 * Parse answers from sectioned format: headers with answers between/after them
 */
function parseSectionedAnswers(lines, headers, examType) {
  const sections = examType === 'TYT' ? TYT_SECTIONS : AYT_SECTIONS;
  const results = [];

  for (let h = 0; h < headers.length; h++) {
    const start = headers[h].line + 1;
    const end = h < headers.length - 1 ? headers[h + 1].line : lines.length;
    const sectionKey = headers[h].section;

    const answers = [];
    for (let i = start; i < end; i++) {
      const t = lines[i].trim();
      // "N.  X" format
      const numbered = t.match(/^\d+\.\s+([A-E])\s*$/);
      if (numbered) { answers.push(numbered[1]); continue; }
      // Single letter
      if (/^[A-E]$/.test(t)) { answers.push(t); continue; }
    }

    if (answers.length > 0) {
      const section = sections.find(s => s.name === sectionKey);
      if (section) {
        results.push({ subjectId: section.subjectId, answers });
      }
    }
  }

  return results;
}

/**
 * Parse flat format: section headers listed first, then all answers as single letters
 * Common in 2018-2023 files
 */
function parseFlatAnswers(lines, headers, examType) {
  const sections = examType === 'TYT' ? TYT_SECTIONS : AYT_SECTIONS;

  // Collect all single letters after the first header
  const startLine = headers[0].line;
  const allAnswers = [];

  // First, try to find answers grouped by section headers
  // Check if answers are between/after section headers
  const sectionGroups = [];
  let currentHeader = null;
  let currentAnswers = [];

  for (let i = startLine; i < lines.length; i++) {
    const t = lines[i].trim();
    const section = detectSectionHeader(lines[i]);

    if (section) {
      if (currentHeader && currentAnswers.length > 0) {
        sectionGroups.push({ section: currentHeader, answers: [...currentAnswers] });
      }
      currentHeader = section;
      currentAnswers = [];
      continue;
    }

    // Skip noise
    if (/^[ÖÖ]$|^SY$|^M$|^ÖS$|^ÖSY$|^ÖSYM$/i.test(t)) continue;
    if (/^\d+\.$/.test(t)) continue;
    if (!t) continue;

    if (/^[A-E]$/.test(t)) {
      currentAnswers.push(t);
    }
  }

  if (currentHeader && currentAnswers.length > 0) {
    sectionGroups.push({ section: currentHeader, answers: [...currentAnswers] });
  }

  // If we got good section groups, use them
  if (sectionGroups.length >= 2) {
    const results = [];
    for (const group of sectionGroups) {
      const section = sections.find(s => s.name === group.section);
      if (section) {
        results.push({ subjectId: section.subjectId, answers: group.answers });
      }
    }
    if (results.length > 0) return results;
  }

  // Fallback: collect all single letters and distribute by section sizes
  for (let i = startLine; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^[A-E]$/.test(t)) allAnswers.push(t);
  }

  if (allAnswers.length === 0) return [];

  const results = [];
  let idx = 0;
  for (const section of sections) {
    const count = Math.min(section.count, allAnswers.length - idx);
    if (count <= 0) break;
    results.push({
      subjectId: section.subjectId,
      answers: allAnswers.slice(idx, idx + count),
    });
    idx += count;
  }

  return results;
}

/**
 * Parse compressed format: "1.B1.D1.A1.E2.A2.E..."
 * Answers are interleaved columns (one per section).
 * Columns collapse as shorter sections end.
 */
function parseCompressedAnswers(content, examType) {
  const sections = examType === 'TYT' ? TYT_SECTIONS : AYT_SECTIONS;

  // Extract all N.X matches in order
  const matches = [];
  const regex = /(\d+)\.\s*\n*([A-E])/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push({ num: parseInt(m[1]), letter: m[2] });
  }

  if (matches.length === 0) return [];

  // For each question number, determine which sections are still active
  // and map the N-th occurrence to the N-th active section
  const sectionAnswers = {};
  for (const s of sections) {
    sectionAnswers[s.subjectId] = [];
  }

  const seen = {};  // tracks occurrence count per question number

  for (const { num, letter } of matches) {
    if (!seen[num]) seen[num] = 0;
    const occurrenceIdx = seen[num];
    seen[num]++;

    // Determine which sections are active for this question number
    const activeSections = sections.filter(s => num <= s.count);

    if (occurrenceIdx < activeSections.length) {
      const targetSection = activeSections[occurrenceIdx];
      sectionAnswers[targetSection.subjectId].push(letter);
    }
  }

  // Build results
  const results = [];
  for (const s of sections) {
    if (sectionAnswers[s.subjectId].length > 0) {
      results.push({
        subjectId: s.subjectId,
        answers: sectionAnswers[s.subjectId],
      });
    }
  }

  return results;
}

/**
 * Main: parse all files and insert into DB
 */
function seedExamQuestions(db) {
  const examDir = '/tmp/yksler';
  if (!fs.existsSync(examDir)) {
    console.log('YKS sinav dosyalari bulunamadi (/tmp/yksler)');
    return 0;
  }

  const insert = db.prepare(`INSERT OR IGNORE INTO questions
    (id, subject_id, topic_id, exam_year, exam_type, exam_name, question_number,
     question_text, option_a, option_b, option_c, option_d, option_e,
     correct_answer, solution_text, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  let totalInserted = 0;
  const files = fs.readdirSync(examDir).filter(f => f.endsWith('.txt'));

  for (const filename of files) {
    const info = FILE_MAP[filename];
    if (!info) continue;

    const filePath = path.join(examDir, filename);
    const buffer = fs.readFileSync(filePath);
    const content = normalizeContent(buffer);

    const sectionResults = extractAnswers(content, info.type);

    if (sectionResults.length === 0) {
      console.log(`  ! ${filename}: Cevap anahtari bulunamadi`);
      continue;
    }

    const examName = `${info.year} ${info.type}`;
    let fileInserted = 0;

    // Assign global question numbers
    let globalNum = 1;
    const sectionOrder = info.type === 'TYT' ? TYT_SECTIONS : AYT_SECTIONS;

    for (const sectionDef of sectionOrder) {
      const result = sectionResults.find(r => r.subjectId === sectionDef.subjectId);
      if (result) {
        for (let i = 0; i < result.answers.length; i++) {
          const answer = result.answers[i];
          if (!answer) { globalNum++; continue; }

          const id = `yks-${info.type.toLowerCase()}-${info.year}-${globalNum}`;
          const qText = `${examName} - Soru ${globalNum}`;
          const difficulty = Math.floor(Math.random() * 3) + 2;

          insert.run(
            id, sectionDef.subjectId, null, info.year, info.type, examName, globalNum,
            qText, '', '', '', '', '',
            answer, '', difficulty
          );
          fileInserted++;
          globalNum++;
        }
      } else {
        globalNum += sectionDef.count;
      }
    }

    totalInserted += fileInserted;
    console.log(`  ${filename}: ${fileInserted} cevap yuklendi`);
  }

  return totalInserted;
}

module.exports = seedExamQuestions;
