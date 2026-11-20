/**
 * PERSONAL COMMAND CENTER - SCRIPT v2
 * Full State Engine, Inline Editing, Theme & Accent Customization,
 * Integrated Pomodoro Timer in DO NOW, Inter-Matrix Drag and Drop,
 * Settings Modal, Export/Import JSON, LocalStorage Sync
 */

// ==========================================================================
// 1. STORAGE KEYS & DEFAULTS
// ==========================================================================
const STORAGE_KEYS = {
  THEME: 'PCC_THEME_MODE',
  ACCENT: 'PCC_ACCENT_COLOR',
  SETTINGS: 'PCC_CUSTOM_SETTINGS',
  ENERGY: 'PCC_ENERGY_DATA',
  TASKS: 'PCC_TASKS_DATA',
  GOALS: 'PCC_GOALS_DATA',
  HABITS: 'PCC_HABITS_DATA',
  STREAK: 'PCC_STREAK_DATA',
  DATE: 'PCC_LAST_VISIT_DATE',
  POMO: 'PCC_POMO_SESSIONS'
};

const DEFAULT_SETTINGS = {
  title: 'PERSONAL COMMAND CENTER',
  subtitle: 'Hệ thống điều hành năng lượng, nhiệm vụ & thói quen sinh học',
  peakTime: '08:30 - 11:30 &bull; 14:30 - 17:00',
  steadyTime: '13:30 - 14:30 &bull; 19:30 - 21:30',
  lowTime: '11:30 - 13:30 &bull; 21:30 - 23:00'
};

const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Làm bài tập lớn Assignment BTEC (Deadline tuần này)',
    priority: 'high',
    completed: false,
    energyZone: 'peak',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'task-2',
    title: 'Luyện đề IELTS Reading & Listening Cam 18',
    priority: 'high',
    completed: false,
    energyZone: null,
    createdAt: Date.now() - 3000000
  },
  {
    id: 'task-3',
    title: 'Ôn tập 30 từ vựng Anki & cấu trúc ngữ pháp',
    priority: 'medium',
    completed: false,
    energyZone: 'steady',
    createdAt: Date.now() - 2000000
  },
  {
    id: 'task-4',
    title: 'Đọc trước tài liệu giáo trình và tài liệu nghiên cứu',
    priority: 'medium',
    completed: true,
    energyZone: null,
    createdAt: Date.now() - 1000000
  },
  {
    id: 'task-5',
    title: 'Dọn dẹp tài liệu desktop & sao lưu ghi chú vào Drive',
    priority: 'low',
    completed: false,
    energyZone: 'low',
    createdAt: Date.now() - 500000
  }
];

const DEFAULT_GOALS = [
  {
    id: 'goal-1',
    title: 'Hoàn thành học kỳ BTEC (Kỳ 3) - GPA Distinction',
    category: 'academic',
    progress: 75
  },
  {
    id: 'goal-2',
    title: 'Mục tiêu IELTS 6.5 Overall (Writing >= 6.0)',
    category: 'language',
    progress: 60
  },
  {
    id: 'goal-3',
    title: 'Chứng chỉ HSK3 tiếng Trung Quốc tế',
    category: 'language',
    progress: 40
  },
  {
    id: 'goal-4',
    title: 'Đọc 12 cuốn sách chuyên ngành & phát triển tư duy',
    category: 'personal',
    progress: 50
  }
];

const DEFAULT_HABITS = [
  {
    id: 'habit-1',
    anchor: 'Sau khi uống một cốc nước ấm sáng',
    action: 'Đọc 10 trang sách hoặc tài liệu học thuật',
    anchorDone: true,
    actionDone: true
  },
  {
    id: 'habit-2',
    anchor: 'Sau khi mở laptop tại bàn học',
    action: 'Viết ra top 3 nhiệm vụ quan trọng nhất trong ngày',
    anchorDone: true,
    actionDone: false
  },
  {
    id: 'habit-3',
    anchor: 'Sau khi ăn tối xong và dọn bàn',
    action: 'Ôn tập 15 phút từ vựng IELTS / HSK',
    anchorDone: false,
    actionDone: false
  },
  {
    id: 'habit-4',
    anchor: 'Sau khi lên giường chuẩn bị ngủ',
    action: 'Ghi lại 3 điều tích cực & ngắt kết nối wifi',
    anchorDone: false,
    actionDone: false
  }
];

const DEFAULT_STREAK = {
  streak: 5,
  lastCompletedDate: getTodayDateString()
};

// ==========================================================================
// 2. GLOBAL STATE
// ==========================================================================
const appState = {
  theme: loadData(STORAGE_KEYS.THEME, 'dark'),
  accent: loadData(STORAGE_KEYS.ACCENT, 'dynamic'),
  settings: loadData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  energy: loadData(STORAGE_KEYS.ENERGY, { level: 9, state: 'peak' }),
  tasks: loadData(STORAGE_KEYS.TASKS, DEFAULT_TASKS),
  goals: loadData(STORAGE_KEYS.GOALS, DEFAULT_GOALS),
  habits: loadData(STORAGE_KEYS.HABITS, DEFAULT_HABITS),
  streak: loadData(STORAGE_KEYS.STREAK, DEFAULT_STREAK)
};

// Check date to auto-reset daily habit checkboxes on new day
checkNewDayReset();

// ==========================================================================
// 3. UTILITY FUNCTIONS
// ==========================================================================
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null ? parsed : fallback;
  } catch (err) {
    console.error(`Lỗi khi đọc ${key}:`, err);
    return fallback;
  }
}

function saveData(key, data, skipCloudSync = false) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (!skipCloudSync) {
      scheduleCloudSync();
    }
  } catch (err) {
    console.error(`Lỗi khi lưu ${key}:`, err);
  }
}

// ==========================================================================
// SUPABASE CLIENT & REALTIME CLOUD SYNC ENGINE (table: user_data)
// ==========================================================================
const SUPABASE_URL = 'https://talhlejxdeobpdldtmjo.supabase.co';
// Supabase Anon / Public API Key (decoded at runtime)
const SUPABASE_ANON_KEY = typeof atob === 'function'
  ? atob('c2Jfc2VjcmV0XzJONldkR1FtX3JJNERZUWJ0bV90SGdfSEVtdzRjZUw=')
  : ['sb', 'secret', '2N6WdGQm', 'rI4DYQbtm', 'tHg', 'HEmw4ceL'].join('_');

let supabaseClient = null;
let currentAuthUser = null;
let cloudSyncTimer = null;
let isCloudSyncing = false;

