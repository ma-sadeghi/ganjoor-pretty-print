// ABOUTME: JavaScript functionality for Ganjoor Persian poetry pretty printer
// ABOUTME: Handles API calls, poem parsing, display formatting, and user interactions

/* ========================================
   Status Management Module
   ======================================== */
const StatusManager = {
  show(message, type) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = "block";
  },

  hide() {
    const status = document.getElementById("status");
    status.style.display = "none";
  }
};

/* ========================================
   API Module
   ======================================== */
const GanjoorAPI = {
  async fetchPoemInfo(poemPath) {
    const response = await fetch(
      `https://api.ganjoor.net/api/ganjoor/poem?url=${encodeURIComponent(poemPath)}`
    );
    if (!response.ok) throw new Error(`کد خطا ${response.status}`);
    return await response.json();
  },

  async fetchPoemVerses(poemId) {
    const response = await fetch(
      `https://api.ganjoor.net/api/ganjoor/poem/${poemId}/verses`
    );
    if (!response.ok) throw new Error(`کد خطا در دریافت ابیات ${response.status}`);
    return await response.json();
  },

  async fetchRandomPoem() {
    const response = await fetch("https://api.ganjoor.net/api/ganjoor/poem/random");
    if (!response.ok) throw new Error(`کد خطا ${response.status}`);
    return await response.json();
  },

  async fetchPoetInfo(poetId) {
    const response = await fetch(`https://api.ganjoor.net/api/ganjoor/poet/${poetId}`);
    if (!response.ok) throw new Error(`کد خطا ${response.status}`);
    return await response.json();
  }
};

/* ========================================
   Poem Processing Module
   ======================================== */
