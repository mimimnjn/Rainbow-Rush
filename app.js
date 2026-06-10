/**
 * 레인보우 러쉬 - 한글 및 라이트 테마 게임 스크립트 + Supabase 연동
 */

// 1. 지시약 화학 데이터 (한글 번역 적용)
const INDICATORS = [
  {
    id: 'btb',
    name: '브롬티몰 블루 (BTB)',
    transitionText: '6.0 – 7.6 (노랑 ➔ 초록 ➔ 파랑)',
    acidColor: '노랑',
    baseColor: '파랑',
    colorAtPh: (ph) => {
      if (ph <= 6.0) return { name: '노랑', hex: '#eab308' };
      if (ph >= 7.6) return { name: '파랑', hex: '#3b82f6' };
      return { name: '초록', hex: '#22c55e' };
    }
  },
  {
    id: 'phenolphthalein',
    name: '페놀프탈레인',
    transitionText: '8.2 – 10.0 (무색 ➔ 분홍)',
    acidColor: '무색',
    baseColor: '분홍',
    colorAtPh: (ph) => {
      if (ph < 8.2) return { name: '무색', hex: 'rgba(156, 163, 175, 0.2)' }; // 연한 회색으로 무색 표현
      return { name: '분홍', hex: '#ec4899' };
    }
  },
  {
    id: 'methyl_orange',
    name: '메틸 오렌지',
    transitionText: '3.1 – 4.4 (빨강 ➔ 주황 ➔ 노랑)',
    acidColor: '빨강',
    baseColor: '노랑',
    colorAtPh: (ph) => {
      if (ph <= 3.1) return { name: '빨강', hex: '#ef4444' };
      if (ph >= 4.4) return { name: '노랑', hex: '#eab308' };
      return { name: '주황', hex: '#f97316' };
    }
  },
  {
    id: 'methyl_red',
    name: '메틸 레드',
    transitionText: '4.4 – 6.2 (빨강 ➔ 주황 ➔ 노랑)',
    acidColor: '빨강',
    baseColor: '노랑',
    colorAtPh: (ph) => {
      if (ph <= 4.4) return { name: '빨강', hex: '#ef4444' };
      if (ph >= 6.2) return { name: '노랑', hex: '#eab308' };
      return { name: '주황', hex: '#f97316' };
    }
  },
  {
    id: 'litmus',
    name: '리트머스',
    transitionText: '4.5 – 8.3 (빨강 ➔ 보라 ➔ 파랑)',
    acidColor: '빨강',
    baseColor: '파랑',
    colorAtPh: (ph) => {
      if (ph <= 4.5) return { name: '빨강', hex: '#ef4444' };
      if (ph >= 8.3) return { name: '파랑', hex: '#3b82f6' };
      return { name: '보라', hex: '#a855f7' };
    }
  },
  {
    id: 'bromocresol_green',
    name: '브로모크레솔 그린',
    transitionText: '3.8 – 5.4 (노랑 ➔ 초록 ➔ 파랑)',
    acidColor: '노랑',
    baseColor: '파랑',
    colorAtPh: (ph) => {
      if (ph <= 3.8) return { name: '노랑', hex: '#eab308' };
      if (ph >= 5.4) return { name: '파랑', hex: '#3b82f6' };
      return { name: '초록', hex: '#22c55e' };
    }
  },
  {
    id: 'thymol_blue',
    name: '티몰 블루',
    transitionText: '1.2–2.8 (빨강➔노랑) | 8.0–9.6 (노랑➔파랑)',
    acidColor: '빨강/노랑',
    baseColor: '파랑',
    colorAtPh: (ph) => {
      if (ph <= 1.2) return { name: '빨강', hex: '#ef4444' };
      if (ph > 1.2 && ph < 2.8) return { name: '주황', hex: '#f97316' };
      if (ph >= 2.8 && ph <= 8.0) return { name: '노랑', hex: '#eab308' };
      if (ph > 8.0 && ph < 9.6) return { name: '초록', hex: '#22c55e' };
      return { name: '파랑', hex: '#3b82f6' };
    }
  }
];

