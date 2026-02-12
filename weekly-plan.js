/* ===========================
   WEEKLY PLAN VIEW - INTERACTION LOGIC
   RecruitCoS - Parent-First Recruiting Platform
   =========================== */

// ===========================
// STATE MANAGEMENT
// ===========================

const WeeklyPlanState = {
  weekNumber: 1,
  totalWeeks: 4,
  parentName: 'Sarah', // This will come from your backend/auth
  actions: [
    {
      id: 1,
      completed: false,
      completedAt: null
    },
    {
      id: 2,
      completed: false,
      completedAt: null
    },
    {
      id: 3,
      completed: false,
      completedAt: null
    }
  ],
  streakWeeks: 0,

  // Methods
  completeAction(actionId) {
    const action = this.actions.find(a => a.id === actionId);
    if (action && !action.completed) {
      action.completed = true;
      action.completedAt = new Date().toISOString();
      this.saveToLocalStorage();
      return true;
    }
    return false;
  },

  getCompletedCount() {
    return this.actions.filter(a => a.completed).length;
  },

  isWeekComplete() {
    return this.getCompletedCount() >= 2; // 2+ actions = week complete
  },

  saveToLocalStorage() {
    localStorage.setItem('weeklyPlanState', JSON.stringify({
      weekNumber: this.weekNumber,
      actions: this.actions,
      streakWeeks: this.streakWeeks
    }));
  },

  loadFromLocalStorage() {
    const saved = localStorage.getItem('weeklyPlanState');
    if (saved) {
      const data = JSON.parse(saved);
      this.weekNumber = data.weekNumber || 1;
      this.actions = data.actions || this.actions;
      this.streakWeeks = data.streakWeeks || 0;
    }
  }
};

// ===========================
// DOM ELEMENTS
// ===========================

const DOM = {
  actionCards: document.querySelectorAll('.action-card'),
  actionButtons: document.querySelectorAll('.action-button'),
  progressCount: document.querySelector('.progress-count'),
  progressEncouragement: document.querySelector('.progress-encouragement'),
  streakIndicator: document.querySelector('.streak-indicator'),
  streakCount: document.querySelector('.streak-count'),
  celebrationModal: document.querySelector('.celebration-modal'),
  celebrationNumber: document.querySelector('.celebration-number'),
  celebrationCTA: document.querySelector('.celebration-cta'),
  headerMenu: document.querySelector('.header-menu')
};

// ===========================
// INITIALIZATION
// ===========================

function init() {
  console.log('🚀 Weekly Plan View initialized');

  // Load saved state
  WeeklyPlanState.loadFromLocalStorage();

  // Update UI based on saved state
  updateUIFromState();

  // Attach event listeners
  attachEventListeners();

  // Log analytics event
  logAnalyticsEvent('weekly_plan_viewed', {
    week_number: WeeklyPlanState.weekNumber,
    completed_count: WeeklyPlanState.getCompletedCount()
  });
}

// ===========================
// EVENT LISTENERS
// ===========================

function attachEventListeners() {
  // Action buttons
  DOM.actionButtons.forEach((button, index) => {
    button.addEventListener('click', () => handleActionClick(index + 1));
  });

  // Celebration modal close
  DOM.celebrationCTA.addEventListener('click', closeCelebrationModal);

  // Close modal on overlay click
  const overlay = document.querySelector('.celebration-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeCelebrationModal);
  }

  // Header menu (placeholder)
  if (DOM.headerMenu) {
    DOM.headerMenu.addEventListener('click', () => {
      console.log('Menu clicked - implement menu logic here');
      // This would open a menu with: Settings, Help, Log Out
    });
  }
}

// ===========================
// ACTION HANDLING
// ===========================

function handleActionClick(actionId) {
  console.log(`Action ${actionId} clicked`);

  const action = WeeklyPlanState.actions.find(a => a.id === actionId);

  // Don't allow clicking completed actions
  if (action && action.completed) {
    console.log('Action already completed');
    return;
  }

  // Log analytics
  logAnalyticsEvent('action_started', {
    action_number: actionId,
    week_number: WeeklyPlanState.weekNumber
  });

  // In a real app, this would navigate to the action detail page
  // For now, we'll simulate immediate completion for demo purposes
  simulateActionCompletion(actionId);
}

function simulateActionCompletion(actionId) {
  // Simulate a delay (as if user completed the action)
  setTimeout(() => {
    completeAction(actionId);
  }, 500);
}