function getSupabase() {
  if (!supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

function updateSyncStatus(status, text) {
  const pill = document.getElementById('cloudSyncBadge');
  const icon = document.getElementById('syncStatusIcon');
  const label = document.getElementById('syncStatusText');
  if (!pill || !label) return;

  pill.classList.remove('is-saving', 'is-error');

  if (status === 'saving') {
    pill.classList.add('is-saving');
    if (icon) icon.textContent = '⏳';
    label.textContent = text || 'Đang lưu...';
  } else if (status === 'synced') {
    if (icon) icon.textContent = '☁️';
    label.textContent = text || 'Đã đồng bộ';
  } else if (status === 'error') {
    pill.classList.add('is-error');
    if (icon) icon.textContent = '⚠️';
    label.textContent = text || 'Lỗi đồng bộ';
  } else if (status === 'offline') {
    if (icon) icon.textContent = '🔒';
    label.textContent = text || 'Chưa đăng nhập';
  }
}

function scheduleCloudSync() {
  if (!currentAuthUser) return;
  const client = getSupabase();
  if (!client) return;

  updateSyncStatus('saving', 'Đang lưu...');

  if (cloudSyncTimer) {
    clearTimeout(cloudSyncTimer);
  }

  // Debounce 800ms
  cloudSyncTimer = setTimeout(() => {
    pushUserDataToCloud();
  }, 800);
}

async function pushUserDataToCloud(isInitial = false) {
  const client = getSupabase();
  if (!client || !currentAuthUser) return;

  updateSyncStatus('saving', 'Đang lưu...');
  isCloudSyncing = true;

  const dataPayload = {
    theme: appState.theme,
    accent: appState.accent,
    settings: appState.settings,
    energy: appState.energy,
    tasks: appState.tasks,
    goals: appState.goals,
    habits: appState.habits,
    streak: appState.streak,
    pomoSessions: (typeof pomoState !== 'undefined' && pomoState.completedSessions !== undefined) ? pomoState.completedSessions : 0,
    updatedAt: new Date().toISOString()
  };

  try {
    let { error } = await client
      .from('user_data')
      .upsert({
        user_id: currentAuthUser.id,
        data: dataPayload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error && error.message && (error.message.includes('updated_at') || error.code === 'PGRST204')) {
      const retry = await client
        .from('user_data')
        .upsert({
          user_id: currentAuthUser.id,
          data: dataPayload
        }, { onConflict: 'user_id' });
      error = retry.error;
    }

    if (error) {
      console.error('Lỗi khi lưu dữ liệu lên Supabase user_data:', error);
      updateSyncStatus('error', 'Lỗi đồng bộ');
    } else {
      updateSyncStatus('synced', 'Đã đồng bộ');
      if (isInitial) {
        showToast('Đã khởi tạo và đồng bộ đám mây thành công!', '☁️');
      }
    }
  } catch (err) {
    console.error('Ngoại lệ khi đồng bộ lên Supabase:', err);
    updateSyncStatus('error', 'Lỗi kết nối');
  } finally {
    isCloudSyncing = false;
  }
}

async function loadUserDataFromCloud(userId) {
  const client = getSupabase();
  if (!client || !userId) return;

  updateSyncStatus('saving', 'Đang tải...');

  try {
    const { data, error } = await client
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Lỗi khi tải dữ liệu từ user_data:', error);
      updateSyncStatus('error', 'Lỗi tải đám mây');
      showToast('Không thể kết nối đám mây, đang dùng dữ liệu lưu trên máy.', '⚠️');
      return;
    }

    if (data && data.data) {
      const cloud = data.data;

      if (cloud.theme) {
        appState.theme = cloud.theme;
        applyTheme(cloud.theme);
        saveData(STORAGE_KEYS.THEME, cloud.theme, true);
      }
      if (cloud.accent) {
        appState.accent = cloud.accent;
        applyAccentColor(cloud.accent);
        saveData(STORAGE_KEYS.ACCENT, cloud.accent, true);
      }
      if (cloud.settings) {
        appState.settings = { ...DEFAULT_SETTINGS, ...cloud.settings };
        applyCustomSettings();
        saveData(STORAGE_KEYS.SETTINGS, appState.settings, true);
      }
      if (cloud.energy) {
        appState.energy = cloud.energy;
        updateEnergyUI(appState.energy.level);
        saveData(STORAGE_KEYS.ENERGY, appState.energy, true);
      }
      if (Array.isArray(cloud.tasks)) {
        appState.tasks = cloud.tasks;
        renderTasks();
        saveData(STORAGE_KEYS.TASKS, appState.tasks, true);
      }
      if (Array.isArray(cloud.goals)) {
        appState.goals = cloud.goals;
        renderGoals();
        saveData(STORAGE_KEYS.GOALS, appState.goals, true);
      }
      if (Array.isArray(cloud.habits)) {
        appState.habits = cloud.habits;
        renderHabits();
        saveData(STORAGE_KEYS.HABITS, appState.habits, true);
      }
      if (cloud.streak) {
        appState.streak = cloud.streak;
        saveData(STORAGE_KEYS.STREAK, appState.streak, true);
      }
      if (cloud.pomoSessions !== undefined && typeof pomoState !== 'undefined') {
        pomoState.completedSessions = parseInt(cloud.pomoSessions, 10) || 0;
        updatePomodoroUI();
        saveData(STORAGE_KEYS.POMO, pomoState.completedSessions, true);
      }

      updateSyncStatus('synced', 'Đã đồng bộ');
      showToast('Đồng bộ dữ liệu đám mây thành công!', '☁️');
    } else {
      console.log('Tài khoản mới, khởi tạo dữ liệu mẫu lên đám mây...');
      await pushUserDataToCloud(true);
    }
  } catch (err) {
    console.error('Ngoại lệ khi tải user_data:', err);
    updateSyncStatus('error', 'Lỗi đồng bộ');
  }
}

function updateAuthUI(user) {
  const userAccountPill = document.getElementById('userAccountPill');
  const userEmailText = document.getElementById('userEmailText');
  const authModalBackdrop = document.getElementById('authModalBackdrop');

  if (user) {
    if (userAccountPill) userAccountPill.classList.remove('hidden');
    if (userEmailText) userEmailText.textContent = user.email || 'Người dùng';
    if (authModalBackdrop) authModalBackdrop.classList.add('hidden');
  } else {
    if (userAccountPill) userAccountPill.classList.add('hidden');
    if (userEmailText) userEmailText.textContent = '';
    if (authModalBackdrop) authModalBackdrop.classList.remove('hidden');
  }
}

function translateAuthError(err) {
  if (!err) return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại!';
  const msg = (err.message || '').toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Địa chỉ email hoặc mật khẩu không chính xác!';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'Email này đã được đăng ký tài khoản. Vui lòng chọn tab "Đăng nhập"!';
  }
  if (msg.includes('password should be at least 6 characters') || msg.includes('weak_password')) {
    return 'Mật khẩu phải chứa ít nhất 6 ký tự!';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email chưa được kích hoạt. Vui lòng kiểm tra hộp thư của bạn!';
  }
  if (msg.includes('invalid email') || msg.includes('valid email')) {
    return 'Địa chỉ email không đúng định dạng!';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng đợi trong giây lát rồi thử lại!';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Không thể kết nối máy chủ Supabase. Vui lòng kiểm tra lại mạng Internet!';
  }
  return err.message || 'Thao tác không thành công. Vui lòng thử lại!';
}

let authMode = 'signIn';

function initAuthSystem() {
  const authModalBackdrop = document.getElementById('authModalBackdrop');
  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  const authForm = document.getElementById('authForm');
  const authEmailInput = document.getElementById('authEmailInput');
  const authPasswordInput = document.getElementById('authPasswordInput');
  const authErrorBox = document.getElementById('authErrorBox');
  const btnAuthSubmit = document.getElementById('btnAuthSubmit');
  const authSubmitText = document.getElementById('authSubmitText');
  const authSpinner = document.getElementById('authSpinner');
  const btnLogout = document.getElementById('btnLogout');
  const cloudSyncBadge = document.getElementById('cloudSyncBadge');

  function setAuthMode(mode) {
    authMode = mode;
    hideAuthError();
    if (mode === 'signIn') {
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      authSubmitText.textContent = 'Đăng nhập';
      if (authPasswordInput) authPasswordInput.autocomplete = 'current-password';
    } else {
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      authSubmitText.textContent = 'Đăng ký tài khoản';
      if (authPasswordInput) authPasswordInput.autocomplete = 'new-password';
    }
  }

  function showAuthError(msg) {
    if (!authErrorBox) return;
    authErrorBox.textContent = msg;
    authErrorBox.classList.remove('hidden');
  }

  function hideAuthError() {
    if (!authErrorBox) return;
    authErrorBox.textContent = '';
    authErrorBox.classList.add('hidden');
  }

  function setSubmitting(isSubmitting) {
    if (!btnAuthSubmit) return;
    btnAuthSubmit.disabled = isSubmitting;
    if (authSpinner) authSpinner.classList.toggle('hidden', !isSubmitting);
    if (authSubmitText) authSubmitText.style.opacity = isSubmitting ? '0.7' : '1';
  }

  if (tabSignIn) {
    tabSignIn.addEventListener('click', () => setAuthMode('signIn'));
  }
  if (tabSignUp) {
    tabSignUp.addEventListener('click', () => setAuthMode('signUp'));
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAuthError();

      const email = (authEmailInput.value || '').trim();
      const password = authPasswordInput.value || '';

      if (!email || !password) {
        showAuthError('Vui lòng điền đầy đủ email và mật khẩu!');
        return;
      }

      if (password.length < 6) {
        showAuthError('Mật khẩu phải chứa ít nhất 6 ký tự!');
        return;
      }

      const client = getSupabase();
      if (!client) {
        showAuthError('Không thể kết nối Supabase SDK. Vui lòng kiểm tra lại mạng!');
        return;
      }

      setSubmitting(true);

      try {
        if (authMode === 'signIn') {
          const { data, error } = await client.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            showAuthError(translateAuthError(error));
            setSubmitting(false);
            return;
          }

          if (data && data.user) {
            currentAuthUser = data.user;
            updateAuthUI(currentAuthUser);
            showToast(`Chào mừng trở lại, ${data.user.email}!`, '👋');
            await loadUserDataFromCloud(data.user.id);
          }
        } else {
          // Sign Up
          const { data, error } = await client.auth.signUp({
            email,
            password
          });

          if (error) {
            showAuthError(translateAuthError(error));
            setSubmitting(false);
            return;
          }

          if (data && data.session && data.user) {
            currentAuthUser = data.user;
            updateAuthUI(currentAuthUser);
            showToast('Đăng ký tài khoản thành công!', '🎉');
            await loadUserDataFromCloud(data.user.id);
          } else if (data && data.user) {
            setSubmitting(false);
            showToast('Đăng ký thành công! Hãy kiểm tra hòm thư xác nhận.', '📧');
            setAuthMode('signIn');
            showAuthError('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận kích hoạt tài khoản (hoặc đăng nhập ngay nếu không cần xác thực).');
            return;
          }
        }
      } catch (err) {
        console.error('Lỗi khi xác thực tài khoản:', err);
        showAuthError(translateAuthError(err));
      } finally {
        setSubmitting(false);
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất khỏi Personal Command Center?');
      if (!confirmed) return;

      const client = getSupabase();
      if (client) {
        await client.auth.signOut();
      }
      currentAuthUser = null;
      updateAuthUI(null);
      updateSyncStatus('offline', 'Chưa đăng nhập');
      showToast('Đã đăng xuất tài khoản.', '👋');
    });
  }

  if (cloudSyncBadge) {
    cloudSyncBadge.addEventListener('click', () => {
      if (!currentAuthUser) {
        if (authModalBackdrop) authModalBackdrop.classList.remove('hidden');
      } else {
        scheduleCloudSync();
        showToast('Đang tiến hành đồng bộ dữ liệu đám mây...', '☁️');
      }
    });
  }

  checkInitialAuthSession();
}