// 스트룹 효과 컬러 매핑
const STROOP_COLORS = {
  '빨강': '#ef4444',
  '노랑': '#eab308',
  '파랑': '#3b82f6',
  '초록': '#22c55e',
  '주황': '#f97316',
  '보라': '#a855f7',
  '분홍': '#ec4899',
  '무색': '#9ca3af'
};

// 지시약 카드 필터별 그라데이션 트랙 CSS
const INDICATOR_GRADIENTS = {
  btb: 'linear-gradient(to right, #eab308 0%, #eab308 40%, #22c55e 50%, #3b82f6 60%, #3b82f6 100%)',
  phenolphthalein: 'linear-gradient(to right, rgba(156, 163, 175, 0.2) 0%, rgba(156, 163, 175, 0.2) 65%, #ec4899 80%, #ec4899 100%)',
  methyl_orange: 'linear-gradient(to right, #ef4444 0%, #ef4444 20%, #f97316 40%, #eab308 60%, #eab308 100%)',
  methyl_red: 'linear-gradient(to right, #ef4444 0%, #ef4444 35%, #f97316 50%, #eab308 65%, #eab308 100%)',
  litmus: 'linear-gradient(to right, #ef4444 0%, #ef4444 35%, #a855f7 55%, #3b82f6 75%, #3b82f6 100%)',
  bromocresol_green: 'linear-gradient(to right, #eab308 0%, #eab308 30%, #22c55e 45%, #3b82f6 60%, #3b82f6 100%)',
  thymol_blue: 'linear-gradient(to right, #ef4444 0%, #ef4444 8%, #f97316 15%, #eab308 25%, #eab308 65%, #22c55e 75%, #3b82f6 85%, #3b82f6 100%)'
};

// Supabase API 설정
const SUPABASE_URL = 'https://qqqklrgczzjhokawlepf.supabase.co/rest/v1/leaderboard';
const SUPABASE_KEY = 'sb_publishable_qSB6beyQnpc2eweLzFe33A_81Uzg8EA';

// 2. 게임 상태 변수
let score = 0;
let combo = 0;
let lives = 3;
let timer = null;
let currentLimit = 15; // 기본 시간 제한 15초
let timerInterval = null;
let currentQuestion = {
  targetColor: '',
  targetTextColor: ''
};
let selectedIndicatorId = null;
let currentRoundIndicators = []; // 현재 라운드 노출 지시약 4개

