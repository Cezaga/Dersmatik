import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Brain, BookOpen, Mic, Camera, FileText, ChevronRight, Sparkles, Volume2, Copy, Check } from 'lucide-react';

interface Subject { id: string; name: string; exam_type: string; icon: string; category?: string; }
interface Topic { id: string; name: string; }

// Pre-built topic summaries for common YKS topics
const TOPIC_SUMMARIES: Record<string, string> = {
  'Sözcükte Anlam': `**Sözcükte Anlam**\n\nSözcükler; gerçek (temel), yan, mecaz ve terim anlamlarıyla kullanılır.\n\n• **Gerçek Anlam:** Sözcüğün ilk ve temel anlamı. "Su soğuk." → soğuk: sıcaklığı düşük\n• **Yan Anlam:** Benzetme yoluyla kazanılan anlam. "Masanın ayağı" → ayak: destek kısmı\n• **Mecaz Anlam:** Gerçek anlamından uzaklaşmış. "Sözleri çok ağır." → ağır: kırıcı\n• **Terim Anlam:** Bilim/sanat dalına özel. "Üçgenin açısı" → açı: geometri terimi\n\n📌 **Eşanlamlı (Anlamdaş):** Farklı sözcük, aynı anlam (yürek-kalp)\n📌 **Zıt Anlamlı:** Karşıt anlam (güzel-çirkin)\n📌 **Eş Sesli:** Aynı yazılış, farklı anlam (yüz: sayı / yüz: çehre)\n📌 **Somut:** Beş duyuyla algılanan (masa, ses)\n📌 **Soyut:** Düşünceyle algılanan (sevgi, korku)`,
  'Paragraf': `**Paragraf**\n\nParagraf soruları YKS'nin en önemli konusudur.\n\n**Ana Düşünce:** Paragrafın temel mesajı. Genellikle son cümlede verilir.\n**Yardımcı Düşünce:** Ana düşünceyi destekleyen fikirler.\n\n📌 **Soru Türleri:**\n• Konu: "Bu paragrafta neden söz edilmektedir?"\n• Ana düşünce: "Paragrafın ana düşüncesi nedir?"\n• Başlık: "Bu paragrafın başlığı ne olabilir?"\n• Çıkarım: "Bu paragraftan çıkarılabilecek sonuç..."\n\n💡 **Taktikler:**\n1. Önce soruyu oku, sonra paragrafı\n2. Anahtar kelimeleri işaretle\n3. "Ama, ancak, oysa, fakat" gibi bağlaçlara dikkat\n4. Son cümleye özellikle dikkat et`,
  'EBOB-EKOK': `**EBOB ve EKOK**\n\n**EBOB (En Büyük Ortak Bölen):**\nİki veya daha fazla sayıyı tam bölen en büyük sayı.\n\n**EKOK (En Küçük Ortak Kat):**\nİki veya daha fazla sayının ortak katı olan en küçük sayı.\n\n📌 **Formül:** EBOB(a,b) × EKOK(a,b) = a × b\n\n**Örnek:** 12 ve 18\n12 = 2² × 3\n18 = 2 × 3²\nEBOB = 2¹ × 3¹ = 6 (küçük üsler)\nEKOK = 2² × 3² = 36 (büyük üsler)\n\n💡 **İpucu:** EBOB bölme, paylaştırma problemlerinde; EKOK buluşma, tekrarlama problemlerinde kullanılır.`,
  'Kuvvet ve Hareket': `**Kuvvet ve Hareket (Fizik)**\n\n**Newton Yasaları:**\n\n1️⃣ **1. Yasa (Eylemsizlik):** Cisme net kuvvet etki etmezse, cisim durağansa durağan, hareketliyse sabit hızla hareket eder.\n\n2️⃣ **2. Yasa:** F = m × a\n• F: Kuvvet (Newton, N)\n• m: Kütle (kg)\n• a: İvme (m/s²)\n\n3️⃣ **3. Yasa (Etki-Tepki):** Her etkiye eşit ve zıt yönde bir tepki vardır.\n\n**Sürtünme Kuvveti:** Fs = μ × N\n• μ: sürtünme katsayısı\n• N: normal kuvvet\n\n📌 **Önemli:** Kütle ile ağırlık farklıdır!\n• Kütle: m (kg) - değişmez\n• Ağırlık: G = m × g (Newton) - yere göre değişir`,
  'Hücre': `**Hücre (Biyoloji)**\n\n**Hücre Organelleri:**\n\n🔬 **Çekirdek:** DNA'yı barındırır, hücrenin yönetim merkezi\n🔬 **Mitokondri:** Hücresel solunum, ATP üretimi (enerji santrali)\n🔬 **Ribozom:** Protein sentezi\n🔬 **ER (Endoplazmik Retikulum):**\n  - Granüllü ER: Protein taşıma\n  - Granülsüz ER: Yağ sentezi\n🔬 **Golgi:** Paketleme ve salgılama\n🔬 **Lizozom:** Hücre içi sindirim\n🔬 **Kloroplast:** Fotosentez (sadece bitki)\n🔬 **Koful:** Depolama\n\n📌 **Prokaryot vs Ökaryot:**\n• Prokaryot: Çekirdek zarı YOK (bakteri)\n• Ökaryot: Çekirdek zarı VAR (hayvan, bitki, mantar)`,
  'Türev': `**Türev (AYT Matematik)**\n\n**Türev Kuralları:**\n• f(x) = c → f'(x) = 0\n• f(x) = xⁿ → f'(x) = n·xⁿ⁻¹\n• f(x) = eˣ → f'(x) = eˣ\n• f(x) = ln(x) → f'(x) = 1/x\n• f(x) = sin(x) → f'(x) = cos(x)\n• f(x) = cos(x) → f'(x) = -sin(x)\n\n**Çarpım Kuralı:** (f·g)' = f'·g + f·g'\n**Bölüm Kuralı:** (f/g)' = (f'·g - f·g') / g²\n**Zincir Kuralı:** [f(g(x))]' = f'(g(x))·g'(x)\n\n📌 **Geometrik Yorum:**\nTürev, eğrinin belirli noktadaki teğetinin eğimidir.\n\n💡 **Maksimum/Minimum:**\nf'(x) = 0 noktalarında ekstremum olabilir.\nf''(x) > 0 → minimum, f''(x) < 0 → maksimum`,
};

