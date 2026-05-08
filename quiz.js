/* ===== Quiz Engine ===== */
(function() {
  const CHAPTER_TITLES = {
    1: 'Hematopoiese',
    2: 'Eritropoiese e aspectos gerais da anemia',
    3: 'Anemias hipocrômicas',
    4: 'Sobrecarga de ferro',
    5: 'Anemias megaloblásticas e outras anemias macrocíticas',
    6: 'Anemias hemolíticas',
    7: 'Distúrbios genéticos da hemoglobina',
    8: 'Leucócitos 1: granulócitos, monócitos e seus distúrbios benignos',
    9: 'Leucócitos 2: linfócitos e seus distúrbios benignos',
    10: 'Baço',
    11: 'Etiologia e genética das neoplasias hematológicas',
    12: 'Tratamento das neoplasias hematológicas',
    13: 'Leucemia mieloide aguda',
    14: 'Leucemia mieloide crônica',
    15: 'Neoplasias mieloproliferativas',
    16: 'Neoplasias mielodisplásicas',
    17: 'Leucemia linfoblástica aguda'
  };
  
  const data = window.__QUIZ_DATA__;
  const root = document.getElementById('quiz-root');
  if (!root || !data) return;
  
  let currentChapter = 1;
  let currentIndex = 0;
  let view = 'question'; // 'question' | 'chapter-summary'
  // answers per chapter: { [chap]: { [qNum]: {selected, correct} } }
  let answers = {};
  data.forEach(c => answers[c.chapter] = {});
  let chapterMap = new Map(data.map(c => [c.chapter, c]));
  
  function chapStats(chap) {
    const total = chapterMap.get(chap).questions.length;
    const a = answers[chap];
    let answered = 0, correct = 0;
    Object.values(a).forEach(v => { answered++; if (v.correct) correct++; });
    return { total, answered, correct };
  }
  
  function render() {
    if (view === 'chapter-summary') return renderChapterSummary();
    const chap = chapterMap.get(currentChapter);
    if (!chap) return;
    const q = chap.questions[currentIndex];
    const answer = answers[currentChapter][q.num];
    const { total, answered, correct } = chapStats(currentChapter);
    const pctProgress = total > 0 ? (answered / total) * 100 : 0;
    
    root.innerHTML = `
      <div class="quiz-shell">
        <div class="quiz-header">
          <div>
            <h3>Quiz interativo de Hematologia</h3>
            <div class="sub">Pontuação por capítulo · feedback imediato a cada resposta · 17 capítulos disponíveis.</div>
          </div>
          <div class="quiz-stats">
            <div class="stat-pill">
              <div class="stat-pill-label">Acertos · cap. ${currentChapter}</div>
              <div class="stat-pill-value"><span class="hit">${correct}</span><span class="of"> / ${total}</span></div>
            </div>
            <div class="stat-pill">
              <div class="stat-pill-label">Respondidas</div>
              <div class="stat-pill-value">${answered}<span class="of"> / ${total}</span></div>
              <div class="quiz-progress"><div class="quiz-progress-bar" style="width:${pctProgress}%"></div></div>
            </div>
          </div>
        </div>
        <div class="quiz-chapter-bar" id="chap-bar">
          ${data.map(c => {
            const s = chapStats(c.chapter);
            const done = s.answered === s.total && s.total > 0;
            return `
              <button class="chip ${c.chapter === currentChapter ? 'active' : ''} ${done ? 'done' : ''}" data-chap="${c.chapter}">
                Cap. ${c.chapter}${done ? ` · ${s.correct}/${s.total}` : ''}
              </button>
            `;
          }).join('')}
        </div>
        <div class="quiz-body" id="quiz-body">
          <div class="q-num">Capítulo ${currentChapter} · ${CHAPTER_TITLES[currentChapter] || ''} · Questão ${currentIndex + 1} de ${chap.questions.length}</div>
          <h4 class="q-text">${escapeHtml(q.text)}</h4>
          <div class="q-options" id="q-opts">
            ${q.options.map((opt, idx) => {
              let cls = '';
              let dim = '';
              if (answer) {
                cls = 'locked';
                if (idx === q.correctIndex) cls += ' correct';
                else if (idx === answer.selected) cls += ' incorrect';
                else dim = 'dim';
              }
              return `
                <button class="opt ${cls} ${dim}" data-idx="${idx}" ${answer ? 'disabled' : ''}>
                  <span class="letter">${opt.letter}</span>
                  <span class="text">${escapeHtml(opt.text)}</span>
                </button>
              `;
            }).join('')}
          </div>
          ${answer ? renderFeedback(q, answer) : ''}
          <div class="quiz-nav">
            <div class="pager-info">${currentIndex + 1} / ${chap.questions.length} · Capítulo ${currentChapter}</div>
            <div class="actions">
              <button class="q-btn" id="prev-btn" ${(currentChapter === 1 && currentIndex === 0) ? 'disabled' : ''}>← Anterior</button>
              <button class="q-btn primary" id="next-btn">${isLastOfChapter() ? (isLastChapter() ? 'Ver resultado' : 'Próximo capítulo →') : 'Próxima →'}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    bind();
  }
  
  function renderFeedback(q, answer) {
    const isCorrect = answer.correct;
    const correctOpt = q.options[q.correctIndex];
    const selectedOpt = q.options[answer.selected];
    let msg = '';
    if (isCorrect) {
      msg = correctOpt.feedback || `Resposta correta: a alternativa <strong>${correctOpt.letter}</strong> é a verdadeira.`;
    } else {
      const why = selectedOpt.feedback || '';
      msg = `A resposta correta é a alternativa <strong>${correctOpt.letter}</strong>: ${escapeHtml(correctOpt.text)}.${why ? '<br><br>' + escapeHtml(why) : ''}`;
    }
    return `
      <div class="q-feedback ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="ico">${isCorrect ? '✓' : '✕'}</div>
        <div>
          <strong>${isCorrect ? 'Resposta correta!' : 'Resposta incorreta'}</strong>
          <span>${msg}</span>
        </div>
      </div>
    `;
  }
  
  function isLastOfChapter() {
    const chap = chapterMap.get(currentChapter);
    return currentIndex === chap.questions.length - 1;
  }
  function isLastChapter() {
    return currentChapter === data[data.length - 1].chapter;
  }
  
  function bind() {
    root.querySelectorAll('.opt:not([disabled])').forEach(b => b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.idx);
      const chap = chapterMap.get(currentChapter);
      const q = chap.questions[currentIndex];
      answers[currentChapter][q.num] = { selected: idx, correct: idx === q.correctIndex };
      render();
    }));
    
    root.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      const ch = parseInt(c.dataset.chap);
      if (ch !== currentChapter) { currentChapter = ch; currentIndex = 0; view = 'question'; render(); }
    }));
    
    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    if (prev) prev.addEventListener('click', goPrev);
    if (next) next.addEventListener('click', goNext);
  }
  
  function goPrev() {
    if (currentIndex > 0) currentIndex--;
    else if (currentChapter > 1) {
      currentChapter--;
      currentIndex = chapterMap.get(currentChapter).questions.length - 1;
    }
    render();
  }
  
  function goNext() {
    const chap = chapterMap.get(currentChapter);
    if (currentIndex < chap.questions.length - 1) {
      currentIndex++;
      render();
    } else {
      // End of chapter — show chapter summary first
      view = 'chapter-summary';
      render();
    }
  }
  
  function advanceFromSummary() {
    const idx = data.findIndex(c => c.chapter === currentChapter);
    if (idx < data.length - 1) {
      currentChapter = data[idx + 1].chapter;
      currentIndex = 0;
      view = 'question';
      render();
      // scroll quiz section into view smoothly
      const sec = document.getElementById('quiz');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      view = 'question'; // reset state, then show final results
      showResults();
    }
  }
  
  function renderChapterSummary() {
    const chap = chapterMap.get(currentChapter);
    const qs = chap.questions;
    const total = qs.length;
    const stats = chapStats(currentChapter);
    const correct = stats.correct;
    const answered = stats.answered;
    const skipped = total - answered;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const isLast = isLastChapter();
    
    let title, msg;
    if (pct >= 85) { title = 'Excelente domínio do capítulo!'; msg = 'Você acertou a grande maioria das questões.'; }
    else if (pct >= 65) { title = 'Bom resultado neste capítulo'; msg = 'Você tem uma base sólida. Revise os pontos onde errou.'; }
    else if (pct >= 40) { title = 'Resultado intermediário'; msg = 'Vale revisar este capítulo no livro antes de seguir.'; }
    else { title = 'Recomendamos revisão'; msg = 'Este capítulo merece um estudo mais aprofundado.'; }
    
    const circ = 2 * Math.PI * 60;
    const offset = circ - (pct / 100) * circ;
    
    root.innerHTML = `
      <div class="quiz-shell">
        <div class="quiz-header">
          <div>
            <h3>Quiz interativo de Hematologia</h3>
            <div class="sub">Resumo do capítulo · pontuação por capítulo · feedback imediato.</div>
          </div>
          <div class="quiz-stats">
            <div class="stat-pill">
              <div class="stat-pill-label">Acertos · cap. ${currentChapter}</div>
              <div class="stat-pill-value"><span class="hit">${correct}</span><span class="of"> / ${total}</span></div>
            </div>
            <div class="stat-pill">
              <div class="stat-pill-label">Respondidas</div>
              <div class="stat-pill-value">${answered}<span class="of"> / ${total}</span></div>
              <div class="quiz-progress"><div class="quiz-progress-bar" style="width:100%"></div></div>
            </div>
          </div>
        </div>
        <div class="quiz-chapter-bar" id="chap-bar">
          ${data.map(c => {
            const s = chapStats(c.chapter);
            const done = s.answered === s.total && s.total > 0;
            return `
              <button class="chip ${c.chapter === currentChapter ? 'active' : ''} ${done ? 'done' : ''}" data-chap="${c.chapter}">
                Cap. ${c.chapter}${done ? ` · ${s.correct}/${s.total}` : ''}
              </button>
            `;
          }).join('')}
        </div>
        <div class="quiz-body chap-summary">
          <div class="cs-head">
            <div class="cs-eyebrow">Capítulo ${currentChapter} concluído · ${escapeHtml(CHAPTER_TITLES[currentChapter] || '')}</div>
            <h4 class="cs-title">${title}</h4>
            <p class="cs-msg">${msg}</p>
          </div>
          <div class="cs-grid">
            <div class="cs-ring-wrap">
              <div class="cs-ring">
                <svg viewBox="0 0 140 140">
                  <circle class="track" cx="70" cy="70" r="60"/>
                  <circle class="fill" cx="70" cy="70" r="60" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
                </svg>
                <div class="cs-ring-label"><div class="pct">${pct}%</div><div class="of">aproveitamento</div></div>
              </div>
              <div class="cs-score-line">
                Você acertou <strong>${correct}</strong> de <strong>${total}</strong> questões
                ${skipped > 0 ? `<span class="cs-skipped"> · ${skipped} pulada${skipped > 1 ? 's' : ''}</span>` : ''}
              </div>
            </div>
            <div class="cs-questions">
              <div class="cs-questions-label">Desempenho por questão</div>
              <div class="cs-dots">
                ${qs.map((q, i) => {
                  const a = answers[currentChapter][q.num];
                  let cls = 'skipped';
                  let title = `Questão ${i + 1} · não respondida`;
                  if (a) {
                    if (a.correct) { cls = 'correct'; title = `Questão ${i + 1} · acertou`; }
                    else { cls = 'incorrect'; title = `Questão ${i + 1} · errou`; }
                  }
                  return `<div class="cs-dot ${cls}" data-qidx="${i}" title="${title}">${i + 1}</div>`;
                }).join('')}
              </div>
              <div class="cs-legend">
                <span><i class="dot correct"></i> Acertou</span>
                <span><i class="dot incorrect"></i> Errou</span>
                <span><i class="dot skipped"></i> Pulou</span>
              </div>
            </div>
          </div>
          <div class="quiz-nav">
            <div class="pager-info">Capítulo ${currentChapter} de ${data.length}</div>
            <div class="actions">
              <button class="q-btn" id="review-btn">← Revisar capítulo</button>
              <button class="q-btn primary" id="advance-btn">${isLast ? 'Ver resultado final →' : `Capítulo ${data[data.findIndex(c => c.chapter === currentChapter) + 1].chapter} →`}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // bind chapter chips
    root.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      const ch = parseInt(c.dataset.chap);
      if (ch !== currentChapter) { currentChapter = ch; currentIndex = 0; view = 'question'; render(); }
    }));
    // bind dots — click to jump back to that question
    root.querySelectorAll('.cs-dot').forEach(d => d.addEventListener('click', () => {
      const i = parseInt(d.dataset.qidx);
      currentIndex = i;
      view = 'question';
      render();
    }));
    document.getElementById('review-btn').addEventListener('click', () => {
      currentIndex = 0;
      view = 'question';
      render();
    });
    document.getElementById('advance-btn').addEventListener('click', advanceFromSummary);
  }
  
  function showResults() {
    const rows = data.map(c => {
      const s = chapStats(c.chapter);
      return { chapter: c.chapter, title: CHAPTER_TITLES[c.chapter] || `Capítulo ${c.chapter}`, ...s };
    });
    const totalCorrect = rows.reduce((s, r) => s + r.correct, 0);
    const totalAnswered = rows.reduce((s, r) => s + r.answered, 0);
    const totalQs = rows.reduce((s, r) => s + r.total, 0);
    const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const circ = 2 * Math.PI * 78;
    const offset = circ - (pct / 100) * circ;
    
    let title, message;
    if (pct >= 85) { title = 'Excelente!'; message = 'Você domina os fundamentos de hematologia.'; }
    else if (pct >= 65) { title = 'Bom desempenho!'; message = 'Você tem uma base sólida. Revise os capítulos onde teve dificuldade.'; }
    else if (pct >= 40) { title = 'Continue estudando!'; message = 'Os fundamentos estão se consolidando. Volte aos capítulos com menor pontuação.'; }
    else { title = 'Hora de revisar!'; message = 'Recomendamos um estudo aprofundado dos capítulos. Use o livro como referência.'; }
    
    root.innerHTML = `
      <div class="quiz-shell">
        <div class="quiz-result">
          <div class="badge-result"><span>★</span> Resultado por capítulo</div>
          <h3>${title}</h3>
          <p style="color:rgba(255,255,255,0.7); max-width:46ch; margin:0 auto 8px; font-size:16px; line-height:1.6;">${message}</p>
          <div class="ring">
            <svg viewBox="0 0 180 180">
              <defs>
                <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#a24191"/>
                  <stop offset="50%" stop-color="#1f3f78"/>
                  <stop offset="100%" stop-color="#d2a911"/>
                </linearGradient>
              </defs>
              <circle class="track" cx="90" cy="90" r="78"/>
              <circle class="fill" cx="90" cy="90" r="78" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="ring-label"><div><div class="pct">${pct}%</div><div class="of">aproveitamento</div></div></div>
          </div>
          <div class="summary-row">
            <div class="stat"><div class="v ok">${totalCorrect}</div><div class="l">Acertos</div></div>
            <div class="stat"><div class="v">${totalAnswered}</div><div class="l">Respondidas</div></div>
            <div class="stat"><div class="v">${totalQs}</div><div class="l">Total</div></div>
          </div>
          <div class="result-table">
            ${rows.map(r => {
              const p = r.total > 0 ? (r.correct / r.total) * 100 : 0;
              return `
                <div class="result-row">
                  <div class="rr-num">Cap. ${r.chapter}</div>
                  <div class="rr-title">${r.title}</div>
                  <div class="rr-bar"><div class="rr-bar-fill" style="width:${p}%"></div></div>
                  <div class="rr-score">${r.correct}/${r.total}</div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:24px;">
            <button class="q-btn primary" id="restart-btn">Refazer quiz</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('restart-btn').addEventListener('click', () => {
      data.forEach(c => answers[c.chapter] = {});
      currentChapter = 1; currentIndex = 0; view = 'question';
      render();
    });
  }
  
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  
  render();
})();
