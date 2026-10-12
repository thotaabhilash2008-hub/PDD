import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyD2dR8nc503ucRsCt_rnZvt8YbxmMLwzfs',
  authDomain: 'hemoconnect-85f9d.firebaseapp.com',
  projectId: 'hemoconnect-85f9d',
  storageBucket: 'hemoconnect-85f9d.firebasestorage.app',
  messagingSenderId: '436192363775',
  appId: '1:436192363775:web:61e4df75f8778923bdf8ca',
  measurementId: 'G-GP0WQ5PVZK'
};
const environmentFirebaseConfig = Object.fromEntries(
  Object.entries(window.HEMO_FIREBASE_CONFIG || {}).filter(([, value]) => Boolean(value))
);
const config = { ...defaultFirebaseConfig, ...environmentFirebaseConfig };
const gate = document.getElementById('auth-gate');
const status = document.getElementById('auth-status');
const googleButton = document.getElementById('google-sign-in');
const guestButton = document.getElementById('guest-sign-in');
const phoneForm = document.getElementById('phone-form');
const otpForm = document.getElementById('otp-form');
let confirmationResult = null;
let recaptchaVerifier = null;

function showStatus(message, state = 'error') {
  status.textContent = message;
  status.dataset.state = state;
}

function setAppAccess(enabled) {
  document.querySelectorAll('.navbar, main.container, #emergency-ticker-bar, #sos-modal').forEach(element => {
    if (enabled) element.removeAttribute('inert');
    else element.setAttribute('inert', '');
  });
}

setAppAccess(false);

function messageForError(error) {
  const messages = {
    'auth/invalid-phone-number': 'Enter a valid phone number with its country code.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before completion.',
    'auth/popup-blocked': 'Allow pop-ups for this site, then try Google sign-in again.',
    'auth/operation-not-allowed': 'Google sign-in is disabled for this Firebase project.',
    'auth/unauthorized-domain': 'Add localhost to the authorized domains in Firebase Authentication settings.',
    'auth/network-request-failed': 'Check your internet connection and try signing in again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/invalid-verification-code': 'That verification code is incorrect. Try again.'
  };
  return messages[error.code] || error.message || 'Sign-in could not be completed. Please try again.';
}

let freshTokenPromise = null;
let freshTokenUid = null;

window.HemoAuth = {
  currentUser: null,
  isGuest: false,
  async getIdToken(forceRefresh = true) {
    const user = auth?.currentUser;
    if (!user || this.isGuest) return null;
    if (!forceRefresh) return user.getIdToken();

    if (freshTokenUid !== user.uid) {
      freshTokenUid = user.uid;
      freshTokenPromise = null;
    }
    if (!freshTokenPromise) {
      const refreshPromise = user.getIdToken(true).finally(() => {
        if (freshTokenPromise === refreshPromise) {
          freshTokenPromise = null;
          freshTokenUid = null;
        }
      });
      freshTokenPromise = refreshPromise;
    }
    return freshTokenPromise;
  },
  async signOut() {
    if (this.isGuest) {
      this.isGuest = false;
      document.body.removeAttribute('data-guest');
      document.body.removeAttribute('data-authenticated');
      document.getElementById('auth-user-label').textContent = '';
      document.getElementById('auth-user-label').classList.remove('guest-mode-indicator');
      document.getElementById('sign-out-btn').textContent = 'Sign out';
      setAppAccess(false);
      gate.hidden = false;
      return;
    }
    if (auth) await firebaseSignOut(auth);
  }
};

guestButton.addEventListener('click', () => {
  window.HemoAuth.isGuest = true;
  window.HemoAuth.currentUser = null;
  document.body.removeAttribute('data-authenticated');
  document.body.dataset.guest = 'true';
  document.getElementById('auth-user-label').textContent = 'Guest Mode';
  document.getElementById('auth-user-label').classList.add('guest-mode-indicator');
  document.getElementById('sign-out-btn').textContent = 'Exit Guest';
  setAppAccess(true);
  gate.hidden = true;
  document.dispatchEvent(new Event('hemo-authenticated'));
});

const hasFirebaseConfig = ['apiKey', 'authDomain', 'projectId', 'appId'].every(key => config[key]);
let auth = null;

if (!hasFirebaseConfig) {
  googleButton.disabled = true;
  phoneForm.querySelector('button').disabled = true;
  showStatus('Firebase is not configured yet. Add the project settings to enable sign-in.');
} else {
  auth = getAuth(initializeApp(config));

  googleButton.addEventListener('click', async () => {
    try {
      showStatus('');
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      showStatus(messageForError(error));
    }
  });

  phoneForm.addEventListener('submit', async event => {
    event.preventDefault();
    const phoneNumber = document.getElementById('phone-number').value.trim();
    try {
      showStatus('');
      recaptchaVerifier ??= new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      phoneForm.hidden = true;
      otpForm.hidden = false;
      document.getElementById('phone-code').focus();
      showStatus('A verification code was sent to your phone.', 'success');
    } catch (error) {
      recaptchaVerifier?.clear();
      recaptchaVerifier = null;
      showStatus(messageForError(error));
    }
  });

  otpForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!confirmationResult) return;
    try {
      showStatus('');
      await confirmationResult.confirm(document.getElementById('phone-code').value.trim());
    } catch (error) {
      showStatus(messageForError(error));
    }
  });

  onAuthStateChanged(auth, async user => {
    window.HemoAuth.currentUser = user;
    if (!user) {
      if (window.HemoAuth.isGuest) return;
      document.body.removeAttribute('data-authenticated');
      document.body.removeAttribute('data-guest');
      document.getElementById('auth-user-label').classList.remove('guest-mode-indicator');
      document.getElementById('sign-out-btn').textContent = 'Sign out';
      setAppAccess(false);
      gate.hidden = false;
      return;
    }

    window.HemoAuth.isGuest = false;
    document.body.removeAttribute('data-guest');
    document.getElementById('auth-user-label').classList.remove('guest-mode-indicator');
    document.getElementById('sign-out-btn').textContent = 'Sign out';
    document.getElementById('auth-user-label').textContent = user.email || user.phoneNumber || '';
    document.body.dataset.authenticated = 'true';
    setAppAccess(true);
    gate.hidden = true;
    document.dispatchEvent(new Event('hemo-authenticated'));

    try {
      const token = await window.HemoAuth.getIdToken(true);
      if (!token) throw new Error('No Firebase ID token was returned.');
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) console.error('Unable to sync the signed-in profile:', result.error);
    } catch (error) {
      console.error('Unable to sync the signed-in profile:', { code: error.code || 'token-or-profile-sync-failed' });
    }
  });
}