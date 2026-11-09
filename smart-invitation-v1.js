/* PAR ORDO GO — SMART INVITATION V1
   Add this file to the repository root and load it just before </body>.
   Standalone enhancement: does not change QR, API, registration, visits, or profile logic.
*/
(() => {
  'use strict';
  const INVITATIONS = [
    { title: 'PAR ORDO ждёт вас!', text: 'Ваше время для отдыха начинается здесь.' },
    { title: 'Оставьте суету за дверью.', text: 'Подарите себе время настоящего отдыха.' },
    { title: 'Тепло. Уют. Настоящий отдых.', text: 'Всё это ждёт вас в PAR ORDO.' },
    { title: 'Время перезагрузиться.', text: 'PAR ORDO приглашает вас восстановить силы.' },
    { title: 'Лучший момент для отдыха — сейчас.', text: 'Сделайте паузу и посвятите время себе.' },
    { title: 'Почувствуйте атмосферу настоящей бани.', text: 'Традиционное тепло и уют PAR ORDO.' },
    { title: 'Ваш отдых заслуживает особого внимания.', text: 'Мы будем рады видеть вас в PAR ORDO.' },
    { title: 'Отдохните душой и телом.', text: 'Пусть заботы подождут — время для себя.' },
    { title: 'Хороший отдых начинается с правильного выбора.', text: 'Выбирайте комфорт. Выбирайте PAR ORDO.' },
    { title: 'Пусть сегодняшний день завершится красиво.', text: 'Завершите день в атмосфере тепла и спокойствия.' },
    { title: 'Пора уделить время себе.', text: 'Небольшая пауза может подарить новые силы.' },
    { title: 'Больше тепла. Больше уюта. Больше отдыха.', text: 'Всё для вашего комфорта в PAR ORDO.' },
    { title: 'Место, куда хочется возвращаться.', text: 'Спасибо, что выбираете PAR ORDO.' },
    { title: 'Соберите друзей — время отдохнуть вместе!', text: 'Разделите приятные моменты с близкими.' },
    { title: 'Будем рады видеть вас снова!', text: 'До новой встречи в PAR ORDO.' },
    { title: 'Подарите себе заслуженный отдых.', text: 'PAR ORDO — место для вашего комфорта.' }
  ];
  const INTERVAL_MS = 6000;
  let index = 0;
  let timer = null;
  let swipeStart = null;

  const CSS = `
  .po-smart-invite{position:relative;isolation:isolate;overflow:hidden;margin:12px 0 16px;padding:14px 15px 11px;border-radius:19px;border:1px solid rgba(241,196,111,.48);background:radial-gradient(115% 125% at 100% 0%,rgba(235,163,69,.18),transparent 52%),linear-gradient(145deg,rgba(48,31,17,.91),rgba(12,11,9,.94) 70%);box-shadow:inset 0 1px 0 rgba(255,242,210,.13),0 12px 30px rgba(0,0,0,.28),0 0 22px rgba(226,169,83,.07);touch-action:pan-y;user-select:none;-webkit-user-select:none}
  .po-smart-invite:before{content:"";position:absolute;inset:5px;border:1px solid rgba(255,221,160,.10);border-radius:14px;pointer-events:none;z-index:-1}
  .po-smart-invite-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
  .po-smart-invite-label{display:flex;align-items:center;gap:7px;color:#f0cc87;font-size:9px;line-height:1.2;font-weight:900;letter-spacing:.15em}
  .po-smart-invite-label i{width:6px;height:6px;border-radius:50%;background:#f4c875;box-shadow:0 0 10px rgba(244,200,117,.8)}
  .po-smart-invite-count{flex:0 0 auto;color:#c6a66c;font-size:10px;font-weight:800;letter-spacing:.09em;font-variant-numeric:tabular-nums}
  .po-smart-invite-copy{min-height:60px;display:flex;flex-direction:column;justify-content:center;transition:opacity .22s ease,transform .22s ease}
  .po-smart-invite-copy.is-changing{opacity:0;transform:translate3d(0,7px,0)}
  .po-smart-invite-copy h2{font:700 clamp(17px,4.8vw,21px)/1.18 Georgia,"Iowan Old Style",serif;letter-spacing:.005em;color:#fff0d0;text-shadow:0 2px 14px rgba(229,177,90,.16);text-wrap:balance}
  .po-smart-invite-copy p{margin-top:5px;color:#d7c7a8;font-size:12px;line-height:1.4;text-wrap:pretty}
  .po-smart-invite-bottom{display:flex;align-items:center;gap:12px;margin-top:11px}
  .po-smart-invite-progress{height:3px;flex:1;overflow:hidden;border-radius:9px;background:rgba(255,255,255,.10)}
  .po-smart-invite-progress i{display:block;width:100%;height:100%;border-radius:9px;background:linear-gradient(90deg,#f0c56d,#ff8a3d);transform:scaleX(0);transform-origin:left}
  .po-smart-invite-progress i.run{animation:poSmartInviteFill 6s linear forwards}
  @keyframes poSmartInviteFill{to{transform:scaleX(1)}}
  .po-smart-invite-controls{display:flex;gap:6px}
  .po-smart-invite-controls button{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(239,197,119,.38);background:rgba(240,185,90,.08);color:#f4d99f;font:600 20px/1 Georgia,serif;padding:0}
  .po-smart-invite-controls button:active{transform:scale(.94);background:rgba(240,185,90,.2)}
  .po-smart-invite-hint{margin-top:6px;color:rgba(215,199,168,.55);font-size:9px;letter-spacing:.025em}
  @media(min-width:420px){.po-smart-invite{padding:16px 18px 12px}.po-smart-invite-copy{min-height:64px}}
  @media(prefers-reduced-motion:reduce){.po-smart-invite-copy{transition:none}.po-smart-invite-progress i.run{animation:none;transform:scaleX(1)}}
  `;

  function $(selector, root = document) { return root.querySelector(selector); }
  function stopTimer() {
    if (timer !== null) { window.clearInterval(timer); timer = null; }
    const bar = $('#poSmartInviteProgress i');
    if (bar) bar.classList.remove('run');
  }
  function render(nextIndex, animate = true) {
    const card = $('#poSmartInvite');
    if (!card) return;
    index = (nextIndex + INVITATIONS.length) % INVITATIONS.length;
    const item = INVITATIONS[index];
    const copy = $('#poSmartInviteCopy');
    const apply = () => {
      $('#poSmartInviteTitle').textContent = item.title;
      $('#poSmartInviteText').textContent = item.text;
      $('#poSmartInviteCount').textContent = `${String(index + 1).padStart(2, '0')} / ${String(INVITATIONS.length).padStart(2, '0')}`;
      if (copy && animate) copy.classList.remove('is-changing');
      restartProgress();
    };
    if (animate && copy) {
      copy.classList.add('is-changing');
      window.setTimeout(apply, 180);
    } else apply();
  }
  function restartProgress() {
    const bar = $('#poSmartInviteProgress i');
    if (!bar) return;
    bar.classList.remove('run');
    void bar.offsetWidth;
    if (!document.hidden && isHomeVisible()) bar.classList.add('run');
  }
  function isHomeVisible() {
    const home = $('#home');
    return Boolean(home && !home.hidden);
  }
  function startTimer() {
    stopTimer();
    if (document.hidden || !isHomeVisible() || !$('#poSmartInvite')) return;
    restartProgress();
    timer = window.setInterval(() => {
      if (document.hidden || !isHomeVisible()) { stopTimer(); return; }
      render(index + 1, true);
    }, INTERVAL_MS);
  }
  function step(delta) {
    render(index + delta, true);
    startTimer();
  }
  function init() {
    const hello = $('#hello');
    if (!hello || $('#poSmartInvite')) return;
    const style = document.createElement('style');
    style.id = 'poSmartInviteStyles';
    style.textContent = CSS;
    document.head.appendChild(style);

    const section = document.createElement('section');
    section.id = 'poSmartInvite';
    section.className = 'po-smart-invite';
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Приглашения PAR ORDO');
    section.innerHTML = `
      <div class="po-smart-invite-head">
        <span class="po-smart-invite-label"><i></i> ПРИГЛАШЕНИЕ PAR ORDO</span>
        <span id="poSmartInviteCount" class="po-smart-invite-count">01 / 15</span>
      </div>
      <div id="poSmartInviteCopy" class="po-smart-invite-copy" aria-live="polite" aria-atomic="true">
        <h2 id="poSmartInviteTitle"></h2><p id="poSmartInviteText"></p>
      </div>
      <div class="po-smart-invite-bottom">
        <div id="poSmartInviteProgress" class="po-smart-invite-progress" aria-hidden="true"><i></i></div>
        <div class="po-smart-invite-controls">
          <button id="poSmartInvitePrev" type="button" aria-label="Предыдущее приглашение">‹</button>
          <button id="poSmartInviteNext" type="button" aria-label="Следующее приглашение">›</button>
        </div>
      </div>
      <p class="po-smart-invite-hint">Листайте, чтобы увидеть больше приглашений</p>`;
    hello.insertAdjacentElement('afterend', section);

    $('#poSmartInvitePrev').addEventListener('click', () => step(-1));
    $('#poSmartInviteNext').addEventListener('click', () => step(1));
    section.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      swipeStart = { x: event.clientX, y: event.clientY };
    });
    section.addEventListener('pointerup', event => {
      if (!swipeStart) return;
      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.25) step(dx < 0 ? 1 : -1);
    });
    section.addEventListener('pointercancel', () => { swipeStart = null; });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopTimer(); else startTimer();
    });
    const home = $('#home');
    if (home && 'MutationObserver' in window) {
      new MutationObserver(startTimer).observe(home, { attributes: true, attributeFilter: ['hidden'] });
    }
    document.querySelectorAll('nav button').forEach(button => button.addEventListener('click', () => {
      window.setTimeout(startTimer, 0);
    }));

    render(0, false);
    startTimer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