function completeAction(actionId) {
  console.log(`Completing action ${actionId}`);

  // Update state
  const success = WeeklyPlanState.completeAction(actionId);

  if (!success) {
    console.error('Failed to complete action');
    return;
  }

  // Update UI
  updateActionCard(actionId, true);
  updateProgressSection();

  // Show celebration
  showCelebrationModal(actionId);

  // Log analytics
  logAnalyticsEvent('action_completed', {
    action_number: actionId,
    week_number: WeeklyPlanState.weekNumber,
    total_completed: WeeklyPlanState.getCompletedCount()
  });

  // Check if week is complete
  if (WeeklyPlanState.isWeekComplete() && WeeklyPlanState.streakWeeks === 0) {
    WeeklyPlanState.streakWeeks = 1;
    WeeklyPlanState.saveToLocalStorage();
    updateStreakDisplay();

    logAnalyticsEvent('week_completed', {
      week_number: WeeklyPlanState.weekNumber,
      actions_completed: WeeklyPlanState.getCompletedCount()
    });
  }
}

// ===========================
// UI UPDATES
// ===========================

function updateUIFromState() {
  // Update each action card based on saved state
  WeeklyPlanState.actions.forEach(action => {
    if (action.completed) {
      updateActionCard(action.id, true);
    }
  });

  // Update progress
  updateProgressSection();

  // Update streak if exists
  if (WeeklyPlanState.streakWeeks > 0) {
    updateStreakDisplay();
  }
}

function updateActionCard(actionId, completed) {
  const card = document.querySelector(`.action-card[data-action="${actionId}"]`);
  if (!card) return;

  card.setAttribute('data-completed', completed);

  const statusEl = card.querySelector('.action-status');
  if (statusEl) {
    statusEl.textContent = completed ? 'Done' : 'Not Done';
  }

  const button = card.querySelector('.action-button');
  if (button) {
    button.disabled = completed;
    button.textContent = completed ? 'Completed' : 'Start This Action';
  }

  // Add completion animation
  if (completed) {
    card.style.animation = 'slideUp 0.3s ease';
  }
}

function updateProgressSection() {
  const completedCount = WeeklyPlanState.getCompletedCount();
  const totalActions = WeeklyPlanState.actions.length;

  // Update count
  if (DOM.progressCount) {
    DOM.progressCount.textContent = `${completedCount}/${totalActions}`;
  }

  // Update encouragement message
  if (DOM.progressEncouragement) {
    if (completedCount === 0) {
      DOM.progressEncouragement.textContent = 'Complete 2+ actions this week to stay on track';
    } else if (completedCount === 1) {
      DOM.progressEncouragement.textContent = 'Great start! Complete 1 more to build momentum';
    } else if (completedCount === 2) {
      DOM.progressEncouragement.textContent = 'You\'re on track! One more for a perfect week';
    } else {
      DOM.progressEncouragement.textContent = 'Perfect week! You\'re building a strong foundation';
    }
  }
}

function updateStreakDisplay() {
  if (!DOM.streakIndicator || !DOM.streakCount) return;

  const streakWeeks = WeeklyPlanState.streakWeeks;

  if (streakWeeks > 0) {
    DOM.streakCount.textContent = streakWeeks;
    DOM.streakIndicator.style.display = 'block';
  } else {
    DOM.streakIndicator.style.display = 'none';
  }
}

// ===========================
// CELEBRATION MODAL
// ===========================

function showCelebrationModal(actionId) {
  if (!DOM.celebrationModal) return;

  // Update modal content
  if (DOM.celebrationNumber) {
    DOM.celebrationNumber.textContent = actionId;
  }

  // Show modal
  DOM.celebrationModal.style.display = 'flex';

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Auto-close after 3 seconds (optional)
  // setTimeout(closeCelebrationModal, 3000);
}

function closeCelebrationModal() {
  if (!DOM.celebrationModal) return;

  // Hide modal
  DOM.celebrationModal.style.display = 'none';

  // Restore body scroll
  document.body.style.overflow = 'auto';
}

// ===========================
// ANALYTICS
// ===========================

function logAnalyticsEvent(eventName, properties = {}) {
  console.log('📊 Analytics Event:', eventName, properties);

  // In production, send to your analytics service
  // Examples:

  // Plausible
  // window.plausible?.(eventName, { props: properties });

  // PostHog
  // window.posthog?.capture(eventName, properties);

  // Google Analytics 4
  // gtag?.('event', eventName, properties);

  // Mixpanel
  // mixpanel?.track(eventName, properties);

  // Simple Analytics
  // sa_event?.(eventName);
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getTimeToComplete(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMinutes = Math.round((end - start) / 1000 / 60);
  return diffMinutes;
}

// ===========================
// INITIALIZE ON PAGE LOAD
// ===========================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ===========================
// EXPORT FOR TESTING (optional)
// ===========================

// For unit tests or debugging in console
window.WeeklyPlanDebug = {
  state: WeeklyPlanState,
  completeAction,
  resetState: () => {
    localStorage.removeItem('weeklyPlanState');
    location.reload();
  },
  getState: () => WeeklyPlanState
};
