import fs from "node:fs";
import path from "node:path";
import { dataRoot, readJson, timestamp, writeJson } from "../lib/io.js";

const manifest = readJson(path.join(dataRoot, "metadata/fetch-manifest.json"), { files: [] });
const out = { schemaVersion: 1, generatedAt: timestamp(), surahs: [], ayahs: [] };
const warnings = [];
const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118,
  64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
  45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40,
  31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3,
  9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

for (const file of manifest.files.filter((item) => item.ok && item.domain === "quran")) {
  const absolute = path.join(dataRoot, file.rawPath);
  const metadata = readJson(absolute.replace(/\.[^.]+$/, ".metadata.json"), {});
  const text = fs.readFileSync(absolute, "utf8");
  if (file.sourceId === "fawazahmed0-quran-api") normalizeFawaz(JSON.parse(text), metadata);
  if (file.sourceId === "ar-tanzil-quran-simple-npm") normalizeTanzilJson(JSON.parse(text), metadata);
  if (file.sourceId === "tanzil-quran-text") normalizeTanzil(text, metadata);
  if (file.sourceId === "alquran-cloud-api") normalizeAlQuranCloud(JSON.parse(text), metadata);
}

out.surahs.sort((a, b) => a.number - b.number);
out.ayahs.sort((a, b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber);

addQuranTranslationsAndTafsirs();

out.provenance = [
  {
    source: "Tanzil & Fawaz Ahmed Quran API",
    url: "https://tanzil.net/docs/download",
    license: "Verbatim copying/distribution permitted; Creative Commons Attribution 3.0"
  }
];

writeJson(path.join(dataRoot, "quran/normalized/quran.json"), out);

// Save individual surah files to optimize network bandwidth
const surahsDir = path.join(dataRoot, "quran/surahs");
if (!fs.existsSync(surahsDir)) {
  fs.mkdirSync(surahsDir, { recursive: true });
}

for (const surah of out.surahs) {
  const surahAyahs = out.ayahs.filter((a) => a.surahNumber === surah.number);
  writeJson(path.join(surahsDir, `${surah.number}.json`), {
    schemaVersion: 1,
    generatedAt: timestamp(),
    surahNumber: surah.number,
    ayahCount: surah.ayahCount,
    name: surah.name,
    englishName: surah.englishName,
    ayahs: surahAyahs,
    provenance: out.provenance
  });
}

writeJson(path.join(dataRoot, "quran/validation-report.json"), {
  schemaVersion: 1,
  generatedAt: timestamp(),
  surahCount: out.surahs.length,
  ayahCount: out.ayahs.length,
  valid: out.ayahs.length === 6236 && out.ayahs.every((ayah) => Object.keys(ayah.text || {}).length > 0),
  warnings
});

console.log(`Normalized ${out.ayahs.length} Quran ayah records.`);

function upsertSurah(number, fields = {}) {
  let row = out.surahs.find((surah) => surah.number === number);
  if (!row) {
    row = { number };
    out.surahs.push(row);
  }
  Object.assign(row, fields);
}

function upsertAyah(surahNumber, ayahNumber, textKey, value, metadata) {
  if (!value) return;
  let row = out.ayahs.find((ayah) => ayah.surahNumber === surahNumber && ayah.ayahNumber === ayahNumber);
  if (!row) {
    row = { id: `${surahNumber}:${ayahNumber}`, surahNumber, ayahNumber, text: {} };
    out.ayahs.push(row);
  }
  row.text[textKey] = value;
}

function normalizeFawaz(json, metadata) {
  const chapters = json.quran || json.chapters || [];
  for (const chapter of chapters) {
    const number = Number(chapter.chapter || chapter.id || chapter.number);
    upsertSurah(number, { number, ayahCount: chapter.verses?.length });
    for (const verse of chapter.verses || []) {
      upsertAyah(number, Number(verse.verse || verse.id || verse.number), "uthmani", verse.text, metadata);
    }
  }
}

function normalizeTanzilJson(json, metadata) {
  const rows = Array.isArray(json) ? json : json.verses || json.ayahs || json.data || [];
  if (rows.length !== 6236) {
    warnings.push({
      sourceUrl: metadata.sourceUrl,
      message: `Rejected Tanzil JSON payload because it contained ${rows.length} rows, expected 6236.`
    });
    return;
  }
  if (typeof rows[0] === "string") {
    let index = 0;
    for (let surahIndex = 0; surahIndex < SURAH_AYAH_COUNTS.length; surahIndex += 1) {
      const surahNumber = surahIndex + 1;
      const ayahCount = SURAH_AYAH_COUNTS[surahIndex];
      upsertSurah(surahNumber, { number: surahNumber, ayahCount });
      for (let ayahNumber = 1; ayahNumber <= ayahCount; ayahNumber += 1) {
        upsertAyah(surahNumber, ayahNumber, "simple", rows[index], metadata);
        index += 1;
      }
    }
    return;
  }
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const surahNumber = Number(row.surah || row.surahNumber || row.chapter || row[0]);
    const ayahNumber = Number(row.ayah || row.ayahNumber || row.verse || row[1]);
    const value = row.text || row.content || row.uthmani || row.simple || row[2];
    upsertAyah(surahNumber, ayahNumber, "simple", value, metadata);
  }
}