// 3. DOM 요소들
const startScreen = document.getElementById('start-screen');
const playScreen = document.getElementById('play-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreVal = document.getElementById('score-val');
const comboVal = document.getElementById('combo-val');
const livesBox = document.getElementById('lives-box');
const timerProgress = document.getElementById('timer-progress');
const timerText = document.getElementById('timer-text');
const difficultyText = document.getElementById('difficulty-text');
const targetText = document.getElementById('target-text');
const indicatorButtons = document.getElementById('indicator-buttons');
const phInput = document.getElementById('ph-input');
const phValDisplay = document.getElementById('ph-val-display');
const submitBtn = document.getElementById('submit-btn');
const beakerLiquid = document.getElementById('beaker-liquid');
const feedbackStatus = document.getElementById('feedback-status');
const finalScore = document.getElementById('final-score');
const maxComboDisplay = document.getElementById('max-combo');
let maxCombo = 0;

const startBtn = document.getElementById('start-game-btn');
const restartBtn = document.getElementById('restart-game-btn');
const rulesModal = document.getElementById('rules-modal');
const rulesToggleBtn = document.getElementById('rules-toggle-btn');
const rulesNavBtn = document.getElementById('nav-rules-btn');
const closeRulesBtn = document.getElementById('close-modal-btn');
const navGameBtn = document.getElementById('nav-game');

// 리더보드 연동 DOM 요소들
const navLeaderboardBtn = document.getElementById('nav-leaderboard-btn');
const leaderboardModal = document.getElementById('leaderboard-modal');
const closeLeaderboardModalBtn = document.getElementById('close-leaderboard-modal-btn');
const submitScoreBtn = document.getElementById('submit-score-btn');
const scoreSubmitBox = document.getElementById('score-submit-box');

// 4. 초기화 설정
function initUI() {
  // 지시약 참고 카드 채우기
  const cardsContainer = document.getElementById('indicator-cards-container');
  if (cardsContainer) {
    cardsContainer.innerHTML = INDICATORS.map(ind => `
      <div class="indicator-card-item">
        <div class="indicator-card-header">${ind.name}</div>
        <div class="indicator-meta-text">
          <div><span class="indicator-meta-label">변색 범위:</span> ${ind.transitionText}</div>
          <div><span class="indicator-meta-label">산성 색상:</span> ${ind.acidColor}</div>
          <div><span class="indicator-meta-label">염기성 색상:</span> ${ind.baseColor}</div>
        </div>
        <div>
          <div class="indicator-gradient-track" style="background: ${INDICATOR_GRADIENTS[ind.id]}"></div>
          <div class="indicator-gradient-labels">
            <span>pH 1</span>
            <span>7 (중성)</span>
            <span>pH 14</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // pH 슬라이더 이벤트 바인딩
  phInput.addEventListener('input', (e) => {
    phValDisplay.textContent = parseFloat(e.target.value).toFixed(1);
    updateVisualFeedback();
  });

  // 버튼 클릭 핸들러 바인딩
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  
  // 모달 제어
  const openModal = () => rulesModal.classList.add('active');
  const closeModal = () => rulesModal.classList.remove('active');
  
  rulesToggleBtn.addEventListener('click', openModal);
  rulesNavBtn.addEventListener('click', openModal);
  closeRulesBtn.addEventListener('click', closeModal);
  rulesModal.addEventListener('click', (e) => {
    if (e.target === rulesModal) closeModal();
  });

  // 리더보드 모달 제어
  const openLeaderboard = () => {
    leaderboardModal.classList.add('active');
    fetchLeaderboard();
  };
  const closeLeaderboard = () => leaderboardModal.classList.remove('active');
  
  navLeaderboardBtn.addEventListener('click', openLeaderboard);
  closeLeaderboardModalBtn.addEventListener('click', closeLeaderboard);
  leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) closeLeaderboard();
  });

  navGameBtn.addEventListener('click', () => {
    closeModal();
    closeLeaderboard();
    if (playScreen.classList.contains('active')) {
      // 이미 재생 중이면 무시
    } else {
      showScreen(startScreen);
    }
  });

  submitBtn.addEventListener('click', checkAnswer);
  submitScoreBtn.addEventListener('click', submitScore);
}

// 배열 셔플 헬퍼 함수
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 5. 게임 화면 전환
function showScreen(screen) {
  startScreen.classList.remove('active');
  playScreen.classList.remove('active');
  gameOverScreen.classList.remove('active');
  screen.classList.add('active');
  
  // 탭 활성화 클래스 조절
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (screen === playScreen) {
    document.getElementById('nav-game').classList.add('active');
  }
}

// 6. 게임 구동 액션들
function startGame() {
  score = 0;
  combo = 0;
  maxCombo = 0;
  lives = 3;
  currentLimit = 15;
  selectedIndicatorId = null;
  phInput.value = 7.0;
  phValDisplay.textContent = '7.0';
  
  // 점수 입력창 원복
  scoreSubmitBox.style.display = 'flex';
  document.getElementById('nickname-input').value = '';
  document.getElementById('password-input').value = '';
  
  updateScoreUI();
  updateLivesUI();
  showScreen(playScreen);
  nextQuestion();
}

function updateScoreUI() {
  scoreVal.textContent = String(score).padStart(6, '0');
  comboVal.textContent = combo;
}

function updateLivesUI() {
  livesBox.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const isLost = i >= lives;
    // 하트 아이콘
    livesBox.innerHTML += `
      <svg class="live-heart ${isLost ? 'lost' : ''}" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;
  }
}

// 반응 혼합액 결과 판단
function getReactionResult() {
  if (!selectedIndicatorId) return null;
  const indicator = INDICATORS.find(ind => ind.id === selectedIndicatorId);
  const ph = parseFloat(phInput.value);
  return indicator.colorAtPh(ph);
}

// 비커 프리뷰 컬러 실시간 업데이트
function updateVisualFeedback() {
  const result = getReactionResult();
  
  if (result) {
    feedbackStatus.innerHTML = `혼합 상태: <span style="color: ${result.name === '무색' ? 'var(--text-silver)' : result.hex}">${result.name}</span>`;
    beakerLiquid.style.fill = result.hex;
  } else {
    feedbackStatus.textContent = '지시약과 pH를 선택하세요';
    beakerLiquid.style.fill = '#cbd5e1'; // 기본 회색 상태
  }
}

// 7. 정답 보장형 문항 생성 로직
function generateSolvableRound() {
  // 1. 임의의 정답용 지시약을 먼저 선택
  const correctIndicator = INDICATORS[Math.floor(Math.random() * INDICATORS.length)];
  
  // 2. 해당 지시약이 변색할 수 있는 임의의 pH 레벨 설정 (1 ~ 14)
  const randomPh = parseFloat((Math.random() * 13 + 1).toFixed(1));
  
  // 3. 지시약의 해당 pH 결과 색상을 타겟 색상으로 설정 (100% 정답 보장)
  const targetReaction = correctIndicator.colorAtPh(randomPh);
  const targetColor = targetReaction.name;

  // 4. 나머지 3개의 오답용 지시약을 선택하여 총 4개의 지시약 그룹 구성
  const otherIndicators = INDICATORS.filter(ind => ind.id !== correctIndicator.id);
  shuffle(otherIndicators);
  
  const selectedPool = [correctIndicator, otherIndicators[0], otherIndicators[1], otherIndicators[2]];
  currentRoundIndicators = shuffle(selectedPool);

  // 5. 타겟 텍스트 스트룹 효과 설정 (한글 키 매핑)
  const koreanColors = ['빨강', '노랑', '파랑', '초록', '주황', '보라', '분홍', '무색'];
  let stroopColorText = koreanColors[Math.floor(Math.random() * koreanColors.length)];

  currentQuestion = {
    targetColor: targetColor,
    targetTextColor: STROOP_COLORS[stroopColorText]
  };
}

function nextQuestion() {
  clearInterval(timerInterval);
  selectedIndicatorId = null;

  // 정답 보장형 지시약 세트 생성
  generateSolvableRound();

  // 타겟 텍스트 출력
  targetText.textContent = currentQuestion.targetColor;
  targetText.style.color = currentQuestion.targetTextColor;

  // 4개 선택 지시약 렌더링
  indicatorButtons.innerHTML = currentRoundIndicators.map(ind => `
    <button class="btn-indicator" data-id="${ind.id}">${ind.name}</button>
  `).join('');

  // 지시약 선택 버튼 리스너 바인딩
  document.querySelectorAll('.btn-indicator').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-indicator').forEach(b => b.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      selectedIndicatorId = e.currentTarget.dataset.id;
      updateVisualFeedback();
    });
  });

  // 난이도 변경 태그 업데이트
  difficultyText.textContent = `제한 시간: ${currentLimit}초`;
  if (currentLimit <= 8) {
    difficultyText.style.color = 'var(--brand-red)';
  } else {
    difficultyText.style.color = 'var(--text-silver)';
  }

  startTimer();
  updateVisualFeedback();
}