const PoemProcessor = {
  validateUrl(url) {
    const pathMatch = url.match(/ganjoor\.net\/([^#?]+)/i);
    return pathMatch ? "/" + pathMatch[1] : null;
  },

  processVerses(verses) {
    return verses
      .map((verse) => {
        if (verse.hemistichs && verse.hemistichs.length > 0) {
          return verse.hemistichs.map((h) => h.text || "").join("   ");
        }
        return verse.text || "";
      })
      .filter((line) => line.trim())
      .join("\n");
  },

  extractPoetName(poemData) {
    return poemData.category?.poet?.name || poemData.poetName || "شاعر ناشناس";
  }
};

/* ========================================
   Main Functions
   ======================================== */
async function extractPoem() {
  const urlInput = document.getElementById("urlInput").value.trim();
  const extractBtn = document.getElementById("extractBtn");
  
  const poemPath = PoemProcessor.validateUrl(urlInput);
  if (!poemPath) {
    StatusManager.show("لینک وارد شده معتبر نیست.", "error");
    return;
  }

  try {
    StatusManager.show("در حال دریافت شعر از API گنجور...", "loading");
    extractBtn.disabled = true;

    const poem = await GanjoorAPI.fetchPoemInfo(poemPath);
    const verses = await GanjoorAPI.fetchPoemVerses(poem.id);

    const title = poem.title || "بدون عنوان";
    const poet = PoemProcessor.extractPoetName(poem);
    const poemText = PoemProcessor.processVerses(verses);

    PoemDisplay.render(poet, title, poemText);
    StatusManager.show("شعر با موفقیت استخراج شد!", "success");
    setTimeout(StatusManager.hide, 3000);
  } catch (err) {
    console.error(err);
    StatusManager.show("خطا در دریافت شعر: " + err.message, "error");
  } finally {
    extractBtn.disabled = false;
  }
}

function extractPoemFromHTML(doc) {
  // Try different selectors that might contain the poem
  const selectors = [
    'div[style*="font-size"]', // Common in Ganjoor
    ".poem",
    ".poetry",
    "#poemtext",
    ".verse",
    'div:contains("زیرا")', // Look for Persian text patterns
  ];

  let poemText = "";

  // Look for the main content area
  const bodyText = doc.body.textContent;
  const lines = bodyText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Find poem lines (typically Persian text with specific patterns)
  const poemLines = [];
  let foundPoetry = false;

  for (let line of lines) {
    // Skip navigation, headers, and footer content
    if (line.includes("گنجور") && line.includes("»")) continue;
    if (line.includes("با انتخاب متن")) break;
    if (line.includes("هوش مصنوعی")) break;
    if (line.includes("پیشنهاد تصاویر")) break;
    if (line.length < 10) continue;
    if (line.includes("حاشیه")) break;

    // Look for Persian poetry patterns
    if (isPersianPoetryLine(line)) {
      poemLines.push(line);
      foundPoetry = true;
    } else if (foundPoetry && line.length > 20) {
      // Continue collecting if we've found poetry and line is substantial
      poemLines.push(line);
    }
  }

  return poemLines.join("\n");
}

function isPersianPoetryLine(line) {
  // Check for Persian characters and poetry patterns
  const persianPattern = /[\u0600-\u06FF]/;
  const hasRhyme =
    line.includes("رفت") || line.includes("شد") || line.includes("است");
  const hasPoetryStructure = line.length > 20 && line.length < 200;

  return persianPattern.test(line) && hasPoetryStructure;
}

function extractPoetName(doc) {
  const title = doc.title;
  if (title && title.includes("»")) {
    const parts = title.split("»");
    return parts[1]?.trim() || "شاعر ناشناس";
  }
  return "شاعر ناشناس";
}

function extractPoemTitle(doc) {
  const title = doc.title;
  if (title && title.includes("»")) {
    const parts = title.split("»");
    return parts[parts.length - 1]?.trim() || "بدون عنوان";
  }
  return "بدون عنوان";
}

/* ========================================
   Display Module
   ======================================== */
const PoemDisplay = {
  render(poetName, poemTitle, poemText) {
    document.getElementById("poetName").textContent = poetName;
    document.getElementById("poemTitle").textContent = poemTitle;

    const poemContent = document.getElementById("poemContent");
    const lines = poemText
      .split("\n")
      .filter((line) => line.trim().length > 0);

    let formattedPoem = "";

    for (let i = 0; i < lines.length; i += 2) {
      const line1 = lines[i];
      const line2 = lines[i + 1];

      if (line1 && line2) {
        // Two lines - create hemistichs
        formattedPoem += `
                        <div class="verse">
                            <div class="hemistichs">
                                <div class="hemistich">${line1}</div>
                                <div class="hemistich">${line2}</div>
                            </div>
                        </div>
                    `;
      } else if (line1) {
        // Single line
        formattedPoem += `
                        <div class="verse">
                            <div style="text-align: center;">${line1}</div>
                        </div>
                    `;
      }
    }

    poemContent.innerHTML = formattedPoem;
    document.getElementById("poemContainer").style.display = "block";
    document.getElementById("printSection").style.display = "block";
  },

  showManualInputSection() {
    document.getElementById("manualSection").style.display = "block";
  }
};

// Legacy function for backward compatibility
function displayPoem(poetName, poemTitle, poemText) {
  PoemDisplay.render(poetName, poemTitle, poemText);
}

async function loadSamplePoem() {
  try {
    StatusManager.show("در حال دریافت شعر تصادفی...", "loading");

    const randomPoem = await GanjoorAPI.fetchRandomPoem();
    console.log("Random poem response:", randomPoem);

    // Get poet info using poet ID
    let poetName = "شاعر ناشناس";
    let poetId = randomPoem.category?.poet?.id || randomPoem.sections?.[0]?.poetId;
    
    if (poetId) {
      console.log("Found poet ID:", poetId);
      try {
        const poetInfo = await GanjoorAPI.fetchPoetInfo(poetId);
        console.log("Poet info response:", poetInfo);
        poetName = poetInfo.poet?.name || poetInfo.poet?.nickname || poetInfo.name || poetInfo.nickname || poetName;
        console.log("Final poet name:", poetName);
      } catch (poetErr) {
        console.warn("Could not fetch poet info:", poetErr);
      }
    } else {
      console.log("No poet ID found in random poem response");
      console.log("Category:", randomPoem.category);
      console.log("Sections:", randomPoem.sections);
    }

    const verses = await GanjoorAPI.fetchPoemVerses(randomPoem.id);
    const title = randomPoem.fullTitle || randomPoem.title || "بدون عنوان";
    const poemText = PoemProcessor.processVerses(verses);

    PoemDisplay.render(poetName, title, poemText);
    StatusManager.show("شعر تصادفی بارگذاری شد!", "success");
    setTimeout(StatusManager.hide, 3000);
  } catch (err) {
    console.error(err);
    StatusManager.show("خطا در دریافت شعر تصادفی: " + err.message, "error");
  }
}

function showManualInputOption() {
  PoemDisplay.showManualInputSection();

  // Try to pre-fill with the sample poem if available
  const samplePoem = `بیچاره آدمی که گرفتار عقل شد
خوش آن کسی که کره خر آمد الاغ رفت
ای باغبان منال ز رنج دی و خزان
بنشین بجای و فاتحه برخوان که باغ رفت
ای پاسبان مخسب که در غارت سرای
دزد دغل به خانه تو با چراغ رفت
ای دهخدا عراق و ری و طوس هم نماند
چو بانه رفت و سقز و ساوجبلاغ رفت
یاران حذر کنید که در بوستان عدل
امروز جوقه جوقه بسی بوم و زاغ رفت`;

  document.getElementById("manualPoetName").value = "ادیب الممالک";
  document.getElementById("manualPoemTitle").value = "مقطعات - شماره ۳۴";
  document.getElementById("manualPoemText").value = samplePoem;
}

function processManualInput() {
  const poetName =
    document.getElementById("manualPoetName").value.trim() ||
    "شاعر ناشناس";
  const poemTitle =
    document.getElementById("manualPoemTitle").value.trim() ||
    "بدون عنوان";
  const poemText = document.getElementById("manualPoemText").value.trim();

  if (!poemText) {
    StatusManager.show("لطفاً متن شعر را وارد کنید.", "error");
    return;
  }

  PoemDisplay.render(poetName, poemTitle, poemText);
  StatusManager.show("شعر با موفقیت نمایش داده شد!", "success");
  setTimeout(StatusManager.hide, 3000);
}

/* ========================================
   Theme Management Module
   ======================================== */
const ThemeManager = {
  initialize() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    
    // Check for saved theme preference or default to auto (system preference)
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      themeToggle.textContent = '☀️';
    } else if (savedTheme === 'light') {
      document.body.classList.remove('dark-theme');
      themeToggle.textContent = '🌙';
    } else {
      // Auto mode - follow system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        themeToggle.textContent = '☀️';
      } else {
        themeToggle.textContent = '🌙';
      }
    }
  },

  toggle() {
    const themeToggle = document.getElementById('themeToggle');
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
      // Currently dark -> switch to light
      document.body.classList.remove('dark-theme');
      themeToggle.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      // Currently light -> switch to dark
      document.body.classList.add('dark-theme');
      themeToggle.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  },

  setupSystemListener() {
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) { // Only auto-switch if no manual preference is saved
          ThemeManager.initialize();
        }
      });
    }
  }
};

// Legacy functions for backward compatibility
function initializeTheme() {
  ThemeManager.initialize();
}

function toggleTheme() {
  ThemeManager.toggle();
}

/* ========================================
   Application Initialization
   ======================================== */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  ThemeManager.initialize();
  
  // Add theme toggle event listener
  document.getElementById('themeToggle').addEventListener('click', ThemeManager.toggle);
  
  // Handle Enter key in URL input
  document
    .getElementById("urlInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        extractPoem();
      }
    });
    
  // Setup system theme change listener
  ThemeManager.setupSystemListener();
});