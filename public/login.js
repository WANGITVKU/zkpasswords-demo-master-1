window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('bCheckProof');
  if (!btn) {
    console.error('Không tìm thấy nút #bCheckProof');
    return;
  }

  btn.addEventListener('click', async () => {
    const emailAttempt    = document.getElementById('emailAttempt').value.trim();
    const passwordAttempt = document.getElementById('passwordAttempt').value;

    try {
      const res  = await fetch('/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAttempt, passwordAttempt }),
      });
      const data = await res.json();
      alert(data.message.trim());

      // nếu login thành công thì chuyển trang
      if (res.ok && data.message.trim().startsWith('Login Successful')) {
        window.location.href = '/home.html';
      }
    } catch (err) {
      console.error('Error logging in:', err);
      alert('Đã có lỗi xảy ra khi đăng nhập.');
    }
  });
});