function startTimer() {
  let timeLeft = currentLimit;
  timerProgress.style.width = '100%';
  timerProgress.style.backgroundColor = 'var(--brand-red)';
  timerText.textContent = `${timeLeft.toFixed(1)}초`;

  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    if (timeLeft < 0) timeLeft = 0;
    
    const percent = (timeLeft / currentLimit) * 100;
    timerProgress.style.width = `${percent}%`;
    timerText.textContent = `${timeLeft.toFixed(1)}초`;

    if (timeLeft < 4) {
      timerProgress.style.backgroundColor = 'var(--text-negative)';
      timerText.style.color = 'var(--text-negative)';
    } else {
      timerText.style.color = 'var(--brand-red)';
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 100);
}

function handleTimeout() {
  lives--;
  combo = 0;
  updateLivesUI();
  updateScoreUI();
  
  if (lives <= 0) {
    endGame();
  } else {
    nextQuestion();
  }
}

// 토스트 알림창 출력 헬퍼 함수
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function checkAnswer() {
  if (!selectedIndicatorId) {
    showToast('⚠️ 경고: 먼저 지시약을 선택해주세요!');
    return;
  }

  const result = getReactionResult();
  if (!result) return;

  clearInterval(timerInterval);

  if (result.name === currentQuestion.targetColor) {
    // 정답 처리
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    
    let bonus = 0;
    if (combo === 2) bonus = 20;
    else if (combo === 3) bonus = 50;
    else if (combo >= 4) bonus = 100;
    
    score += (100 + bonus);
    
    // 점진적 난이도 조절 (점수 구간별 동적 최소 시간 제한 설정)
    let minLimit = 5; // 기본 초반 최소 제한 시간: 5초
    if (score >= 5000) {
      minLimit = 3;   // 5000점 이상: 최소 3초까지 감소 허용
    } else if (score >= 3000) {
      minLimit = 4;   // 3000점 이상: 최소 4초까지 감소 허용
    }

    if (currentLimit > minLimit) {
      currentLimit = Math.max(minLimit, currentLimit - 1);
      
      // 제한 시간 변경 시 헤더 텍스트 모션 추가
      difficultyText.classList.add('pop-alert');
      setTimeout(() => difficultyText.classList.remove('pop-alert'), 500);
    }
    
    updateScoreUI();
    nextQuestion();
  } else {
    // 오답 처리
    lives--;
    combo = 0;
    updateLivesUI();
    updateScoreUI();
    
    if (lives <= 0) {
      endGame();
    } else {
      nextQuestion();
    }
  }
}

