const byId = (x)=>document.getElementById(x);
const form = byId('loginForm');
const email = byId('email');
const password = byId('password');
const toggle = byId('togglePassword');
const submitBtn = byId('submitBtn');
const emailError = byId('emailError');
const passwordError = byId('passwordError');
byId('year').textContent = new Date().getFullYear();

toggle.addEventListener('click', ()=>{
  const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
  password.setAttribute('type', type);
  toggle.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  emailError.textContent = '';
  passwordError.textContent = '';
  const vEmail = email.value.trim();
  const vPass = password.value.trim();
  let ok = true;

  if(!vEmail){
    emailError.textContent = 'Email is required.'; ok = false;
  }else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vEmail)){
    emailError.textContent = 'Enter a valid email address.'; ok = false;
  }
  if(!vPass){
    passwordError.textContent = 'Password is required.'; ok = false;
  }else if(vPass.length < 8){
    passwordError.textContent = 'Minimum 8 characters.'; ok = false;
  }

  if(!ok) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';

  // Simulated auth
  setTimeout(()=>{
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
    window.location.href = 'dashboard.html';
  }, 1000);
});