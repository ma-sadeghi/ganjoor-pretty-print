// ABOUTME: JavaScript functionality for Ganjoor Persian poetry pretty printer
// ABOUTME: Handles API calls, poem parsing, display formatting, and user interactions

function showStatus(message, type) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = "block";
}

function hideStatus() {
  const status = document.getElementById("status");
  status.style.display = "none";
}

async function extractPoem() {
  const urlInput = document.getElementById("urlInput").value.trim();
  const extractBtn = document.getElementById("extractBtn");
  const pathMatch = urlInput.match(/ganjoor\.net\/([^#?]+)/i);

  if (!pathMatch) {
    showStatus("لینک وارد شده معتبر نیست.", "error");
    return;
  }

  const poemPath = "/" + pathMatch[1]; // Add leading slash

  try {
    showStatus("در حال دریافت شعر از API گنجور...", "loading");
    extractBtn.disabled = true;

    // First, get the poem basic info
    const poemRes = await fetch(
      `https://api.ganjoor.net/api/ganjoor/poem?url=${encodeURIComponent(
        poemPath
      )}`
    );
    if (!poemRes.ok) throw new Error(`کد خطا ${poemRes.status}`);

    const poem = await poemRes.json();

    // Then get the verses using the poem ID
    const versesRes = await fetch(
      `https://api.ganjoor.net/api/ganjoor/poem/${poem.id}/verses`
    );
    if (!versesRes.ok)
      throw new Error(`کد خطا در دریافت ابیات ${versesRes.status}`);

    const verses = await versesRes.json();

    const title = poem.title || "بدون عنوان";
    const poet =
      poem.category?.poet?.name || poem.poetName || "شاعر ناشناس";

    // Process verses - each verse may have multiple hemistichs
    const poemText = verses
      .map((verse) => {
        if (verse.hemistichs && verse.hemistichs.length > 0) {
          return verse.hemistichs.map((h) => h.text || "").join("   "); // Join hemistichs with spacing
        }
        return verse.text || ""; // Fallback to verse.text if hemistichs not available
      })
      .filter((line) => line.trim()) // Remove empty lines
      .join("\n");

    displayPoem(poet, title, poemText);
    showStatus("شعر با موفقیت استخراج شد!", "success");
    setTimeout(hideStatus, 3000);
  } catch (err) {
    console.error(err);
    showStatus("خطا در دریافت شعر: " + err.message, "error");
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

function displayPoem(poetName, poemTitle, poemText) {
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
}

async function loadSamplePoem() {
  try {
    showStatus("در حال دریافت شعر تصادفی...", "loading");

    // Get random poem
    const randomRes = await fetch("https://api.ganjoor.net/api/ganjoor/poem/random");
    if (!randomRes.ok) throw new Error(`کد خطا ${randomRes.status}`);

    const randomPoem = await randomRes.json();
    console.log("Random poem response:", randomPoem);

    // Get poet info using poet ID
    let poetName = "شاعر ناشناس";
    let poetId = randomPoem.category?.poet?.id || randomPoem.sections?.[0]?.poetId;
    
    if (poetId) {
      console.log("Found poet ID:", poetId);
      try {
        const poetRes = await fetch(`https://api.ganjoor.net/api/ganjoor/poet/${poetId}`);
        if (poetRes.ok) {
          const poetInfo = await poetRes.json();
          console.log("Poet info response:", poetInfo);
          poetName = poetInfo.poet?.name || poetInfo.poet?.nickname || poetInfo.name || poetInfo.nickname || poetName;
          console.log("Final poet name:", poetName);
        } else {
          console.warn("Poet API response not ok:", poetRes.status);
        }
      } catch (poetErr) {
        console.warn("Could not fetch poet info:", poetErr);
      }
    } else {
      console.log("No poet ID found in random poem response");
      console.log("Category:", randomPoem.category);
      console.log("Sections:", randomPoem.sections);
    }

    // Get verses for the random poem
    const versesRes = await fetch(
      `https://api.ganjoor.net/api/ganjoor/poem/${randomPoem.id}/verses`
    );
    if (!versesRes.ok) throw new Error(`کد خطا در دریافت ابیات ${versesRes.status}`);

    const verses = await versesRes.json();

    const title = randomPoem.fullTitle || randomPoem.title || "بدون عنوان";

    // Process verses
    const poemText = verses
      .map((verse) => {
        if (verse.hemistichs && verse.hemistichs.length > 0) {
          return verse.hemistichs.map((h) => h.text || "").join("   ");
        }
        return verse.text || "";
      })
      .filter((line) => line.trim())
      .join("\n");

    displayPoem(poetName, title, poemText);
    showStatus("شعر تصادفی بارگذاری شد!", "success");
    setTimeout(hideStatus, 3000);
  } catch (err) {
    console.error(err);
    showStatus("خطا در دریافت شعر تصادفی: " + err.message, "error");
  }
}

function showManualInputOption() {
  document.getElementById("manualSection").style.display = "block";

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
    showStatus("لطفاً متن شعر را وارد کنید.", "error");
    return;
  }

  displayPoem(poetName, poemTitle, poemText);
  showStatus("شعر با موفقیت نمایش داده شد!", "success");
  setTimeout(hideStatus, 3000);
}

// Theme Management
function initializeTheme() {
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
}

function toggleTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const isDark = document.body.classList.contains('dark-theme');
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
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
}

// Handle Enter key in URL input and theme initialization
document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  initializeTheme();
  
  // Add theme toggle event listener
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Handle Enter key in URL input
  document
    .getElementById("urlInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        extractPoem();
      }
    });
    
  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) { // Only auto-switch if no manual preference is saved
        initializeTheme();
      }
    });
  }
});