function endGame() {
  clearInterval(timerInterval);
  finalScore.textContent = score;
  maxComboDisplay.textContent = maxCombo;
  showScreen(gameOverScreen);
  fetchLeaderboard();
}

// 8. Supabase Leaderboard API 연동 함수들
async function fetchLeaderboard() {
  try {
    const response = await fetch(`${SUPABASE_URL}?select=*&order=score.desc&limit=100`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!response.ok) throw new Error('랭킹 조회 실패');
    const data = await response.json();
    renderLeaderboard(data);
  } catch (error) {
    console.error('리더보드 조회 에러:', error);
    const errorHtml = `<div style="text-align: center; padding: 20px; color: var(--text-negative);">랭킹 조회 실패</div>`;
    document.getElementById('leaderboard-list').innerHTML = errorHtml;
    const modalList = document.getElementById('modal-leaderboard-list');
    if (modalList) modalList.innerHTML = errorHtml;
  }
}

function renderLeaderboard(data) {
  // 중복 플레이어 제거하여 개인별 최고 기록만 추출
  const seenPlayers = new Set();
  const uniqueRankings = [];

  for (const item of data) {
    const name = (item.player_name || '익명').trim();
    if (!seenPlayers.has(name)) {
      seenPlayers.add(name);
      uniqueRankings.push(item);
    }
    if (uniqueRankings.length >= 10) {
      break;
    }
  }

  const rowsHtml = uniqueRankings.map((item, index) => {
    let rankClass = '';
    if (index === 0) rankClass = 'rank-gold';
    else if (index === 1) rankClass = 'rank-silver';
    else if (index === 2) rankClass = 'rank-bronze';

    return `
      <div class="ranking-row">
        <div class="rank-badge ${rankClass}">${index + 1}</div>
        <div class="rank-user-info">
          <div class="rank-nickname">${item.player_name || '익명'}</div>
          <div class="rank-combo-label">최대 콤보: ${item.highest_combo}</div>
        </div>
        <div class="rank-score-container">
          <span class="rank-score">${item.score.toLocaleString()}</span>
          <span class="rank-score-suffix">점</span>
        </div>
      </div>
    `;
  }).join('');

  const listEl = document.getElementById('leaderboard-list');
  if (listEl) {
    listEl.innerHTML = rowsHtml || `<div style="text-align: center; padding: 20px; color: var(--text-silver);">기록이 없습니다. 첫 주자가 되어보세요!</div>`;
  }
  const modalList = document.getElementById('modal-leaderboard-list');
  if (modalList) {
    modalList.innerHTML = rowsHtml || `<div style="text-align: center; padding: 20px; color: var(--text-silver);">기록이 없습니다. 첫 주자가 되어보세요!</div>`;
  }
}