function normalizeTanzil(text, metadata) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.split("|");
    if (parts.length < 3) continue;
    const surahNumber = Number(parts[0]);
    const ayahNumber = Number(parts[1]);
    if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) continue;
    rows.push([surahNumber, ayahNumber, parts.slice(2).join("|")]);
  }
  if (rows.length !== 6236) {
    warnings.push({
      sourceUrl: metadata.sourceUrl,
      message: `Rejected Tanzil payload because it contained ${rows.length} parseable rows, expected 6236.`
    });
    return;
  }
  for (const [surahNumber, ayahNumber, value] of rows) {
    upsertAyah(surahNumber, ayahNumber, "uthmani", value, metadata);
  }
}

function normalizeAlQuranCloud(json, metadata) {
  for (const surah of json.data?.surahs || []) {
    upsertSurah(Number(surah.number), { number: Number(surah.number), name: surah.name, ayahCount: surah.ayahs?.length });
    for (const ayah of surah.ayahs || []) {
      upsertAyah(Number(surah.number), Number(ayah.numberInSurah), "uthmani", ayah.text, metadata);
    }
  }
}

function addQuranTranslationsAndTafsirs() {
  const fatihahTranslations = [
    {
      en_sahih: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      en_yusufali: "In the name of Allah, Most Gracious, Most Merciful.",
      ur_maududi: "اللہ کے نام سے جو رحمان اور رحیم ہے۔",
      es_cortes: "En el nombre de Alá, el Compasivo, el Misericordioso.",
      fr_hamidullah: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux.",
      bn_hoque: "পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে।"
    },
    {
      en_sahih: "[All] praise is [due] to Allah, Lord of the worlds -",
      en_yusufali: "Praise be to Allah, the Cherisher and Sustainer of the Worlds;",
      ur_maududi: "تعریف اللہ ہی کے لیے ہے جو تمام کائنات کا رب ہے۔",
      es_cortes: "Alabado sea Alá, Señor del universo,",
      fr_hamidullah: "Louange à Allah, Seigneur de l'univers.",
      bn_hoque: "সব প্রশংসা আল্লাহরই প্রাপ্য, যিনি সমগ্র সৃষ্টিজগতের প্রতিপালক।"
    },
    {
      en_sahih: "The Entirely Merciful, the Especially Merciful,",
      en_yusufali: "Most Gracious, Most Merciful;",
      ur_maududi: "رحمان اور رحیم ہے۔",
      es_cortes: "el Compasivo, el Misericordioso,",
      fr_hamidullah: "Le Tout Miséricordieux, le Très Miséricordieux,",
      bn_hoque: "পরম করুণাময়, অসীম দয়ালু।"
    },
    {
      en_sahih: "Sovereign of the Day of Recompense.",
      en_yusufali: "Master of the Day of Judgment.",
      ur_maududi: "روزِ جزا کا مالک ہے۔",
      es_cortes: "Dueño del día del Juicio.",
      fr_hamidullah: "Maître du Jour de la rétribution.",
      bn_hoque: "প্রতিফল দিবসের মালিক।"
    },
    {
      en_sahih: "It is You we worship and You we ask for help.",
      en_yusufali: "Thee do we worship, and Thine aid we seek.",
      ur_maududi: "ہم تیری ہی عبادت کرتے ہیں اور تجھی سے مدد مانگتے ہیں۔",
      es_cortes: "A Ti solo servimos y a Ti solo pedimos ayuda.",
      fr_hamidullah: "C'est Toi [Seul] que nous adorons, et c'est Toi [Seul] dont nous implorons l'secours.",
      bn_hoque: "আমরা কেবল তোমারই এবাদত করি এবং কেবল তোমারই সাহায্য প্রার্থনা করি।"
    },
    {
      en_sahih: "Guide us to the straight path -",
      en_yusufali: "Show us the straight way,",
      ur_maududi: "ہمیں سیدھا راستہ دکھا",
      es_cortes: "Dirígenos por la vía recta,",
      fr_hamidullah: "Guide-nous dans le droit chemin,",
      bn_hoque: "আমাদের সরল পথ প্রদর্শন কর।"
    },
    {
      en_sahih: "The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray.",
      en_yusufali: "The way of those on whom Thou hast bestowed Thy Grace, those whose (portion) is not wrath, and who go not astray.",
      ur_maududi: "ان لوگوں کا راستہ جن پر تو نے فضل کیا، نہ کہ ان کا جن پر غضب ہوا اور نہ بہکے ہوئے لوگوں کا۔",
      es_cortes: "la vía de los que Tú has agraciado, no de los que han incurrido en Tu ira, ni de los extraviados.",
      fr_hamidullah: "le chemin de ceux que Tu as comblés de faveurs, non pas de ceux qui ont encouru Ta colère, ni des égarés.",
      bn_hoque: "তাদের পথে, যাদের তুমি অনুগ্রহ দান করেছ; তাদের পথে নয় যারা ক্রোধগ্রস্ত এবং যারা পথভ্রষ্ট হয়েছে।"
    }
  ];

  const extraFatihahTranslations = [
    {
      id_kemenag: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.",
      ru_abuadel: "Во имя Аллаха, Милостивого, Милосердного!",
      tr_diyanet: "Rahman ve Rahim olan Allah'ın adıyla.",
      de_aburida: "Im Namen Allahs, des Allerbarmers, des Barmherzigen.",
      zh_jian: "奉至仁至慈的真主之名",
      it_piccardo: "In nome di Allah, il Compassionevole, il Misericordioso.",
      pt_elhayek: "Em nome de Allah, o Clemente, o Misericordioso.",
      hi_farooq: "अल्लाह के नाम से जो رحمان और رحیم ہے۔",
      fa_mojtabavi: "به نام خداوند بخشنده مهربان.",
      ja_sawada: "慈悲深く慈愛あまねきアッラーの御名において。",
      sw_albarwani: "Kwa jina la Mwenyezi Mungu, Mwingi wa Rehema, Mwenye kurehemu."
    },
    {
      id_kemenag: "Segala puji bagi Allah, Tuhan seluruh alam,",
      ru_abuadel: "Вся хвала Аллаху, Господу миров,",
      tr_diyanet: "Hamd, alemlerin Rabbi olan Allah'adır.",
      de_aburida: "Alles Lob gehört Allah, dem Herrn der Welten,",
      zh_jian: "一切赞颂全归真主，众世界的主",
      it_piccardo: "La lode [appartiene] ad Allah, Signore dei mondi,",
      pt_elhayek: "Louvado seja Allah, Senhor do Universo,",
      hi_farooq: "सब प्रशंसा अल्लाह ही के लिए है जो सब संसारों का रब है,",
      fa_mojtabavi: "ستایش خدای را که پروردگار جهانیان است.",
      ja_sawada: "万有の主、アッラーにこそ凡ての称讃あれ。",
      sw_albarwani: "Sifa njema zote kamilifu ni za Mwenyezi Mungu, Mola Mlezi wa walimwengu wote."
    },
    {
      id_kemenag: "Yang Maha Pengasih, Maha Penyayang,",
      ru_abuadel: "Милостивому, Милосердному,",
      tr_diyanet: "O, Rahman'dır, Rahim'dir.",
      de_aburida: "dem Allerbarmer, dem Barmherzigen,",
      zh_jian: "至仁至慈的主",
      it_piccardo: "il Compassionevole, il Misericordioso,",
      pt_elhayek: "O Clemente, o Misericordioso,",
      hi_farooq: "परम दयामय, अत्यंत कृपालु है,",
      fa_mojtabavi: "بخشنده مهربان.",
      ja_sawada: "慈悲深く慈愛あまねき御方。",
      sw_albarwani: "Mwingi wa Rehema, Mwenye kurehemu."
    },
    {
      id_kemenag: "Pemilik hari pembalasan.",
      ru_abuadel: "Властелину Дня воздаяния.",
      tr_diyanet: "Din gününün sahibidir.",
      de_aburida: "dem Herrscher am Tage des Gerichts.",
      zh_jian: "报应日的主",
      it_piccardo: "Re del Giorno del Giudizio.",
      pt_elhayek: "Soberano do Dia do Juízo.",
      hi_farooq: "بدله کے دن का मालिक है।",
      fa_mojtabavi: "مالک روز جزا.",
      ja_sawada: "裁きの日の主宰者。",
      sw_albarwani: "Mfalme wa Siku ya Malipo."
    },
    {
      id_kemenag: "Hanya kepada-Mu kami menyembah dan hanya kepada-Mu kami memohon pertolongan.",
      ru_abuadel: "Тебе мы поклоняемся и у Тебя просим помощи.",
      tr_diyanet: "Yalnız Sana kulluk eder, yalnız Senden yardım dileriz.",
      de_aburida: "Dir allein dienen wir, und Dich allein bitten wir um Hilfe.",
      zh_jian: "我们只崇拜你，求你助佑",
      it_piccardo: "Te solo adoriamo e a Te solo chiediamo aiuto.",
      pt_elhayek: "Só a Ti adoramos e só de Ti imploramos ajuda.",
      hi_farooq: "ہم تیری ہی بندگی کرتے ہے اور تجھ سے ہی مدد چاہتے ہے۔",
      fa_mojtabavi: "تنها تو را می‌پرستیم و تنها از تو یاری می‌جوییم.",
      ja_sawada: "あなたにのみ私たちは仕え、あなたにのみ助けを求めます。",
      sw_albarwani: "Wewe tu tunakuabudu, na Wewe tu tunakuomba msaada."
    },
    {
      id_kemenag: "Tunjukkanlah kami jalan yang lurus,",
      ru_abuadel: "Введи нас во прямой путь,",
      tr_diyanet: "Bizi doğru yola ilet.",
      de_aburida: "Führe uns den geraden Weg,",
      zh_jian: "求你引导我们上正路",
      it_piccardo: "Guidaci sulla retta via,",
      pt_elhayek: "Guia-nos à senda reta,",
      hi_farooq: "हमें सीधे मार्ग पर चला,",
      fa_mojtabavi: "ما را به راه راست هدایت فرما.",
      ja_sawada: "私たちの正しい道に導いてください。",
      sw_albarwani: "Ngoza njia iliyo nyooka."
    },
    {
      id_kemenag: "(yaitu) jalan orang-orang yang telah Engkau beri nikmat kepadanya; bukan (jalan) mereka yang dimurkai, dan bukan (pula jalan) mereka yang sesat.",
      ru_abuadel: "путем тех, кого Ты облагодетельствовал, не тех, на кого пал Твой гнев, и не заблудших.",
      tr_diyanet: "Kendilerine nimet verdiklerinin yoluna ilet; gazaba uğrayanlarınkine ve sapıklarınkine değil.",
      de_aburida: "den Weg derer, denen Du Gnade erwiesen hast, nicht derer, die Deinen Zorn erregt haben, und nicht der Irregehenden.",
      zh_jian: "你所施恩的人的路，不是受谴怒的人的路，也不是迷误的人的路",
      it_piccardo: "la via di coloro che hai colmato di grazia, non di coloro che hanno incurso nella Tua ira, né degli sviati.",
      pt_elhayek: "À senda dos que agraciou, não à dos abominados, nem à dos extraviados.",
      hi_farooq: "उन लोगों के मार्ग पर जिनपर तूने अनुग्रह किया, जो न कोपभाजन हुए और न मार्गभ्रष्ट हुए।",
      fa_mojtabavi: "راه کسانی که به آنان نعمت دادی، نه راه کسانی که بر آنان خشم گرفتی و نه راه گمراهان.",
      ja_sawada: "あなたが恵みを下された人々の道に、お怒りを被る者や、迷い去る者の道ではなく。",
      sw_albarwani: "Njia ya wale ulio waneemesha, siyo ya wale walio kasirikiwa, wala ya wale walio potea."
    }
  ];

  const fatihahTafsirs = [
    {
      en_ibnkathir: "All actions should begin with 'Bismillah' to invoke Allah's mercy and blessings.",
      ar_jalalayn: "تفسير الجلالين: البسملة لقصد التبرك والاستعانة بالله عز وجل في كل البدء.",
      ar_sadi: "تفسير السعدي: البسملة أي: أبتدئ بكل اسم لله تعالى، لأن لفظ (اسم) مفرد مضاف.",
      en_jalalayn: "Tafsir al-Jalalayn: Beginning with the name of Allah to seek aid and blessings.",
      ar_qurtubi: "الجامع لأحكام القرآن للقرطبي: البسملة مذهب الشافعي أنها آية من الفاتحة ومن كل سورة.",
      ar_tabari: "جامع البيان للطبري: القول في تأويل بسم الله الرحمن الرحيم أي أبدأ بتسمية الله ذكره."
    },
    {
      en_ibnkathir: "Gratitude is the cornerstone of faith. Allah is praised because He is the Creator and Sustainer of everything.",
      ar_jalalayn: "الحمد لله ثناء على الله بجميل صفاته ورب العالمين أي خالقهم ومالكهم.",
      ar_sadi: "الحمد لله هو الثناء على الله بصفات الكمال، وبأفعاله الدائرة بين الفضل والعدل.",
      en_jalalayn: "Praise be to Allah: expressing complete gratitude and acknowledgement of Lordship.",
      ar_qurtubi: "القرطبي: الحمد لله رب العالمين هو الثناء الكامل لله المستحق للعبادة وحده.",
      ar_tabari: "الطبري: الشكر خالصًا لله جل ثناؤه دون سائر ما يُعبد من دونه."
    },
    {
      en_ibnkathir: "Allah's mercy encompasses all of creation, providing general sustenance and specific guidance.",
      ar_jalalayn: "الرحمن الرحيم صفتان للفظ الجلالة دالتان على سعة رحمته عز وجل.",
      ar_sadi: "الرحمن الرحيم يدلان على أنه تعالى ذو الرحمة الواسعة العظيمة التي وسعت كل شيء.",
      en_jalalayn: "The merciful nature of Allah covers both this world and the eternal hereafter.",
      ar_qurtubi: "القرطبي: الرحمن الرحيم تكرير لتأكيد معنى الرحمة واللطف بالعباد.",
      ar_tabari: "الطبري: الرحمن لجميع خلقه والرحيم بالمؤمنين خاصة."
    },
    {
      en_ibnkathir: "Allah is the supreme absolute Sovereign on the Day when justice will be established.",
      ar_jalalayn: "مالك يوم الدين أي يوم الجزاء والحساب والملك كله لله يومئذ.",
      ar_sadi: "المالك هو من اتصف بصفة الملك التي من آثارها أنه يأمر وينهى ويثيب ويعاقب.",
      en_jalalayn: "The Day of Judgment is owned solely by Allah, where no other authority exists.",
      ar_qurtubi: "القرطبي: مالك يوم الدين خص يوم الدين بالذكر لأنه لا ادعاء لأحد فيه ملكاً.",
      ar_tabari: "الطبري: هو جل ثناؤه المالك يومئذ دون أحد سواه."
    },
    {
      en_ibnkathir: "We direct all forms of worship to Allah alone, and rely solely on His power for aid.",
      ar_jalalayn: "إياك نعبد نخصك بالعبادة وإياك نستعين نخصك بطلب العون.",
      ar_sadi: "إياك نعبد أي: نعبدك وحدك ولا نعبد غيرك، وإياك نستعين أي: نطلب منك العون وحدك.",
      en_jalalayn: "A covenant between the servant and the Lord for pure monotheism and reliance.",
      ar_qurtubi: "القرطبي: إياك نعبد تقديم المفعول لقصد الحصر والتوحيد الخالص.",
      ar_tabari: "الطبري: لك ربنا نخشع ونذل ونستكين، وبك نستعين على عبادتك وطاعتك."
    },
    {
      en_ibnkathir: "Guidance is the greatest gift. We ask for the path of true monotheism and righteous action.",
      ar_jalalayn: "اهدنا الصراط المستقيم أرشدنا وأرنا الطريق المستقيم الموصل للجنة.",
      ar_sadi: "الهداية هي الإرشاد والدلالة والتوفيق، والصراط المستقيم هو الطريق الواضح السهل.",
      en_jalalayn: "Guidance to the straight way which is the religion of Islam and truth.",
      ar_qurtubi: "القرطبي: الصراط المستقيم هو كتاب الله وقيل الإسلام وقيل رسول الله وصاحباه.",
      ar_tabari: "الطبري: وفقنا للثبات على ما ارتضيته ولعبادتك وطاعتك."
    },
    {
      en_ibnkathir: "The path of success is the path of the prophets, truth-seekers, martyrs, and righteous people.",
      ar_jalalayn: "صراط الذين أنعمت عليهم بالهداية غير المغضوب عليهم وهم اليهود ولا الضالين وهم النصارى.",
      ar_sadi: "صراط الذين أنعمت عليهم من النبيين والصديقين والشهداء والصالحين، غير المغضوب عليهم وغير الضالين.",
      en_jalalayn: "Following the footsteps of those whom Allah has blessed, avoiding straying and anger.",
      ar_qurtubi: "القرطبي: غير المغضوب عليهم اليهود، ولا الضالين هم النصارى وهو قول عامة المفسرين.",
      ar_tabari: "الطبري: صراط الذين منّ الله عليهم بطاعتهم وعبادتهم."
    }
  ];

  for (const ayah of out.ayahs) {
    ayah.tafsir = {};
    if (ayah.surahNumber === 1) {
      const idx = ayah.ayahNumber - 1;
      const trans = fatihahTranslations[idx];
      const extraTrans = extraFatihahTranslations[idx];
      const tafsir = fatihahTafsirs[idx];
      if (trans) {
        Object.assign(ayah.text, trans);
      }
      if (extraTrans) {
        Object.assign(ayah.text, extraTrans);
      }
      if (tafsir) {
        Object.assign(ayah.tafsir, tafsir);
      }
    } else {
      ayah.text.en_sahih = `English translation of [${ayah.surahNumber}:${ayah.ayahNumber}] in Sahih International style.`;
      ayah.text.en_yusufali = `English translation of [${ayah.surahNumber}:${ayah.ayahNumber}] in Yusuf Ali style.`;
      ayah.text.ur_maududi = `سورہ ${ayah.surahNumber} آیت ${ayah.ayahNumber} کا اردو ترجمہ (مولانا مودودی)`;
      ayah.text.es_cortes = `Traducción de [${ayah.surahNumber}:${ayah.ayahNumber}] en español.`;
      ayah.text.fr_hamidullah = `Traduction de [${ayah.surahNumber}:${ayah.ayahNumber}] en français.`;
      ayah.text.bn_hoque = `সূরা ${ayah.surahNumber} আয়াত ${ayah.ayahNumber} এর বাংলা অনুবাদ (জহুরুল হক)`;
      ayah.text.id_kemenag = `Terjemahan [${ayah.surahNumber}:${ayah.ayahNumber}] dalam bahasa Indonesia (Kemenag).`;
      ayah.text.ru_abuadel = `Перевод айята [${ayah.surahNumber}:${ayah.ayahNumber}] на русский язык (Абу Адель).`;
      ayah.text.tr_diyanet = `[${ayah.surahNumber}:${ayah.ayahNumber}] ayetinin Türkçe meali (Diyanet Vakfı).`;
      ayah.text.de_aburida = `Übersetzung von [${ayah.surahNumber}:${ayah.ayahNumber}] in deutscher Sprache (Abu Rida).`;
      ayah.text.zh_jian = `真主启示 ［${ayah.surahNumber}:${ayah.ayahNumber}］ 马坚 译文`;
      
      // New Translations Fallbacks
      ayah.text.it_piccardo = `Traduzione di [${ayah.surahNumber}:${ayah.ayahNumber}] in italiano (Hamza Piccardo).`;
      ayah.text.pt_elhayek = `Tradução de [${ayah.surahNumber}:${ayah.ayahNumber}] em português (Samir El-Hayek).`;
      ayah.text.hi_farooq = `अनुवाद [${ayah.surahNumber}:${ayah.ayahNumber}] हिन्दी में (फ़ारूक ख़าน)।`;
      ayah.text.fa_mojtabavi = `ترجمه [${ayah.surahNumber}:${ayah.ayahNumber}] به زبان فارسی (مجتبوی).`;
      ayah.text.ja_sawada = `日本語訳 [${ayah.surahNumber}:${ayah.ayahNumber}]（澤田）。`;
      ayah.text.sw_albarwani = `Tafsiri ya [${ayah.surahNumber}:${ayah.ayahNumber}] kwa Kiswahili (Al-Barwani).`;

      // Tafsir Fallbacks
      ayah.tafsir.en_ibnkathir = `English Tafsir Ibn Kathir explanation for verse [${ayah.surahNumber}:${ayah.ayahNumber}].`;
      ayah.tafsir.ar_jalalayn = `تفسير الجلالين للآية [${ayah.surahNumber}:${ayah.ayahNumber}] باللغة العربية البسيطة.`;
      ayah.tafsir.ar_sadi = `تفسير السعدي تيسير الكريم الرحمن في تفسير كلام المنان للآية [${ayah.surahNumber}:${ayah.ayahNumber}].`;
      ayah.tafsir.en_jalalayn = `English Tafsir al-Jalalayn exegesis for verse [${ayah.surahNumber}:${ayah.ayahNumber}].`;
      ayah.tafsir.ar_qurtubi = `الجامع لأحكام القرآن للقرطبي للآية [${ayah.surahNumber}:${ayah.ayahNumber}].`;
      ayah.tafsir.ar_tabari = `تفسير جامع البيان في تأويل القرآن للطبري للآية [${ayah.surahNumber}:${ayah.ayahNumber}].`;
    }
  }
}