const PODCAST_TEXTS: Record<string, string> = {
  'Matematik': 'Merhaba! Bugün matematik dünyasına bir yolculuk yapacağız. Sayılar, evrenin dili olarak bilinir. Pitagoras\'tan Euler\'e, Newton\'dan Gauss\'a kadar büyük matematikçiler bu dili çözmek için ömürlerini harcadılar. YKS\'de karşınıza çıkacak matematik soruları da aslında bu evrensel dilin küçük bir parçası...',
  'Fizik': 'Fizik, doğanın temel yasalarını inceleyen bilim dalıdır. Newton\'un elma hikayesinden kuantum mekaniğine, Einstein\'ın görelilik teorisinden karanlık maddeye kadar uzanan büyüleyici bir yolculuk. Bugün kuvvet ve hareket konusunu podcast formatında keşfedeceğiz...',
  'Kimya': 'Kimya, maddenin yapısını ve dönüşümlerini inceler. Mendeleev\'in periyodik tablosundan modern kimyaya uzanan bu yolculukta, atomların nasıl birleştiğini, moleküllerin nasıl oluştuğunu keşfedeceğiz...',
  'Biyoloji': 'Canlıların dünyasına hoş geldiniz! Hücre, yaşamın temel yapı taşıdır. Milyarlarca yıllık evrim sürecinde, basit tek hücreli organizmalardan karmaşık çok hücreli canlılara uzanan inanılmaz bir yolculuk...',
};

