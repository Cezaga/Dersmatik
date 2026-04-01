/**
 * YKS Sınav Dosyası Parser
 * /tmp/yksler/ klasöründeki txt dosyalarını okuyup veritabanına ekler
 */
const fs = require('fs');
const path = require('path');

// TYT section config: subject_id, question range
const TYT_SECTIONS = [
  { name: 'Türkçe', subjectId: 'tyt-turkce', start: 1, end: 40 },
  { name: 'Sosyal Bilimler', subjectId: 'tyt-sosyal', start: 41, end: 65 },  // 25 soru (2020+ 20 soru olabilir)
  { name: 'Temel Matematik', subjectId: 'tyt-mat', start: 61, end: 100 },
  { name: 'Fen Bilimleri', subjectId: 'tyt-fen', start: 101, end: 120 },
];

// AYT section config
const AYT_SECTIONS = [
  { name: 'Sosyal Bilimler-1', subjectId: 'ayt-sosyal1', start: 1, end: 40 },
  { name: 'Sosyal Bilimler-2', subjectId: 'ayt-sosyal2', start: 41, end: 80 },
  { name: 'Matematik', subjectId: 'ayt-mat', start: 81, end: 120 },
  { name: 'Fen Bilimleri', subjectId: 'ayt-fen', start: 121, end: 160 },
];

// File mapping: filename -> { year, type }
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
 * Extract answer key from file content
 * Handles two formats:
 * 1. Clean: single letter per line (A\nB\nC...)
 * 2. Compressed: "1.B1.D1.A1.E2.A2.E..." format
 */
function extractAnswerKey(content, expectedCount) {
  const lines = content.split('\n');

  // Try format 1: single letters at end of file
  const singleLetters = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (/^[A-E]$/.test(trimmed)) {
      singleLetters.unshift(trimmed);
    } else if (singleLetters.length > 0 && trimmed.length > 0 && !/^\d+\.$/.test(trimmed) && !/^(Ö|SY|M)$/.test(trimmed)) {
      // Hit non-answer content, check if we have enough
      if (singleLetters.length >= expectedCount * 0.8) break;
      // Reset if not enough - might be in a different section
      if (singleLetters.length < 10) {
        singleLetters.length = 0;
      } else {
        break;
      }
    }
  }

  if (singleLetters.length >= expectedCount * 0.8) {
    return singleLetters;
  }

  // Try format 2: compressed "1.B2.A3.E..." at end of file
  // Look in last 500 chars
  const tail = content.slice(-3000);
  // Match patterns like "1.B" or "1.  B" or "1.B1.D"
  const compressed = tail.match(/\d+\.\s*[A-E]/g);
  if (compressed && compressed.length >= expectedCount * 0.8) {
    // Parse into ordered answers
    const answerMap = {};
    for (const match of compressed) {
      const m = match.match(/(\d+)\.\s*([A-E])/);
      if (m) {
        const num = parseInt(m[1]);
        answerMap[num] = m[2];
      }
    }
    // Build ordered array
    const answers = [];
    for (let i = 1; i <= expectedCount; i++) {
      answers.push(answerMap[i] || null);
    }
    return answers;
  }

  // Try format 3: mixed compressed across sections at end
  // Pattern: "TÜRKÇE TESTİ\n\n1.B\n2.A..." or "1.B1.D1.A1.E2.A2.E..."
  const lastPart = content.slice(-5000);
  const allAnswers = [];
  const matches = lastPart.match(/[A-E]/g);
  if (matches && matches.length >= expectedCount) {
    // Take last expectedCount letters
    return matches.slice(-expectedCount);
  }

  return singleLetters.length > 0 ? singleLetters : [];
}

/**
 * Parse questions from file content
 * Returns array of { number, text, options: {A,B,C,D,E}, sectionName }
 */
