/* ============================================================
   NKNP STUDIO — auth.js
   Chịu trách nhiệm: kiểm tra dữ liệu (validate) + xử lý
   nghiệp vụ đăng ký / đăng nhập. Không thao tác DOM trực tiếp,
   chỉ trả về kết quả { ok, message } để script.js hiển thị.
   ============================================================ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Kiểm tra định dạng email cơ bản.
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Xử lý đăng ký tài khoản mới.
 * @returns {{ok: boolean, message: string}}
 */
function registerAccount(username, email, password) {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim();

  if (!cleanUsername) {
    return { ok: false, message: "Tên người dùng không được để trống." };
  }

  if (!isValidEmail(cleanEmail)) {
    return { ok: false, message: "Gmail không đúng định dạng." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Mật khẩu phải có tối thiểu 6 ký tự." };
  }

  if (findAccountByEmail(cleanEmail)) {
    return { ok: false, message: "Tài khoản đã tồn tại." };
  }

  addAccount({
    username: cleanUsername,
    email: cleanEmail,
    password,
    balance: 0,
    createdAt: Date.now(),
  });
  setSession(cleanEmail, true); // vừa đăng ký -> mặc định nhớ đăng nhập luôn
  saveLastEmail(cleanEmail);

  return { ok: true, message: "Tạo tài khoản thành công!" };
}

/**
 * Xử lý đăng nhập.
 * @param {string} email
 * @param {string} password
 * @param {boolean} remember - có tick "Ghi nhớ đăng nhập" hay không
 * @returns {{ok: boolean, message: string}}
 */
function loginAccount(email, password, remember) {
  const cleanEmail = email.trim();
  const account = findAccountByEmail(cleanEmail);

  if (!account || account.password !== password) {
    return { ok: false, message: "Sai Gmail hoặc Mật khẩu." };
  }

  setSession(cleanEmail, remember);
  saveLastEmail(cleanEmail); // luôn ghi nhớ email để tự điền sẵn lần sau, kể cả khi remember=false

  return { ok: true, message: "Đăng nhập thành công!" };
}

/**
 * Lấy thông tin người dùng đang đăng nhập (theo session hiện tại).
 * @returns {{username: string, email: string, balance: number, createdAt: number} | null}
 */
function getCurrentUser() {
  const session = getSession();
  if (!session || !session.isLoggedIn) return null;

  const account = findAccountByEmail(session.email);
  if (!account) return null;

  return {
    username: account.username,
    email: account.email,
    balance: typeof account.balance === "number" ? account.balance : 0,
    createdAt: account.createdAt || null,
  };
}

/**
 * Đăng xuất người dùng hiện tại (chỉ xóa session, giữ nguyên tài khoản).
 */
function logoutUser() {
  clearSession();
}

/**
 * Đổi tên hiển thị của tài khoản đang đăng nhập.
 * @param {string} newUsername
 * @returns {{ok: boolean, message: string}}
 */
function updateUsername(newUsername) {
  const cleanUsername = newUsername.trim();
  const user = getCurrentUser();

  if (!user) {
    return { ok: false, message: "Phiên đăng nhập đã hết hạn." };
  }

  if (!cleanUsername) {
    return { ok: false, message: "Tên người dùng không được để trống." };
  }

  updateAccount(user.email, { username: cleanUsername });

  return { ok: true, message: "Cập nhật tên người dùng thành công!" };
}

/**
 * Đổi mật khẩu của tài khoản đang đăng nhập.
 * @param {string} currentPassword
 * @param {string} newPassword
 * @param {string} confirmPassword
 * @returns {{ok: boolean, message: string}}
 */
function changePassword(currentPassword, newPassword, confirmPassword) {
  const session = getSession();
  if (!session || !session.isLoggedIn) {
    return { ok: false, message: "Phiên đăng nhập đã hết hạn." };
  }

  const account = findAccountByEmail(session.email);
  if (!account) {
    return { ok: false, message: "Phiên đăng nhập đã hết hạn." };
  }

  if (account.password !== currentPassword) {
    return { ok: false, message: "Mật khẩu hiện tại không đúng." };
  }

  if (newPassword.length < 6) {
    return { ok: false, message: "Mật khẩu mới phải có tối thiểu 6 ký tự." };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, message: "Xác nhận mật khẩu không khớp." };
  }

  updateAccount(account.email, { password: newPassword });

  return { ok: true, message: "Đổi mật khẩu thành công!" };
}