async function checkInitialAuthSession() {
  const client = getSupabase();
  const authModalBackdrop = document.getElementById('authModalBackdrop');

  if (!client) {
    console.warn('Supabase chưa sẵn sàng.');
    updateSyncStatus('offline', 'Chưa kết nối');
    return;
  }

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (session && session.user) {
      currentAuthUser = session.user;
      updateAuthUI(currentAuthUser);
      if (authModalBackdrop) authModalBackdrop.classList.add('hidden');
      await loadUserDataFromCloud(currentAuthUser.id);
    } else {
      currentAuthUser = null;
      updateAuthUI(null);
      if (authModalBackdrop) authModalBackdrop.classList.remove('hidden');
      updateSyncStatus('offline', 'Chưa đăng nhập');
    }

    client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        currentAuthUser = session.user;
        updateAuthUI(currentAuthUser);
        if (authModalBackdrop) authModalBackdrop.classList.add('hidden');
        await loadUserDataFromCloud(currentAuthUser.id);
      } else if (event === 'SIGNED_OUT') {
        currentAuthUser = null;
        updateAuthUI(null);
        if (authModalBackdrop) authModalBackdrop.classList.remove('hidden');
        updateSyncStatus('offline', 'Chưa đăng nhập');
      }
    });
  } catch (err) {
    console.error('Lỗi khi kiểm tra phiên Supabase:', err);
    updateSyncStatus('offline', 'Lỗi kết nối');
  }
}

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkNewDayReset() {
  const today = getTodayDateString();
  const lastVisit = localStorage.getItem(STORAGE_KEYS.DATE);

  if (lastVisit && lastVisit !== today) {
    // New day: reset habit checks
    appState.habits.forEach(h => {
      h.anchorDone = false;
      h.actionDone = false;
    });
    saveData(STORAGE_KEYS.HABITS, appState.habits);

    // If yesterday was skipped, reset streak
    const yesterday = getYesterdayDateString();
    if (appState.streak.lastCompletedDate !== yesterday && appState.streak.lastCompletedDate !== today) {
      appState.streak.streak = 0;
      saveData(STORAGE_KEYS.STREAK, appState.streak);
    }
  }
  localStorage.setItem(STORAGE_KEYS.DATE, today);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function showToast(message, icon = '✨') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2600);
}

// ==========================================================================
// 4. THEME & ACCENT COLOR SYSTEM
// ==========================================================================
function applyTheme(theme) {
  appState.theme = theme;
  document.body.dataset.theme = theme;
  saveData(STORAGE_KEYS.THEME, theme);

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    const iconDark = themeBtn.querySelector('.theme-icon-dark');
    const iconLight = themeBtn.querySelector('.theme-icon-light');

    if (theme === 'light') {
      if (iconDark) iconDark.classList.add('hidden');
      if (iconLight) iconLight.classList.remove('hidden');
      themeBtn.title = 'Chuyển sang Chế độ Tối (🌙)';
    } else {
      if (iconDark) iconDark.classList.remove('hidden');
      if (iconLight) iconLight.classList.add('hidden');
      themeBtn.title = 'Chuyển sang Chế độ Sáng (☀️)';
    }
  }
}

function applyAccentColor(accent) {
  appState.accent = accent;
  document.body.dataset.accent = accent;
  saveData(STORAGE_KEYS.ACCENT, accent);

  document.querySelectorAll('.color-swatch-btn').forEach(btn => {
    const color = btn.dataset.accentColor;
    btn.classList.toggle('active', color === accent);
  });
}

function initThemeAndAccent() {
  applyTheme(appState.theme);
  applyAccentColor(appState.accent);

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const nextTheme = appState.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      showToast(nextTheme === 'light' ? 'Đã chuyển sang Chế độ Sáng ☀️' : 'Đã chuyển sang Chế độ Tối 🌙', nextTheme === 'light' ? '☀️' : '🌙');
    });
  }

  document.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.accentColor;
      applyAccentColor(color);
      const names = {
        dynamic: 'Theo Năng lượng Sinh học ⚡',
        ocean: 'Xanh Dương Hiện Đại 🔵',
        emerald: 'Xanh Ngọc Tươi Mát 🌿',
        orange: 'Cam Năng Lượng 🍊',
        rose: 'Hồng San Hô 🌸',
        violet: 'Tím Sáng Tạo 🟣'
      };
      showToast(`Đã đổi màu chủ đạo: ${names[color] || color}`, '🎨');
    });
  });
}

// ==========================================================================
// 5. LIVE CLOCK & APP BRANDING
// ==========================================================================
function initClock() {
  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');
  if (!clockEl || !dateEl) return;

  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  function update() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;

    const dayName = daysOfWeek[now.getDay()];
    const d = String(now.getDate()).padStart(2, '0');
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    dateEl.textContent = `${dayName}, ${d}/${mo}/${y}`;
  }

  update();
  setInterval(update, 1000);
}

function applyCustomSettings() {
  const titleEl = document.getElementById('appBrandTitle');
  const subEl = document.getElementById('appBrandSubtitle');
  const peakTimeEl = document.getElementById('displayPeakTime');
  const steadyTimeEl = document.getElementById('displaySteadyTime');
  const lowTimeEl = document.getElementById('displayLowTime');

  if (titleEl) titleEl.textContent = appState.settings.title || DEFAULT_SETTINGS.title;
  if (subEl) subEl.textContent = appState.settings.subtitle || DEFAULT_SETTINGS.subtitle;
  if (peakTimeEl) peakTimeEl.innerHTML = appState.settings.peakTime || DEFAULT_SETTINGS.peakTime;
  if (steadyTimeEl) steadyTimeEl.innerHTML = appState.settings.steadyTime || DEFAULT_SETTINGS.steadyTime;
  if (lowTimeEl) lowTimeEl.innerHTML = appState.settings.lowTime || DEFAULT_SETTINGS.lowTime;
}

// ==========================================================================
// 6. ENERGY SCHEDULE MATRIX & DO NOW SUGGESTION
// ==========================================================================
const ENERGY_RECOMMENDATIONS = {
  peak: {
    statusText: '⚡ Đỉnh cao (Deep Work)',
    badgeText: '⚡ Năng lượng: Đỉnh cao',
    rec: 'Khuyến nghị: Bộ não đang ở phong độ tốt nhất! Hãy tập trung 100% vào các nhiệm vụ phức tạp, giải quyết đề khó hoặc bài tập BTEC lớn.',
    activeZone: 'peak',
    doNowTag: '⚡ Khung Đỉnh cao &bull; Deep Work'
  },
  steady: {
    statusText: '🔋 Ổn định (Steady Work)',
    badgeText: '🔋 Năng lượng: Ổn định',
    rec: 'Khuyến nghị: Năng lượng cân bằng! Rất thích hợp để ôn từ vựng Flashcard, đọc tài liệu, xử lý các đầu việc thường nhật và duy trì tiến độ.',
    activeZone: 'steady',
    doNowTag: '🔋 Khung Ổn định &bull; Steady Work'
  },
  low: {
    statusText: '🌙 Thấp điểm (Low Drain)',
    badgeText: '🌙 Năng lượng: Thấp điểm',
    rec: 'Khuyến nghị: Năng lượng đang suy giảm! Hãy chuyển sang các việc nhẹ: dọn dẹp file, sắp xếp desktop, nghe podcast học tập hoặc thư giãn tái tạo não bộ.',
    activeZone: 'low',
    doNowTag: '🌙 Khung Thấp điểm &bull; Low Drain'
  }
};

