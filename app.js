(() => {
  'use strict';

  // ====== Elements ======
  const $ = (id) => document.getElementById(id);
  const textInput   = $('textInput');
  const vocabInput  = $('vocabInput');
  const languageSel = $('language');
  const generateBtn = $('generateBtn');
  const sampleBtn   = $('sampleBtn');
  const output      = $('output');
  const outputPanel = $('outputPanel');
  const inputPanel  = $('inputPanel');
  const editBtn     = $('editBtn');
  const outputStats = $('outputStats');
  const popup       = $('popup');
  const popupPron   = popup.querySelector('.pron');
  const popupMean   = popup.querySelector('.meaning');
  const vocabSearch = $('vocabSearch');
  const langChips   = document.querySelectorAll('.lang-chip');

  // ====== State ======
  let vocab = {};                // { word: { meaning, pronunciation } }
  let lookupMap = {};            // for non-Chinese: lowercased key -> {original, meaning, pronunciation}
  let sortedKeys = [];           // Chinese: keys sorted by length desc for longest-match
  let activeTokenEl = null;
  let currentLanguage = 'Chinese';

  // ====== Language Selection Chips ======
  langChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Deactivate all chips
      langChips.forEach(c => {
        c.classList.remove('bg-slm-pine', 'text-slm-paper', 'border-slm-pine');
        c.classList.add('bg-transparent', 'text-slm-inkMuted', 'border-slm-border');
      });
      
      // Activate clicked chip
      chip.classList.add('bg-slm-pine', 'text-slm-paper', 'border-slm-pine');
      chip.classList.remove('bg-transparent', 'text-slm-inkMuted', 'border-slm-border');
      
      const selectedLang = chip.getAttribute('data-lang-val');
      languageSel.value = selectedLang;
      currentLanguage = selectedLang;
      
      // Auto-load demo on language switch
      loadDemoContent(selectedLang);
    });
  });

  // ====== Vocab Parser ======
  function parseVocab(raw) {
    const v = {};
    if (!raw) return v;
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split('::');
      if (parts.length < 2) continue;
      const word = (parts[0] || '').trim();
      const meaning = (parts[1] || '').trim();
      const pronunciation = (parts[2] || '').trim();
      if (!word || !meaning) continue;
      v[word] = { meaning, pronunciation };
    }
    return v;
  }

  function buildLookups(language) {
    sortedKeys = Object.keys(vocab).sort((a,b) => b.length - a.length);
    lookupMap = {};
    if (language !== 'Chinese') {
      for (const k of Object.keys(vocab)) {
        lookupMap[k.toLowerCase()] = { original: k, ...vocab[k] };
      }
    }
  }

  // ====== Tokenizers ======
  function tokenizeChinese(text) {
    const tokens = [];
    let i = 0;
    while (i < text.length) {
      const ch = text[i];

      if (ch === '\n') { tokens.push({ type: 'newline' }); i++; continue; }

      if (/\s/.test(ch)) {
        let j = i;
        while (j < text.length && /[ \t]/.test(text[j])) j++;
        tokens.push({ type: 'space', text: text.slice(i, j) });
        i = j; continue;
      }

      let matched = null;
      for (const key of sortedKeys) {
        if (!key.length) continue;
        if (text.startsWith(key, i)) { matched = key; break; }
      }
      if (matched) {
        tokens.push({ type: 'known', text: matched, data: vocab[matched] });
        i += matched.length;
        continue;
      }

      if (/[\u3000-\u303F\uFF00-\uFFEF.,!?;:'"()\[\]{}\-—…·、。，！？；：「」『』《》〈〉【】（）]/.test(ch)) {
        tokens.push({ type: 'punct', text: ch });
        i++; continue;
      }

      tokens.push({ type: 'unknown', text: ch });
      i++;
    }
    return tokens;
  }

  // tokenize Latin
  function tokenizeLatin(text) {
    const tokens = [];
    const wordRe = /[\p{L}\p{M}\p{N}'-]/u;
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '\n') { tokens.push({ type: 'newline' }); i++; continue; }
      if (/\s/.test(ch)) {
        let j = i;
        while (j < text.length && /[ \t]/.test(text[j])) j++;
        tokens.push({ type: 'space', text: text.slice(i, j) });
        i = j; continue;
      }
      if (wordRe.test(ch)) {
        let j = i;
        while (j < text.length && wordRe.test(text[j])) j++;
        const w = text.slice(i, j);
        const hit = lookupMap[w.toLowerCase()];
        if (hit) {
          tokens.push({ type: 'known', text: w, data: { meaning: hit.meaning, pronunciation: hit.pronunciation } });
        } else {
          tokens.push({ type: 'unknown', text: w });
        }
        i = j; continue;
      }
      tokens.push({ type: 'punct', text: ch });
      i++;
    }
    return tokens;
  }

  // ====== Rendering ======
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // Rendering tokens
  function renderTokens(tokens) {
    const parts = [];
    let knownCount = 0, unknownCount = 0;
    for (const t of tokens) {
      if (t.type === 'newline') { parts.push('<br>'); continue; }
      if (t.type === 'space')   { parts.push(escapeHtml(t.text)); continue; }
      if (t.type === 'punct')   { parts.push('<span class="token-punct">'+escapeHtml(t.text)+'</span>'); continue; }
      if (t.type === 'unknown') {
        unknownCount++;
        parts.push('<span class="token-unknown">'+escapeHtml(t.text)+'</span>');
        continue;
      }
      knownCount++;
      const m = (t.data && t.data.meaning) || '';
      const p = (t.data && t.data.pronunciation) || '';
      parts.push(
        '<span class="token" data-meaning="'+escapeHtml(m)+'" data-pron="'+escapeHtml(p)+'">'
        + escapeHtml(t.text) +
        '</span>'
      );
    }
    return { html: parts.join(''), knownCount, unknownCount };
  }

  function renderStats(known, unknown) {
    outputStats.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slm-pine/5 text-xs font-semibold text-slm-pine border border-slm-border">
        ${known} words found
      </span>
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slm-clay/5 text-xs font-semibold text-slm-clay border border-slm-border">
        ${unknown} unmatched
      </span>
    `;
  }

  // ====== Popup logic ======
  function showPopupFor(tokenEl) {
    const meaning = tokenEl.getAttribute('data-meaning') || '';
    const pron    = tokenEl.getAttribute('data-pron') || '';

    popupPron.textContent = pron;
    popupPron.style.display = pron ? 'block' : 'none';
    popupMean.textContent = meaning;

    popup.classList.add('visible');
    popup.setAttribute('aria-hidden', 'false');

    const rect = tokenEl.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const popupRect = popup.getBoundingClientRect();
    const popupW = popupRect.width;
    const popupH = popupRect.height;

    let left = rect.left + scrollX + rect.width / 2 - popupW / 2;
    let top  = rect.top + scrollY - popupH - 12;
    let below = false;

    const margin = 8;
    if (top < scrollY + margin) {
      top = rect.bottom + scrollY + 12;
      below = true;
    }
    popup.classList.toggle('below', below);

    const viewportLeft = scrollX + margin;
    const viewportRight = scrollX + document.documentElement.clientWidth - margin;
    if (left < viewportLeft) left = viewportLeft;
    if (left + popupW > viewportRight) left = viewportRight - popupW;

    popup.style.left = left + 'px';
    popup.style.top  = top + 'px';

    if (activeTokenEl && activeTokenEl !== tokenEl) activeTokenEl.classList.remove('active');
    tokenEl.classList.add('active');
    activeTokenEl = tokenEl;
  }

  function hidePopup() {
    popup.classList.remove('visible', 'below');
    popup.setAttribute('aria-hidden', 'true');
    if (activeTokenEl) activeTokenEl.classList.remove('active');
    activeTokenEl = null;
  }

  // Output container token click events
  output.addEventListener('click', (e) => {
    const tok = e.target.closest('.token');
    if (tok) {
      e.stopPropagation();
      showPopupFor(tok);
    }
  });

  // Vocabulary Search functionality (vibrant green highlights)
  vocabSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const tokens = output.querySelectorAll('.token');
    
    tokens.forEach(tok => {
      const meaning = (tok.getAttribute('data-meaning') || '').toLowerCase();
      const word = tok.textContent.toLowerCase();
      const pinyin = (tok.getAttribute('data-pron') || '').toLowerCase();
      
      if (term && (meaning.includes(term) || word.includes(term) || pinyin.includes(term))) {
        tok.style.backgroundColor = 'rgba(22, 163, 74, 0.12)';
        tok.style.borderBottomColor = '#16a34a';
        tok.style.borderBottomStyle = 'solid';
      } else {
        tok.style.backgroundColor = '';
        tok.style.borderBottomColor = '';
        tok.style.borderBottomStyle = '';
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.token')) return;
    if (e.target.closest('#popup')) return;
    hidePopup();
  });

  function repositionActive() {
    if (activeTokenEl) showPopupFor(activeTokenEl);
  }
  document.addEventListener('scroll', () => { if (activeTokenEl) repositionActive(); }, { capture: true, passive: true });
  window.addEventListener('resize', () => { if (activeTokenEl) repositionActive(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePopup();
  });

  // ====== Generate Layout ======
  function generate() {
    hidePopup();
    currentLanguage = languageSel.value;
    vocab = parseVocab(vocabInput.value);
    buildLookups(currentLanguage);

    const text = textInput.value || '';
    if (!text.trim()) {
      textInput.focus();
      return;
    }

    // Toggle layouts: hide input panel, show output panel
    inputPanel.classList.add('hidden');
    outputPanel.classList.remove('hidden');

    // Show loading spinner
    output.innerHTML = `
      <div class="flex flex-col items-center justify-center py-24 text-slm-pine">
        <svg class="animate-spin h-8 w-8 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing text...</p>
      </div>`;
    outputStats.innerHTML = '';

    // Delayed rendering for premium loader animation feel
    setTimeout(() => {
      const tokens = currentLanguage === 'Chinese'
        ? tokenizeChinese(text)
        : tokenizeLatin(text);

      const { html, knownCount, unknownCount } = renderTokens(tokens);

      output.classList.toggle('cn', currentLanguage === 'Chinese');
      output.innerHTML = '<div>' + html + '</div>';
      renderStats(knownCount, unknownCount);

      // Scroll into view on small screens
      if (window.matchMedia('(max-width: 1023px)').matches) {
        setTimeout(() => {
          outputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }, 600);
  }

  generateBtn.addEventListener('click', generate);

  // ====== Edit Button Handler ======
  editBtn.addEventListener('click', () => {
    hidePopup();
    outputPanel.classList.add('hidden');
    inputPanel.classList.remove('hidden');
    textInput.focus();
  });

  // ====== Demo Data ======
  const DEMOS = {
    Chinese: {
      text: `如果 那两个字 没有颤抖\n我不会发现 我难受\n怎么说出口 也不过是 分手\n如果对于明天没有要求\n牵牵手就像旅游\n成千上万个门口 总有一个人要先走\n\n怀抱既然不能逗留\n何不在离开的时候 一边享受 一边泪流\n十年之前 我不认识你 你不属于我\n我们还是一样 陪在一个陌生人左右\n走过渐渐熟悉的街头`,
      vocab: `如果::if::rúguǒ\n那::that::nà\n两个::two::liǎnggè\n字::word; character::zì\n没有::not have::méiyǒu\n颤抖::tremble; shiver::chàndǒu\n我::I; me::wǒ\n不会::will not::búhuì\n发现::discover; realize::fāxiàn\n难受::feel bad; suffer::nánshòu\n怎么::how::zěnme\n说出口::say out loud::shuōchūkǒu\n也::also::yě\n不过::merely; just::búguò\n是::is; be::shì\n分手::break up::fēnshǒu\n对于::regarding; for::duìyú\n明天::tomorrow::míngtiān\n要求::demand; requirement::yāoqiú\n牵牵手::hold hands::qiānqiānshǒu\n就::just; then::jiù\n像::like; resemble::xiàng\n旅游::travel; tour::lǚyóu\n成千上万::tens of thousands::chéngqiānshàngwàn\n门口::doorway; entrance::ménkǒu\n总有::there is always::zǒngyǒu\n一个::one::yígè\n人::person::rén\n要::will; need to::yào\n先走::leave first::xiānzǒu\n怀抱::embrace; arms::huáibào\n既然::since; now that::jìrán\n不能::cannot::bùnéng\n逗留::linger; stay::dòuliú\n何不::why not::hébù\n在::at; in::zài\n离开::leave; depart::líkāi\n的::particle::de\n时候::time; moment::shíhòu\n一边::on one side; while::yìbiān\n享受::enjoy::xiǎngshòu\n泪流::tears flow::lèiliú\n十年::ten years::shínián\n之前::before::zhīqián\n不::not::bù\n认识::know (someone)::rènshi\n你::you::nǐ\n属于::belong to::shǔyú\n我们::we; us::wǒmen\n还::still::hái\n一样::the same::yíyàng\n陪::accompany::péi\n左右::left and right; around::zuǒyòu\n走过::walk past::zǒuguò\n渐渐::gradually::jiànjiàn\n熟悉::familiar::shúxī\n街头::street corner::jiētóu`
    },
    French: {
      text: `Bonjour, je suis très heureux de te voir aujourd'hui. La vie est belle et le soleil brille fort. Nous allons marcher dans le parc et parler de tout.`,
      vocab: `bonjour::hello::\nje::I::\nsuis::am::\ntrès::very::\nheureux::happy::\nde::of::\nte::you::\nvoir::to see::\naujourd'hui::today::\nla::the::\nvie::life::\nest::is::\nbelle::beautiful::\net::and::\nle::the::\nsoleil::sun::\nbrille::shines::\nfort::strong; brightly::\nnous::we::\nallons::will go::\nmarcher::to walk::\ndans::in::\nparc::park::\nparler::to talk::\ntout::everything::`
    },
    Spanish: {
      text: `Hola, me llamo Carlos y vivo en Madrid. Hoy hace mucho sol y voy a caminar por el parque con mi perro.`,
      vocab: `hola::hello::\nme::myself; me::\nllamo::am called::\ny::and::\nvivo::I live::\nen::in::\nhoy::today::\nhace::makes; it is (weather)::\nmucho::much; a lot::\nsol::sun::\nvoy::I go::\na::to::\ncaminar::to walk::\npor::through; by::\nel::the::\nparque::park::\ncon::with::\nmi::my::\nperro::dog::`
    },
    Other: {
      text: `The quick brown fox jumps over the lazy dog. Reading is an interactive journey that builds vocabulary.`,
      vocab: `quick::fast; rapid::\nbrown::dark color::\nfox::wild animal::\njumps::leaps over::\nlazy::sluggish; slow::\ndog::canine pet::\ninteractive::engaging two-way communication::\njourney::trip; path::\nvocabulary::words of a language::`
    }
  };

  function loadDemoContent(lang) {
    const demo = DEMOS[lang] || DEMOS.Chinese;
    textInput.value = demo.text;
    vocabInput.value = demo.vocab;
    generate();
  }

  sampleBtn.addEventListener('click', () => {
    loadDemoContent(currentLanguage);
  });

  // ====== Initial load ======
  loadDemoContent('Chinese');

})();