export default function AITutorPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [podcastText, setPodcastText] = useState('');
  const [showPodcast, setShowPodcast] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);

  useEffect(() => {
    api.get<Subject[]>('/questions/subjects').then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      api.get<Topic[]>(`/questions/subjects/${selectedSubject}/topics`).then(setTopics).catch(() => {});
    }
  }, [selectedSubject]);

  const generateSummary = () => {
    const topic = topics.find(t => t.id === selectedTopic);
    if (!topic) return;

    // Check pre-built summaries first
    const found = Object.entries(TOPIC_SUMMARIES).find(([key]) => topic.name.includes(key) || key.includes(topic.name));
    if (found) {
      setSummary(found[1]);
    } else {
      setSummary(`**${topic.name}**\n\nBu konu hakkında özet hazırlanıyor...\n\n📌 Bu konuyla ilgili soru çözerek pratik yapmanızı öneririz.\n💡 Flashcard oluşturarak önemli bilgileri ezberleyebilirsiniz.\n📖 Formüller sayfasından ilgili formülleri kontrol edin.\n\n🎯 **Çalışma Önerisi:**\n1. Önce konu anlatımını okuyun\n2. Çözümlü örnekler üzerinden pratik yapın\n3. Test soruları çözün\n4. Yanlışlarınızı analiz edin`);
    }
  };

  const startPodcast = () => {
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;
    const category = subject.category || subject.name;
    const text = PODCAST_TEXTS[category] || PODCAST_TEXTS['Matematik'];
    setPodcastText(text);
    setShowPodcast(true);

    // Text-to-Speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopPodcast = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const copyText = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles size={24} className="text-primary-400" /> AI Ders Asistanı</h1>

      {/* Subject/Topic Selection */}
      <div className="bg-dark-800 rounded-2xl p-4 border border-dark-700 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic(''); setSummary(''); }}
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white">
            <option value="">Ders Seçin</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name} ({s.exam_type})</option>)}
          </select>
          <select value={selectedTopic} onChange={e => { setSelectedTopic(e.target.value); setSummary(''); }}
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white" disabled={!selectedSubject}>
            <option value="">Konu Seçin</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedTopic && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={generateSummary} className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-primary-500/50 transition text-center">
            <FileText size={24} className="text-primary-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Konu Özeti</div>
          </button>
          <button onClick={startPodcast} className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-green-500/50 transition text-center">
            <Mic size={24} className="text-green-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Podcast Modu</div>
          </button>
          <button onClick={() => setPhotoMode(!photoMode)} className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-yellow-500/50 transition text-center">
            <Camera size={24} className="text-yellow-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Fotoğraf Çöz</div>
          </button>
          <button onClick={() => { window.location.href = `/questions?topic=${selectedTopic}`; }} className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-blue-500/50 transition text-center">
            <BookOpen size={24} className="text-blue-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Soru Çöz</div>
          </button>
        </div>
      )}

      {/* Photo Solver */}
      {photoMode && (
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 space-y-4 animate-slide-up">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Camera size={20} /> Fotoğrafla Soru Çöz</h3>
          <p className="text-sm text-dark-400">Sorunun fotoğrafını çekin veya yükleyin, AI asistan çözümü göstersin.</p>
          <div className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center">
            <Camera size={48} className="text-dark-500 mx-auto mb-3" />
            <label className="cursor-pointer">
              <span className="px-6 py-3 bg-primary-600 rounded-xl text-sm font-medium inline-block hover:bg-primary-500 transition">
                Fotoğraf Yükle
              </span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSummary('📸 Fotoğraf alındı!\n\nSoru analiz ediliyor...\n\n💡 Bu özellik şu anda geliştirme aşamasındadır. Yakında AI destekli soru çözüm asistanı aktif olacak!\n\nŞimdilik soruyu manuel olarak Soru Bankası\'ndan arayabilirsiniz.');
                }
              }} />
            </label>
            <p className="text-xs text-dark-500 mt-3">JPG, PNG formatları desteklenir</p>
          </div>
        </div>
      )}

      {/* Podcast Player */}
      {showPodcast && (
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/30 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Mic size={20} /> Podcast Modu</h3>
            <button onClick={() => { stopPodcast(); setShowPodcast(false); }} className="text-sm text-dark-400 hover:text-white">Kapat</button>
          </div>
          <p className="text-sm text-dark-300 leading-relaxed mb-4">{podcastText}</p>
          <div className="flex gap-2">
            {isSpeaking ? (
              <button onClick={stopPodcast} className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                <Volume2 size={16} /> Durdur
              </button>
            ) : (
              <button onClick={startPodcast} className="px-4 py-2 bg-green-600/20 text-green-400 rounded-xl text-sm flex items-center gap-2">
                <Volume2 size={16} /> Dinle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Display */}
      {summary && (
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Konu Özeti</h3>
            <button onClick={copyText} className="flex items-center gap-1 text-sm text-dark-400 hover:text-white">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {summary.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) return <h3 key={i} className="text-lg font-bold text-primary-400 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
              if (line.startsWith('•') || line.startsWith('📌') || line.startsWith('💡') || line.startsWith('🎯') || line.startsWith('🔬') || line.startsWith('1️⃣') || line.startsWith('2️⃣') || line.startsWith('3️⃣')) return <p key={i} className="ml-2 mb-1">{line}</p>;
              return <p key={i} className="mb-1">{line}</p>;
            })}
          </div>
        </div>
      )}

      {!selectedSubject && (
        <div className="text-center py-12">
          <Brain size={48} className="text-dark-500 mx-auto mb-4" />
          <p className="text-dark-400">Bir ders ve konu seçerek AI asistanı kullanmaya başlayın</p>
        </div>
      )}
    </div>
  );
}