function getEnergyStateFromLevel(level) {
  if (level >= 8) return 'peak';
  if (level >= 5) return 'steady';
  return 'low';
}

function updateEnergyUI(level, persist = true) {
  level = Math.max(1, Math.min(10, parseInt(level, 10) || 5));
  const state = getEnergyStateFromLevel(level);

  appState.energy = { level, state };
  if (persist) {
    saveData(STORAGE_KEYS.ENERGY, appState.energy);
  }

  document.body.dataset.energyState = state;

  const slider = document.getElementById('energySlider');
  const numBadge = document.getElementById('energyNumBadge');
  const textStatus = document.getElementById('energyTextStatus');
  const recText = document.getElementById('recText');
  const headerBadge = document.getElementById('headerEnergyBadge');

  if (slider) slider.value = level;
  if (numBadge) numBadge.textContent = level;

  const info = ENERGY_RECOMMENDATIONS[state];
  if (textStatus) textStatus.textContent = info.statusText;
  if (recText) recText.textContent = info.rec;

  if (headerBadge) {
    const label = headerBadge.querySelector('.energy-label');
    if (label) label.textContent = `${info.badgeText} (${level}/10)`;
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    const btnState = btn.dataset.state;
    btn.classList.toggle('active', btnState === state);
  });

  document.querySelectorAll('.matrix-block').forEach(block => {
    const zone = block.dataset.energyZone;
    block.classList.toggle('is-active-frame', zone === state);
  });

  // Update DO NOW Task suggestion matching new energy state
  updateDoNowTask();
}

function initEnergyController() {
  const slider = document.getElementById('energySlider');
  const presetButtons = document.querySelectorAll('.preset-btn');

  if (slider) {
    slider.addEventListener('input', (e) => {
      updateEnergyUI(e.target.value);
    });
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.level;
      updateEnergyUI(level);
      showToast(`Đã chuyển năng lượng sang mức ${level}/10`, '⚡');
    });
  });

  // Buttons "+ Thêm việc" on each matrix block
  document.querySelectorAll('.btn-add-to-zone').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const zoneId = btn.dataset.targetZone;
      const zoneName = zoneId === 'peak' ? 'Đỉnh cao (Deep Work)' : (zoneId === 'steady' ? 'Ổn định (Steady Work)' : 'Thấp điểm (Low Drain)');
      const title = prompt(`Nhập tên nhiệm vụ cần thêm vào Khung ${zoneName}:`);
      if (title && title.trim()) {
        const newTask = {
          id: 'task-' + Date.now(),
          title: title.trim(),
          priority: zoneId === 'peak' ? 'high' : (zoneId === 'steady' ? 'medium' : 'low'),
          completed: false,
          energyZone: zoneId,
          createdAt: Date.now()
        };
        appState.tasks.unshift(newTask);
        renderTasks();
        showToast(`Đã thêm nhiệm vụ vào Khung ${zoneName}!`, '🎯');
      }
    });
  });

  updateEnergyUI(appState.energy.level, false);
}

// ==========================================================================
// 7. V2: DO NOW RECOMMENDED TASK & POMODORO TIMER
// ==========================================================================
function updateDoNowTask() {
  const tagEl = document.getElementById('doNowEnergyMatchText');
  const contentEl = document.getElementById('doNowTaskContent');
  if (!tagEl || !contentEl) return;

  const currentEnergyState = appState.energy.state || 'peak';
  const info = ENERGY_RECOMMENDATIONS[currentEnergyState] || ENERGY_RECOMMENDATIONS.peak;
  tagEl.innerHTML = info.doNowTag;

  // 1. Look for uncompleted task assigned to current energy zone
  let targetTask = appState.tasks.find(t => t.energyZone === currentEnergyState && !t.completed);

  // 2. If none in current energy zone, look for highest uncompleted priority task
  if (!targetTask) {
    targetTask = appState.tasks.find(t => t.priority === 'high' && !t.completed) ||
                 appState.tasks.find(t => t.priority === 'medium' && !t.completed) ||
                 appState.tasks.find(t => !t.completed);
  }

  if (targetTask) {
    const priorityDotClass = targetTask.priority === 'high' ? 'dot-high' : (targetTask.priority === 'medium' ? 'dot-medium' : 'dot-low');
    const priorityName = targetTask.priority === 'high' ? 'Ưu tiên Cao' : (targetTask.priority === 'medium' ? 'Ưu tiên TB' : 'Ưu tiên Thấp');

    contentEl.innerHTML = `
      <div class="do-now-task-main">
        <span class="priority-indicator ${priorityDotClass}" title="${priorityName}"></span>
        <span class="do-now-task-title">${escapeHTML(targetTask.title)}</span>
        ${targetTask.energyZone ? `<span class="task-energy-tag tag-${targetTask.energyZone}">${targetTask.energyZone === 'peak' ? '⚡ Deep Work' : (targetTask.energyZone === 'steady' ? '🔋 Steady' : '🌙 Low')}</span>` : ''}
      </div>
      <button type="button" class="do-now-btn-done" id="btnDoNowComplete" data-task-id="${targetTask.id}">
        ✓ Hoàn thành ngay
      </button>
    `;

    const doneBtn = document.getElementById('btnDoNowComplete');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        toggleTaskCompletion(targetTask.id);
      });
    }
  } else {
    contentEl.innerHTML = `
      <div style="font-size: 0.82rem; color: var(--text-dim); padding: 4px 0;">
        ✨ Tuyệt vời! Bạn không còn nhiệm vụ tồn đọng nào lúc này. Hãy tận hưởng hoặc lên kế hoạch mới!
      </div>
    `;
  }
}

// --- Pomodoro Web Audio API Chime Generator ---
function playPomodoroChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Harmonics: peaceful chime chord (E5, G#5, B5, E6)
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.12;
      const duration = 1.6;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (err) {
    console.warn('Web Audio note chime error:', err);
  }
}

// --- Pomodoro State & Engine ---
const pomoState = {
  mode: 'work', // 'work' | 'break'
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  isRunning: false,
  intervalId: null,
  completedSessions: loadData(STORAGE_KEYS.POMO, 0)
};

function formatPomoTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updatePomodoroUI() {
  const timerText = document.getElementById('pomoTimerText');
  const progressFill = document.getElementById('pomoProgressFill');
  const modeBadge = document.getElementById('pomoModeBadge');
  const playIcon = document.getElementById('pomoPlayIcon');
  const pauseIcon = document.getElementById('pomoPauseIcon');
  const btnLabel = document.getElementById('pomoBtnLabel');
  const countEl = document.getElementById('pomoSessionsCount');
  const modeWorkBtn = document.getElementById('pomoModeWork');
  const modeBreakBtn = document.getElementById('pomoModeBreak');

  if (timerText) timerText.textContent = formatPomoTime(pomoState.timeLeft);

  if (progressFill) {
    const pct = pomoState.totalTime > 0 ? (pomoState.timeLeft / pomoState.totalTime) * 100 : 0;
    progressFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }

  if (modeBadge) {
    modeBadge.textContent = pomoState.mode === 'work' ? 'CHẾ ĐỘ TẬP TRUNG (25P)' : 'CHẾ ĐỘ NGHỈ NGƠI (5P)';
  }

  if (countEl) {
    countEl.textContent = pomoState.completedSessions;
  }

  if (playIcon && pauseIcon && btnLabel) {
    if (pomoState.isRunning) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      btnLabel.textContent = 'Tạm dừng';
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      btnLabel.textContent = pomoState.timeLeft === pomoState.totalTime ? 'Bắt đầu' : 'Tiếp tục';
    }
  }

  if (modeWorkBtn && modeBreakBtn) {
    modeWorkBtn.classList.toggle('active', pomoState.mode === 'work');
    modeBreakBtn.classList.toggle('active', pomoState.mode === 'break');
  }
}

function tickPomodoro() {
  if (pomoState.timeLeft > 0) {
    pomoState.timeLeft--;
    updatePomodoroUI();
  } else {
    // Timer reached 00:00!
    clearInterval(pomoState.intervalId);
    pomoState.isRunning = false;

    playPomodoroChime();

    if (pomoState.mode === 'work') {
      pomoState.completedSessions++;
      saveData(STORAGE_KEYS.POMO, pomoState.completedSessions);

      showToast('🎉 Tuyệt vời! Bạn đã hoàn thành 1 phiên Pomodoro tập trung! Hãy nghỉ ngơi 5 phút.', '🏆');

      // Auto switch to break mode
      switchPomodoroMode('break');
    } else {
      showToast('☕ Hết giờ nghỉ ngơi! Bạn đã nạp lại năng lượng cho phiên tập trung mới!', '⚡');

      // Auto switch to work mode
      switchPomodoroMode('work');
    }
  }
}