function parseQuestions(content) {
  const lines = content.split('\n');
  const questions = [];
  let currentQ = null;
  let currentOption = null;
  let inAnswerSection = false;

  // Detect answer section start (usually after "TEST BİTTİ" or "CEVAPLARINIZI KONTROL")
  const answerSectionIdx = content.search(/TEST\s*B[İIi]TT[İIi]|CEVAPLARINIZI\s*KONTROL|SINAVDA UYULACAK/i);
  const questionContent = answerSectionIdx > 0 ? content.substring(0, answerSectionIdx) : content;
  const qLines = questionContent.split('\n');

  // Track section (Türkçe, Sosyal, Matematik, Fen)
  let currentSection = '';
  let globalQuestionNumber = 0;
  let sectionQuestionBase = 0;

  for (let i = 0; i < qLines.length; i++) {
    const line = qLines[i];
    const trimmed = line.trim();

    // Skip empty lines and ÖSYM markers
    if (!trimmed || /^(Ö|SY|M|ÖS|ÖSY|ÖSYM|Bu\s*so)$/.test(trimmed)) continue;
    if (/^(Bu|so|la|ru|hi|te|S|Y|ak|s|ız|ın|M|li|çb|ir|ki|şi|ur|um|ve|ya|ku|ru|lu|ş|ta|ra|fın|da|n|ku|lla)$/.test(trimmed)) continue;

    // Detect section headers
    if (/T[ÜU]RK[ÇC]E\s*TEST[İIi]/i.test(trimmed)) {
      currentSection = 'Türkçe';
      sectionQuestionBase = 0;
      continue;
    }
    if (/SOSYAL\s*B[İIi]L[İIi]MLER\s*TEST[İIi]/i.test(trimmed)) {
      currentSection = 'Sosyal Bilimler';
      if (globalQuestionNumber <= 40) sectionQuestionBase = 40;
      continue;
    }
    if (/TEMEL\s*MATEMAT[İIi]K\s*TEST[İIi]/i.test(trimmed)) {
      currentSection = 'Temel Matematik';
      sectionQuestionBase = currentSection === 'Temel Matematik' ? 60 : 0; // TYT: after Sosyal (25)
      continue;
    }
    if (/^MATEMAT[İIi]K\s*TEST[İIi]/i.test(trimmed) && !/TEMEL/.test(trimmed)) {
      currentSection = 'Matematik';
      continue;
    }
    if (/FEN\s*B[İIi]L[İIi]MLER[İIi]\s*TEST[İIi]/i.test(trimmed)) {
      currentSection = 'Fen Bilimleri';
      continue;
    }

    // Skip instruction lines
    if (/^\d+\.\s*(Bu testte|Cevaplarınızı|Bu test)/.test(trimmed)) continue;
    if (/^Bu testte/.test(trimmed)) continue;

    // Detect question start: number followed by period at start of line
    const qMatch = trimmed.match(/^(\d{1,3})\.\s+(.+)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      // Valid question number check
      if (qNum >= 1 && qNum <= 160) {
        // Save previous question
        if (currentQ && currentQ.text.length > 10) {
          questions.push(currentQ);
        }

        globalQuestionNumber = qNum + sectionQuestionBase;
        // For TYT, each section resets to 1
        // We need to figure out global number based on section

        currentQ = {
          number: globalQuestionNumber || qNum,
          localNumber: qNum,
          text: qMatch[2],
          options: {},
          section: currentSection
        };
        currentOption = null;
        continue;
      }
    }

    // Detect options: A) B) C) D) E) at start of line
    const optMatch = trimmed.match(/^([A-E])\)\s*(.*)/);
    if (optMatch && currentQ) {
      currentOption = optMatch[1];
      currentQ.options[currentOption] = optMatch[2];
      continue;
    }

    // Continue current option or question text
    if (currentQ) {
      if (currentOption && currentQ.options[currentOption] !== undefined) {
        currentQ.options[currentOption] += ' ' + trimmed;
      } else {
        currentQ.text += ' ' + trimmed;
      }
    }
  }

  // Save last question
  if (currentQ && currentQ.text.length > 10) {
    questions.push(currentQ);
  }

  return questions;
}

/**
 * Get subject_id for a question based on its global number and exam type
 */