async function submitScore() {
  const nicknameInput = document.getElementById('nickname-input');
  const passwordInput = document.getElementById('password-input');
  const nickname = nicknameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!nickname) {
    alert('닉네임을 입력해주세요!');
    return;
  }

  const submitBtnEl = document.getElementById('submit-score-btn');
  submitBtnEl.disabled = true;
  submitBtnEl.textContent = '등록 중...';

  try {
    // 1. 기존 유저 정보 조회 (비밀번호 및 최고 점수 비교용)
    const checkRes = await fetch(`${SUPABASE_URL}?player_name=eq.${encodeURIComponent(nickname)}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    let existingRecord = null;
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data && data.length > 0) {
        existingRecord = data[0];
      }
    }

    if (existingRecord) {
      // 비밀번호 검증 (기존 비밀번호가 있을 때만 체크)
      if (existingRecord.password && password && existingRecord.password !== password) {
        alert('비밀번호가 일치하지 않습니다. 다른 닉네임을 사용하거나 올바른 비밀번호를 입력해주세요.');
        submitBtnEl.disabled = false;
        submitBtnEl.textContent = '랭킹 등록하기';
        return;
      }

      // 신기록 갱신 여부 검증
      if (score <= existingRecord.score) {
        alert(`기존 최고 기록(${existingRecord.score}점)보다 낮거나 같아 등록되지 않습니다.`);
        nicknameInput.value = '';
        passwordInput.value = '';
        scoreSubmitBox.style.display = 'none';
        await fetchLeaderboard();
        return;
      }

      // 기존 기록 삭제 (DELETE)
      try {
        await fetch(`${SUPABASE_URL}?player_name=eq.${encodeURIComponent(nickname)}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
      } catch (err) {
        console.warn('기존 기록 삭제 중 오류(무시 가능):', err);
      }
    }

    // 2. 새로운 기록 삽입 (POST)
    const insertRes = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        player_name: nickname,
        score: score,
        highest_combo: maxCombo,
        password: password
      })
    });

    if (!insertRes.ok) {
      // password 컬럼 부재 시 password 컬럼을 제외하고 다시 POST 시도
      const retryRes = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          player_name: nickname,
          score: score,
          highest_combo: maxCombo
        })
      });
      if (!retryRes.ok) throw new Error('등록 실패');
    }

    alert('성공적으로 등록되었습니다!');
    nicknameInput.value = '';
    passwordInput.value = '';
    scoreSubmitBox.style.display = 'none';
    
    // 리더보드 즉시 갱신
    await fetchLeaderboard();
  } catch (error) {
    console.error('랭킹 등록 에러:', error);
    alert('랭킹 등록에 실패했습니다. 다시 시도해 주세요.');
  } finally {
    submitBtnEl.disabled = false;
    submitBtnEl.textContent = '랭킹 등록하기';
  }
}

// 9. 페이지 로드 시 구동
window.addEventListener('DOMContentLoaded', () => {
  initUI();
  showScreen(startScreen);
});