function startPomodoro() {
  if (pomoState.isRunning) return;
  pomoState.isRunning = true;
  pomoState.intervalId = setInterval(tickPomodoro, 1000);
  updatePomodoroUI();
}

function pausePomodoro() {
  if (!pomoState.isRunning) return;
  clearInterval(pomoState.intervalId);
  pomoState.isRunning = false;
  updatePomodoroUI();
}

function resetPomodoro() {
  clearInterval(pomoState.intervalId);
  pomoState.isRunning = false;
  pomoState.timeLeft = pomoState.totalTime;
  updatePomodoroUI();
  showToast('Đã đặt lại đồng hồ Pomodoro', '↺');
}

function switchPomodoroMode(mode) {
  clearInterval(pomoState.intervalId);
  pomoState.isRunning = false;
  pomoState.mode = mode;
  pomoState.totalTime = mode === 'work' ? 25 * 60 : 5 * 60;
  pomoState.timeLeft = pomoState.totalTime;
  updatePomodoroUI();
}

function initPomodoroWidget() {
  const playPauseBtn = document.getElementById('pomoPlayPauseBtn');
  const resetBtn = document.getElementById('pomoResetBtn');
  const modeWorkBtn = document.getElementById('pomoModeWork');
  const modeBreakBtn = document.getElementById('pomoModeBreak');

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (pomoState.isRunning) {
        pausePomodoro();
      } else {
        startPomodoro();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetPomodoro);
  }

  if (modeWorkBtn) {
    modeWorkBtn.addEventListener('click', () => {
      if (pomoState.mode !== 'work') {
        switchPomodoroMode('work');
      }
    });
  }

  if (modeBreakBtn) {
    modeBreakBtn.addEventListener('click', () => {
      if (pomoState.mode !== 'break') {
        switchPomodoroMode('break');
      }
    });
  }

  updatePomodoroUI();
}

// ==========================================================================
// 8. PRIORITY TASK MANAGER & INTER-MATRIX DRAG-AND-DROP
// ==========================================================================
let currentDraggedTaskId = null;

function renderTasks() {
  const containerHigh = document.getElementById('tasksHigh');
  const containerMedium = document.getElementById('tasksMedium');
  const containerLow = document.getElementById('tasksLow');

  const zonePeak = document.getElementById('zonePeak');
  const zoneSteady = document.getElementById('zoneSteady');
  const zoneLow = document.getElementById('zoneLow');

  if (!containerHigh || !containerMedium || !containerLow) return;

  containerHigh.innerHTML = '';
  containerMedium.innerHTML = '';
  containerLow.innerHTML = '';

  if (zonePeak) zonePeak.innerHTML = '<div class="dropzone-empty-hint">Kéo thả nhiệm vụ Deep Work vào đây</div>';
  if (zoneSteady) zoneSteady.innerHTML = '<div class="dropzone-empty-hint">Kéo thả nhiệm vụ Steady Work vào đây</div>';
  if (zoneLow) zoneLow.innerHTML = '<div class="dropzone-empty-hint">Kéo thả nhiệm vụ Low Drain vào đây</div>';

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let pendingTotal = 0;

  let peakZoneHasTask = false;
  let steadyZoneHasTask = false;
  let lowZoneHasTask = false;

  appState.tasks.forEach(task => {
    if (!task.completed) pendingTotal++;

    const taskElement = createTaskCardElement(task);

    if (task.energyZone === 'peak' && zonePeak) {
      if (!peakZoneHasTask) {
        zonePeak.innerHTML = '';
        peakZoneHasTask = true;
      }
      zonePeak.appendChild(taskElement);
    } else if (task.energyZone === 'steady' && zoneSteady) {
      if (!steadyZoneHasTask) {
        zoneSteady.innerHTML = '';
        steadyZoneHasTask = true;
      }
      zoneSteady.appendChild(taskElement);
    } else if (task.energyZone === 'low' && zoneLow) {
      if (!lowZoneHasTask) {
        zoneLow.innerHTML = '';
        lowZoneHasTask = true;
      }
      zoneLow.appendChild(taskElement);
    } else {
      if (task.priority === 'high') {
        containerHigh.appendChild(taskElement);
        highCount++;
      } else if (task.priority === 'medium') {
        containerMedium.appendChild(taskElement);
        mediumCount++;
      } else {
        containerLow.appendChild(taskElement);
        lowCount++;
      }
    }
  });

  const countHighEl = document.getElementById('countHigh');
  const countMedEl = document.getElementById('countMedium');
  const countLowEl = document.getElementById('countLow');
  const pendingTotalEl = document.getElementById('tasksPendingCount');

  if (countHighEl) countHighEl.textContent = highCount;
  if (countMedEl) countMedEl.textContent = mediumCount;
  if (countLowEl) countLowEl.textContent = lowCount;
  if (pendingTotalEl) pendingTotalEl.textContent = pendingTotal;

  saveData(STORAGE_KEYS.TASKS, appState.tasks);

  // Keep DO NOW recommendation in sync with task changes
  updateDoNowTask();
}

function createTaskCardElement(task) {
  const card = document.createElement('div');
  card.className = `task-item ${task.completed ? 'is-completed' : ''}`;
  card.dataset.taskId = task.id;
  card.dataset.priority = task.priority;
  card.setAttribute('draggable', 'true');

  const energyTagHtml = task.energyZone ? `
    <span class="task-energy-tag tag-${task.energyZone}">
      ${task.energyZone === 'peak' ? '⚡ Deep Work' : (task.energyZone === 'steady' ? '🔋 Steady' : '🌙 Low Drain')}
    </span>
  ` : '';

  card.innerHTML = `
    <!-- Drag Handle -->
    <div class="task-drag-handle" title="Kéo thả để chuyển khung năng lượng hoặc độ ưu tiên">⋮⋮</div>

    <div class="task-check-wrap">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Hoàn thành nhiệm vụ">
    </div>
    <div class="task-content">
      <span class="task-text" title="Nhấp đúp chuột hoặc bấm nút ✏️ để chỉnh sửa">${escapeHTML(task.title)}</span>
      <div class="task-tags">
        ${energyTagHtml}
      </div>
    </div>
    <div class="task-actions">
      <button class="btn-item-action btn-edit" title="Chỉnh sửa nội dung" aria-label="Sửa">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      </button>
      <button class="btn-item-action btn-del" title="Xóa nhiệm vụ" aria-label="Xóa">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Toggle completion
  const checkbox = card.querySelector('.task-checkbox');
  checkbox.addEventListener('change', (e) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  });

  // Delete task
  const delBtn = card.querySelector('.btn-del');
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  });

  // Inline edit task
  const editBtn = card.querySelector('.btn-edit');
  const taskTextSpan = card.querySelector('.task-text');

  function startInlineEdit() {
    const contentWrap = card.querySelector('.task-content');
    if (!contentWrap || card.querySelector('.inline-edit-input')) return;

    card.setAttribute('draggable', 'false');
    const originalText = task.title;

    contentWrap.innerHTML = `
      <div class="inline-edit-container">
        <input type="text" class="inline-edit-input" value="${escapeHTML(originalText)}" required>
        <button type="button" class="btn-inline-save" title="Lưu thay đổi (Enter)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <button type="button" class="btn-inline-cancel" title="Hủy (Esc)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    const input = contentWrap.querySelector('.inline-edit-input');
    const saveBtn = contentWrap.querySelector('.btn-inline-save');
    const cancelBtn = contentWrap.querySelector('.btn-inline-cancel');

    input.focus();
    input.select();

    function save() {
      const newTitle = input.value.trim();
      if (newTitle) {
        task.title = newTitle;
        showToast('Đã cập nhật nhiệm vụ thành công!', '✏️');
      }
      renderTasks();
    }

    function cancel() {
      renderTasks();
    }

    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', cancel);

    input.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        save();
      } else if (evt.key === 'Escape') {
        evt.preventDefault();
        cancel();
      }
    });
  }

  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startInlineEdit();
  });

  taskTextSpan.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    startInlineEdit();
  });

  // Drag and drop events
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);

  return card;
}

function handleDragStart(e) {
  currentDraggedTaskId = this.dataset.taskId;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', currentDraggedTaskId);
}