function getSubjectId(globalNum, examType) {
  if (examType === 'TYT') {
    if (globalNum <= 40) return 'tyt-turkce';
    if (globalNum <= 65) return 'tyt-sosyal';
    if (globalNum <= 105) return 'tyt-mat';
    return 'tyt-fen';
  } else {
    // AYT: Sos1(1-40), Sos2(41-80), Mat(81-120), Fen(121-160)
    if (globalNum <= 40) return 'ayt-sosyal1';
    if (globalNum <= 80) return 'ayt-sosyal2';
    if (globalNum <= 120) return 'ayt-mat';
    return 'ayt-fen';
  }
}

function getSubjectName(subjectId) {
  const map = {
    'tyt-turkce': 'Türkçe',
    'tyt-sosyal': 'Sosyal Bilimler',
    'tyt-mat': 'Temel Matematik',
    'tyt-fen': 'Fen Bilimleri',
    'ayt-sosyal1': 'Sosyal Bilimler-1',
    'ayt-sosyal2': 'Sosyal Bilimler-2',
    'ayt-mat': 'Matematik',
    'ayt-fen': 'Fen Bilimleri',
  };
  return map[subjectId] || subjectId;
}

/**
 * Main: parse all files and insert into DB
 */
function seedExamQuestions(db) {
  const examDir = '/tmp/yksler';
  if (!fs.existsSync(examDir)) {
    console.log('YKS sınav dosyaları bulunamadı (/tmp/yksler)');
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
    const content = fs.readFileSync(filePath, 'utf-8');

    const expectedCount = info.type === 'TYT' ? 125 : 160;
    const answerKey = extractAnswerKey(content, expectedCount);

    if (answerKey.length === 0) {
      console.log(`  ⚠ ${filename}: Cevap anahtarı bulunamadı`);
      continue;
    }

    const questions = parseQuestions(content);
    console.log(`  📄 ${filename}: ${questions.length} soru parse edildi, ${answerKey.length} cevap bulundu`);

    // Match questions with answers
    // Strategy: use parsed questions where available, create placeholder for missing
    const examName = `${info.year} ${info.type}`;

    for (let i = 0; i < answerKey.length; i++) {
      if (!answerKey[i]) continue;

      const globalNum = i + 1;
      const subjectId = getSubjectId(globalNum, info.type);
      const id = `yks-${info.type.toLowerCase()}-${info.year}-${globalNum}`;

      // Find matching parsed question
      let question = questions.find(q => {
        // Try to match by global number or local section number
        if (q.number === globalNum) return true;
        return false;
      });

      // If no match found, try by local number + section
      if (!question) {
        const sectionName = getSubjectName(subjectId);
        question = questions.find(q => {
          if (q.section && q.section.includes(sectionName.split(' ')[0]) && q.localNumber === getLocalNumber(globalNum, info.type)) return true;
          return false;
        });
      }

      const qText = question ? cleanText(question.text) : `${examName} - Soru ${globalNum}`;
      const optA = question?.options?.A ? cleanText(question.options.A) : '';
      const optB = question?.options?.B ? cleanText(question.options.B) : '';
      const optC = question?.options?.C ? cleanText(question.options.C) : '';
      const optD = question?.options?.D ? cleanText(question.options.D) : '';
      const optE = question?.options?.E ? cleanText(question.options.E) : '';

      const difficulty = Math.floor(Math.random() * 3) + 2; // 2-4

      insert.run(
        id, subjectId, null, info.year, info.type, examName, globalNum,
        qText, optA, optB, optC, optD, optE,
        answerKey[i], '', difficulty
      );
      totalInserted++;
    }
  }

  return totalInserted;
}

function getLocalNumber(globalNum, examType) {
  if (examType === 'TYT') {
    if (globalNum <= 40) return globalNum;
    if (globalNum <= 65) return globalNum - 40;
    if (globalNum <= 105) return globalNum - 65;
    return globalNum - 105;
  } else {
    if (globalNum <= 40) return globalNum;
    if (globalNum <= 80) return globalNum - 40;
    if (globalNum <= 120) return globalNum - 80;
    return globalNum - 120;
  }
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/SY\s*M/g, '')
    .replace(/Ö\s*SY\s*M/g, '')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

module.exports = seedExamQuestions;