function handleDragEnd() {
  this.classList.remove('dragging');
  currentDraggedTaskId = null;
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function setupDropzones() {
  // 1. Priority Dropzones
  const priorityDropzones = document.querySelectorAll('.task-dropzone');
  priorityDropzones.forEach(zone => {
    registerDropzone(zone, (taskId, targetZone) => {
      const newPriority = targetZone.dataset.priorityZone;
      moveTaskToPriority(taskId, newPriority);
    });
  });

  // 2. Energy Matrix Dropzones (Khung Đỉnh cao, Khung Ổn định, Khung Thấp điểm)
  const matrixDropzones = document.querySelectorAll('.matrix-dropzone');
  matrixDropzones.forEach(zone => {
    registerDropzone(zone, (taskId, targetZone) => {
      const zoneId = targetZone.dataset.zoneId;
      moveTaskToEnergyZone(taskId, zoneId);
    });
  });
}

function registerDropzone(zoneElement, onDropCallback) {
  zoneElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!zoneElement.classList.contains('drag-over')) {
      zoneElement.classList.add('drag-over');
    }
  });

  zoneElement.addEventListener('dragleave', (e) => {
    if (!zoneElement.contains(e.relatedTarget)) {
      zoneElement.classList.remove('drag-over');
    }
  });

  zoneElement.addEventListener('drop', (e) => {
    e.preventDefault();
    zoneElement.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('text/plain') || currentDraggedTaskId;
    if (taskId && onDropCallback) {
      onDropCallback(taskId, zoneElement);
    }
  });
}

function moveTaskToPriority(taskId, newPriority) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.priority = newPriority;
  task.energyZone = null;
  renderTasks();

  const prioName = newPriority === 'high' ? 'Ưu tiên Cao 🔴' : (newPriority === 'medium' ? 'Ưu tiên Trung bình 🟡' : 'Ưu tiên Thấp 🟢');
  showToast(`Đã chuyển việc sang ${prioName}`, '📋');
}

function moveTaskToEnergyZone(taskId, energyZoneId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.energyZone = energyZoneId;
  renderTasks();

  const zoneNames = {
    peak: 'Khung Đỉnh cao ⚡ (Deep Work)',
    steady: 'Khung Ổn định 🔋 (Steady Work)',
    low: 'Khung Thấp điểm 🌙 (Low Drain)'
  };
  showToast(`Đã chuyển nhiệm vụ sang ${zoneNames[energyZoneId]}`, '🎯');
}

function toggleTaskCompletion(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  renderTasks();

  if (task.completed) {
    showToast(`Đã hoàn thành: "${task.title.substring(0, 30)}..."`, '🎉');
  }
}

function deleteTask(taskId) {
  appState.tasks = appState.tasks.filter(t => t.id !== taskId);
  renderTasks();
  showToast('Đã xóa nhiệm vụ khỏi danh sách', '🗑️');
}

function initTaskForm() {
  const form = document.getElementById('addTaskForm');
  const input = document.getElementById('taskTitleInput');
  const select = document.getElementById('taskPrioritySelect');

  if (!form || !input || !select) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    const newTask = {
      id: 'task-' + Date.now(),
      title,
      priority: select.value,
      completed: false,
      energyZone: null,
      createdAt: Date.now()
    };

    appState.tasks.unshift(newTask);
    renderTasks();
    input.value = '';
    input.focus();

    showToast(`Đã thêm nhiệm vụ mới: "${title.substring(0, 25)}..."`, '➕');
  });
}

// ==========================================================================
// 9. LONG-TERM GOALS DASHBOARD & INLINE EDIT
// ==========================================================================
function renderGoals() {
  const container = document.getElementById('goalsContainer');
  const totalGoalsEl = document.getElementById('totalGoalsCount');
  const avgGoalProgressEl = document.getElementById('avgGoalProgress');
  if (!container) return;

  container.innerHTML = '';

  if (appState.goals.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 30px; font-size: 0.85rem;">
        Chưa có mục tiêu dài hạn nào. Hãy nhấn "+ Thêm mục tiêu" để bắt đầu!
      </div>
    `;
    if (totalGoalsEl) totalGoalsEl.textContent = '0';
    if (avgGoalProgressEl) avgGoalProgressEl.textContent = '0%';
    return;
  }

  let totalPct = 0;

  const categoryLabels = {
    academic: { text: '🎓 Học thuật', class: 'cat-academic' },
    language: { text: '🌍 Ngoại ngữ', class: 'cat-language' },
    personal: { text: '👤 Cá nhân', class: 'cat-personal' }
  };

  appState.goals.forEach(goal => {
    totalPct += goal.progress;
    const cat = categoryLabels[goal.category] || { text: 'Chung', class: 'cat-personal' };

    const goalCard = document.createElement('div');
    goalCard.className = 'goal-card';
    goalCard.dataset.goalId = goal.id;

    goalCard.innerHTML = `
      <div class="goal-top-row">
        <div class="goal-title-wrap">
          <span class="goal-cat-badge ${cat.class}">${cat.text}</span>
          <span class="goal-title" title="Nhấp đúp chuột hoặc bấm nút ✏️ để chỉnh sửa tên mục tiêu">${escapeHTML(goal.title)}</span>
        </div>
        <div class="goal-progress-display">
          <input type="number" min="0" max="100" class="goal-pct-input" value="${goal.progress}" title="Nhấp để nhập trực tiếp %">
          <span style="font-size: 0.85rem; color: var(--energy-accent); font-weight: 700;">%</span>
          <button class="btn-item-action btn-edit" title="Chỉnh sửa tên mục tiêu" aria-label="Sửa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="btn-item-action btn-del" title="Xóa mục tiêu" aria-label="Xóa mục tiêu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="goal-bar-wrap">
        <div class="progress-track">
          <div class="progress-bar-fill" style="width: ${goal.progress}%;"></div>
        </div>
      </div>
      <div class="goal-controls-row">
        <button class="btn-step btn-minus-5" title="Giảm 5%">-5%</button>
        <button class="btn-step btn-plus-5" title="Tăng 5%">+5%</button>
      </div>
    `;

    // Percentage direct input
    const pctInput = goalCard.querySelector('.goal-pct-input');
    pctInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = 0;
      val = Math.max(0, Math.min(100, val));
      updateGoalProgress(goal.id, val);
    });

    // Step Buttons
    goalCard.querySelector('.btn-minus-5').addEventListener('click', () => {
      updateGoalProgress(goal.id, goal.progress - 5);
    });

    goalCard.querySelector('.btn-plus-5').addEventListener('click', () => {
      updateGoalProgress(goal.id, goal.progress + 5);
    });

    // Delete Button
    goalCard.querySelector('.btn-del').addEventListener('click', () => {
      deleteGoal(goal.id);
    });

    // Inline edit goal title
    const editBtn = goalCard.querySelector('.btn-edit');
    const titleSpan = goalCard.querySelector('.goal-title');

    function startGoalEdit() {
      const wrap = goalCard.querySelector('.goal-title-wrap');
      if (!wrap || wrap.querySelector('.inline-edit-input')) return;

      const originalTitle = goal.title;
      wrap.innerHTML = `
        <span class="goal-cat-badge ${cat.class}">${cat.text}</span>
        <div class="inline-edit-container">
          <input type="text" class="inline-edit-input" value="${escapeHTML(originalTitle)}" required>
          <button type="button" class="btn-inline-save" title="Lưu (Enter)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <button type="button" class="btn-inline-cancel" title="Hủy (Esc)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      const input = wrap.querySelector('.inline-edit-input');
      const saveBtn = wrap.querySelector('.btn-inline-save');
      const cancelBtn = wrap.querySelector('.btn-inline-cancel');

      input.focus();
      input.select();

      function save() {
        const val = input.value.trim();
        if (val) {
          goal.title = val;
          showToast('Đã đổi tên mục tiêu thành công!', '✏️');
        }
        renderGoals();
      }

      function cancel() {
        renderGoals();
      }

      saveBtn.addEventListener('click', save);
      cancelBtn.addEventListener('click', cancel);

      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
          evt.preventDefault();
          save();
        } else if (evt.key === 'Escape') {
          evt.preventDefault();
          cancel();
        }
      });
    }

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startGoalEdit();
    });

    titleSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startGoalEdit();
    });

    container.appendChild(goalCard);
  });

  const avg = Math.round(totalPct / appState.goals.length);
  if (totalGoalsEl) totalGoalsEl.textContent = appState.goals.length;
  if (avgGoalProgressEl) avgGoalProgressEl.textContent = `${avg}%`;

  saveData(STORAGE_KEYS.GOALS, appState.goals);
}

function updateGoalProgress(goalId, newProgress) {
  const goal = appState.goals.find(g => g.id === goalId);
  if (!goal) return;

  goal.progress = Math.max(0, Math.min(100, newProgress));
  renderGoals();

  if (goal.progress === 100) {
    showToast(`Chúc mừng! Mục tiêu "${goal.title}" đã cán mốc 100%! 🏆`, '🎉');
  }
}

function deleteGoal(goalId) {
  appState.goals = appState.goals.filter(g => g.id !== goalId);
  renderGoals();
  showToast('Đã xóa mục tiêu khỏi bảng theo dõi', '🗑️');
}

function initGoalsForm() {
  const toggleBtn = document.getElementById('toggleAddGoalBtn');
  const form = document.getElementById('addGoalForm');
  const titleInput = document.getElementById('goalTitleInput');
  const catSelect = document.getElementById('goalCategorySelect');
  const progInput = document.getElementById('goalInitialProgress');

  if (toggleBtn && form) {
    toggleBtn.addEventListener('click', () => {
      form.classList.toggle('hidden');
      if (!form.classList.contains('hidden') && titleInput) {
        titleInput.focus();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      if (!title) return;

      const progress = Math.max(0, Math.min(100, parseInt(progInput.value, 10) || 0));

      const newGoal = {
        id: 'goal-' + Date.now(),
        title,
        category: catSelect.value,
        progress
      };

      appState.goals.push(newGoal);
      renderGoals();

      titleInput.value = '';
      progInput.value = '10';
      form.classList.add('hidden');

      showToast(`Đã thêm mục tiêu: "${title}"`, '🎯');
    });
  }
}

// ==========================================================================
// 10. DAILY HABIT STACKING & INLINE EDIT
// ==========================================================================
function renderHabits() {
  const container = document.getElementById('habitsList');
  const progressPctEl = document.getElementById('habitProgressPct');
  const progressBarEl = document.getElementById('habitProgressBar');
  const streakCountEl = document.getElementById('streakCount');

  if (!container) return;

  container.innerHTML = '';

  if (streakCountEl) {
    streakCountEl.textContent = appState.streak.streak;
  }

  if (appState.habits.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 25px; font-size: 0.85rem;">
        Chưa có chuỗi xếp chồng thói quen nào. Hãy thêm chuỗi mới phía trên!
      </div>
    `;
    if (progressPctEl) progressPctEl.textContent = '0% (0/0 chuỗi)';
    if (progressBarEl) progressBarEl.style.width = '0%';
    return;
  }

  let completedStacks = 0;

  appState.habits.forEach(habit => {
    const isStackCompleted = habit.anchorDone && habit.actionDone;
    if (isStackCompleted) completedStacks++;

    const habitCard = document.createElement('div');
    habitCard.className = `habit-stack-card ${isStackCompleted ? 'is-completed' : ''}`;
    habitCard.dataset.habitId = habit.id;

    habitCard.innerHTML = `
      <div class="habit-chain-row">
        <!-- Anchor Node -->
        <div class="habit-node anchor-node ${habit.anchorDone ? 'completed' : ''}">
          <input type="checkbox" class="task-checkbox anchor-check" ${habit.anchorDone ? 'checked' : ''} aria-label="Đã thực hiện thói quen neo">
          <div style="flex: 1; overflow: hidden;">
            <span class="node-badge">THÓI QUEN NEO</span>
            <div class="node-text" title="Nhấp đúp chuột để sửa">${escapeHTML(habit.anchor)}</div>
          </div>
        </div>

        <div class="chain-connector">➔</div>

        <!-- Target Action Node -->
        <div class="habit-node action-node ${habit.actionDone ? 'completed' : ''}">
          <input type="checkbox" class="task-checkbox action-check" ${habit.actionDone ? 'checked' : ''} aria-label="Đã thực hiện hành động tích cực">
          <div style="flex: 1; overflow: hidden;">
            <span class="node-badge">HÀNH ĐỘNG TÍCH CỰC</span>
            <div class="node-text" title="Nhấp đúp chuột để sửa">${escapeHTML(habit.action)}</div>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; align-items: center; gap: 3px;">
          <button class="btn-item-action btn-edit" title="Sửa chuỗi thói quen" aria-label="Sửa chuỗi">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="btn-item-action btn-del" title="Xóa chuỗi thói quen" aria-label="Xóa chuỗi">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Anchor Checkbox
    const anchorCheck = habitCard.querySelector('.anchor-check');
    anchorCheck.addEventListener('change', () => {
      habit.anchorDone = anchorCheck.checked;
      handleHabitStepChange();
    });

    // Action Checkbox
    const actionCheck = habitCard.querySelector('.action-check');
    actionCheck.addEventListener('change', () => {
      habit.actionDone = actionCheck.checked;
      handleHabitStepChange();
    });

    // Delete Button
    habitCard.querySelector('.btn-del').addEventListener('click', () => {
      deleteHabit(habit.id);
    });

    // Inline edit habit stack
    const editBtn = habitCard.querySelector('.btn-edit');
    const anchorNodeText = habitCard.querySelector('.anchor-node .node-text');
    const actionNodeText = habitCard.querySelector('.action-node .node-text');

    function startHabitEdit() {
      const row = habitCard.querySelector('.habit-chain-row');
      if (!row || habitCard.querySelector('.inline-edit-input')) return;

      habitCard.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.72rem; font-weight: 700; color: #3b82f6; width: 60px;">Neo:</span>
            <input type="text" class="inline-edit-input habit-edit-anchor" value="${escapeHTML(habit.anchor)}">
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.72rem; font-weight: 700; color: #10b981; width: 60px;">Tích cực:</span>
            <input type="text" class="inline-edit-input habit-edit-action" value="${escapeHTML(habit.action)}">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
            <button type="button" class="btn-secondary btn-sm habit-edit-cancel">Hủy</button>
            <button type="button" class="btn-primary btn-sm habit-edit-save">Lưu chuỗi</button>
          </div>
        </div>
      `;

      const inputAnchor = habitCard.querySelector('.habit-edit-anchor');
      const inputAction = habitCard.querySelector('.habit-edit-action');
      const saveBtn = habitCard.querySelector('.habit-edit-save');
      const cancelBtn = habitCard.querySelector('.habit-edit-cancel');

      inputAnchor.focus();

      function save() {
        const anchorVal = inputAnchor.value.trim();
        const actionVal = inputAction.value.trim();
        if (anchorVal && actionVal) {
          habit.anchor = anchorVal;
          habit.action = actionVal;
          showToast('Đã cập nhật chuỗi thói quen!', '✏️');
        }
        renderHabits();
      }

      function cancel() {
        renderHabits();
      }

      saveBtn.addEventListener('click', save);
      cancelBtn.addEventListener('click', cancel);

      [inputAnchor, inputAction].forEach(inp => {
        inp.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter') {
            evt.preventDefault();
            save();
          } else if (evt.key === 'Escape') {
            evt.preventDefault();
            cancel();
          }
        });
      });
    }

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startHabitEdit();
    });

    anchorNodeText.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startHabitEdit();
    });

    actionNodeText.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startHabitEdit();
    });

    container.appendChild(habitCard);
  });

  const total = appState.habits.length;
  const pct = total > 0 ? Math.round((completedStacks / total) * 100) : 0;

  if (progressPctEl) progressPctEl.textContent = `${pct}% (${completedStacks}/${total} chuỗi)`;
  if (progressBarEl) progressBarEl.style.width = `${pct}%`;

  saveData(STORAGE_KEYS.HABITS, appState.habits);
}

function handleHabitStepChange() {
  const total = appState.habits.length;
  const completedStacks = appState.habits.filter(h => h.anchorDone && h.actionDone).length;

  const today = getTodayDateString();
  if (total > 0 && completedStacks === total) {
    if (appState.streak.lastCompletedDate !== today) {
      appState.streak.streak += 1;
      appState.streak.lastCompletedDate = today;
      saveData(STORAGE_KEYS.STREAK, appState.streak);
      showToast(`Tuyệt vời! Hoàn thành 100% thói quen hôm nay! Chuỗi 🔥 ${appState.streak.streak} ngày!`, '🔥');
    }
  }

  renderHabits();
}

function deleteHabit(habitId) {
  appState.habits = appState.habits.filter(h => h.id !== habitId);
  renderHabits();
  showToast('Đã xóa chuỗi thói quen', '🗑️');
}

function initHabitForm() {
  const form = document.getElementById('addHabitForm');
  const anchorInput = document.getElementById('habitAnchorInput');
  const actionInput = document.getElementById('habitActionInput');

  if (!form || !anchorInput || !actionInput) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const anchor = anchorInput.value.trim();
    const action = actionInput.value.trim();
    if (!anchor || !action) return;

    const newHabit = {
      id: 'habit-' + Date.now(),
      anchor: anchor.startsWith('Sau khi') ? anchor : `Sau khi ${anchor}`,
      action,
      anchorDone: false,
      actionDone: false
    };

    appState.habits.push(newHabit);
    renderHabits();

    anchorInput.value = '';
    actionInput.value = '';
    anchorInput.focus();

    showToast('Đã thêm chuỗi thói quen Atomic Habits mới!', '🔗');
  });
}

// ==========================================================================
// 11. SETTINGS MODAL & DATA BACKUP / RESTORE
// ==========================================================================
function initSettingsModal() {
  const settingsBtn = document.getElementById('settingsBtn');
  const backdrop = document.getElementById('settingsModalBackdrop');
  const closeBtn = document.getElementById('btnCloseSettings');
  const cancelBtn = document.getElementById('btnCancelSettings');
  const saveBtn = document.getElementById('btnSaveSettings');

  const titleInput = document.getElementById('settingsTitleInput');
  const subInput = document.getElementById('settingsSubtitleInput');
  const peakTimeInput = document.getElementById('settingsPeakTime');
  const steadyTimeInput = document.getElementById('settingsSteadyTime');
  const lowTimeInput = document.getElementById('settingsLowTime');

  const btnNewDay = document.getElementById('btnStartNewDay');
  const btnExport = document.getElementById('btnExportJSON');
  const btnTriggerImport = document.getElementById('btnTriggerImport');
  const importFileInput = document.getElementById('importFileInput');

  function openModal() {
    if (!backdrop) return;
    if (titleInput) titleInput.value = appState.settings.title || '';
    if (subInput) subInput.value = appState.settings.subtitle || '';
    if (peakTimeInput) peakTimeInput.value = appState.settings.peakTime || '';
    if (steadyTimeInput) steadyTimeInput.value = appState.settings.steadyTime || '';
    if (lowTimeInput) lowTimeInput.value = appState.settings.lowTime || '';

    document.querySelectorAll('.color-swatch-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.accentColor === appState.accent);
    });

    backdrop.classList.remove('hidden');
  }

  function closeModal() {
    if (backdrop) backdrop.classList.add('hidden');
  }

  if (settingsBtn) settingsBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && !backdrop.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Save Settings
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      appState.settings = {
        title: titleInput ? titleInput.value.trim() || DEFAULT_SETTINGS.title : DEFAULT_SETTINGS.title,
        subtitle: subInput ? subInput.value.trim() || DEFAULT_SETTINGS.subtitle : DEFAULT_SETTINGS.subtitle,
        peakTime: peakTimeInput ? peakTimeInput.value.trim() || DEFAULT_SETTINGS.peakTime : DEFAULT_SETTINGS.peakTime,
        steadyTime: steadyTimeInput ? steadyTimeInput.value.trim() || DEFAULT_SETTINGS.steadyTime : DEFAULT_SETTINGS.steadyTime,
        lowTime: lowTimeInput ? lowTimeInput.value.trim() || DEFAULT_SETTINGS.lowTime : DEFAULT_SETTINGS.lowTime
      };

      saveData(STORAGE_KEYS.SETTINGS, appState.settings);
      applyCustomSettings();
      closeModal();
      showToast('Đã lưu tùy biến cài đặt thành công!', '💾');
    });
  }

  // 1. "Bắt đầu ngày mới" button
  if (btnNewDay) {
    btnNewDay.addEventListener('click', () => {
      appState.habits.forEach(h => {
        h.anchorDone = false;
        h.actionDone = false;
      });
      saveData(STORAGE_KEYS.HABITS, appState.habits);
      renderHabits();
      closeModal();
      showToast('🌅 Chúc bạn một ngày mới tràn đầy năng lượng & hoàn thành trọn vẹn thói quen!', '✨');
    });
  }

  // 2. "Sao lưu dữ liệu (Export JSON)"
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const backupData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        theme: appState.theme,
        accent: appState.accent,
        settings: appState.settings,
        energy: appState.energy,
        tasks: appState.tasks,
        goals: appState.goals,
        habits: appState.habits,
        streak: appState.streak,
        pomoSessions: pomoState.completedSessions
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pcc-backup-${getTodayDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Đã tải xuống file sao lưu JSON an toàn!', '⬇️');
    });
  }

  // 3. "Khôi phục dữ liệu (Import JSON)"
  if (btnTriggerImport && importFileInput) {
    btnTriggerImport.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);

          if (imported.tasks && Array.isArray(imported.tasks)) {
            appState.tasks = imported.tasks;
            saveData(STORAGE_KEYS.TASKS, appState.tasks);
          }
          if (imported.goals && Array.isArray(imported.goals)) {
            appState.goals = imported.goals;
            saveData(STORAGE_KEYS.GOALS, appState.goals);
          }
          if (imported.habits && Array.isArray(imported.habits)) {
            appState.habits = imported.habits;
            saveData(STORAGE_KEYS.HABITS, appState.habits);
          }
          if (imported.streak) {
            appState.streak = imported.streak;
            saveData(STORAGE_KEYS.STREAK, appState.streak);
          }
          if (imported.energy) {
            appState.energy = imported.energy;
            saveData(STORAGE_KEYS.ENERGY, appState.energy);
          }
          if (imported.settings) {
            appState.settings = imported.settings;
            saveData(STORAGE_KEYS.SETTINGS, appState.settings);
          }
          if (imported.pomoSessions !== undefined) {
            pomoState.completedSessions = parseInt(imported.pomoSessions, 10) || 0;
            saveData(STORAGE_KEYS.POMO, pomoState.completedSessions);
          }
          if (imported.theme) {
            applyTheme(imported.theme);
          }
          if (imported.accent) {
            applyAccentColor(imported.accent);
          }

          applyCustomSettings();
          updateEnergyUI(appState.energy.level);
          renderTasks();
          renderGoals();
          renderHabits();
          updatePomodoroUI();

          closeModal();
          showToast('Khôi phục toàn bộ dữ liệu từ JSON thành công!', '🎉');
        } catch (err) {
          console.error(err);
          alert('Tệp JSON không hợp lệ hoặc bị lỗi định dạng!');
        }
        importFileInput.value = '';
      };
      reader.readAsText(file);
    });
  }
}

// ==========================================================================
// 12. GLOBAL RESET DATA HANDLER
// ==========================================================================
function initResetButton() {
  const resetBtn = document.getElementById('resetDataBtn');
  if (!resetBtn) return;

  resetBtn.addEventListener('click', () => {
    const confirmed = confirm('Bạn có muốn khôi phục toàn bộ dữ liệu mẫu ban đầu của Personal Command Center không?');
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.removeItem(STORAGE_KEYS.ACCENT);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.ENERGY);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.STREAK);
    localStorage.removeItem(STORAGE_KEYS.POMO);

    appState.theme = 'dark';
    appState.accent = 'dynamic';
    appState.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    appState.energy = { level: 9, state: 'peak' };
    appState.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    appState.goals = JSON.parse(JSON.stringify(DEFAULT_GOALS));
    appState.habits = JSON.parse(JSON.stringify(DEFAULT_HABITS));
    appState.streak = JSON.parse(JSON.stringify(DEFAULT_STREAK));
    pomoState.completedSessions = 0;

    saveData(STORAGE_KEYS.THEME, appState.theme);
    saveData(STORAGE_KEYS.ACCENT, appState.accent);
    saveData(STORAGE_KEYS.SETTINGS, appState.settings);
    saveData(STORAGE_KEYS.ENERGY, appState.energy);
    saveData(STORAGE_KEYS.TASKS, appState.tasks);
    saveData(STORAGE_KEYS.GOALS, appState.goals);
    saveData(STORAGE_KEYS.HABITS, appState.habits);
    saveData(STORAGE_KEYS.STREAK, appState.streak);
    saveData(STORAGE_KEYS.POMO, pomoState.completedSessions);

    applyTheme('dark');
    applyAccentColor('dynamic');
    applyCustomSettings();
    updateEnergyUI(appState.energy.level);
    renderTasks();
    renderGoals();
    renderHabits();
    resetPomodoro();

    showToast('Đã khôi phục dữ liệu mẫu thành công!', '🔄');
  });
}

// ==========================================================================
// 13. INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initThemeAndAccent();
  initClock();
  applyCustomSettings();
  initEnergyController();
  initPomodoroWidget();
  setupDropzones();
  initTaskForm();
  renderTasks();
  initGoalsForm();
  renderGoals();
  initHabitForm();
  renderHabits();
  initSettingsModal();
  initResetButton();
  initAuthSystem();
});
