/* ============================================================
   NKNP STUDIO — script.js
   Chịu trách nhiệm: thao tác DOM, gắn sự kiện, điều hướng giữa
   màn hình Auth <-> Home, dựa trên kết quả từ auth.js/storage.js.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // ---------- Cache DOM references ----------
  const authScreen = document.getElementById("auth-screen");
  const homeScreen = document.getElementById("home-screen");
  const authSlider = document.getElementById("auth-slider");

  const goSignupBtn = document.getElementById("go-signup");
  const goLoginBtn = document.getElementById("go-login");

  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginMsg = document.getElementById("login-msg");
  const signupMsg = document.getElementById("signup-msg");

  const logoutBtn = document.getElementById("logout-btn");

  const sidebarOpenBtn = document.getElementById("sidebar-open");
  const sidebarCloseBtn = document.getElementById("sidebar-close");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const sidebar = document.getElementById("sidebar");

  const dashboardView = document.getElementById("dashboard-view");
  const contentView = document.getElementById("content-view");
  const pageBreadcrumb = document.getElementById("page-breadcrumb");
  const pageTitle = document.getElementById("page-title");
  const backToHomeBtn = document.getElementById("back-to-home");
  const navItems = document.querySelectorAll(".nav-item");

  const profileView = document.getElementById("profile-view");
  const profileBackBtn = document.getElementById("profile-back");
  const profileAvatar = document.getElementById("profile-avatar");
  const profileDisplayName = document.getElementById("profile-display-name");
  const profileDisplayEmail = document.getElementById("profile-display-email");
  const infoEmail = document.getElementById("info-email");
  const infoJoined = document.getElementById("info-joined");
  const infoBalance = document.getElementById("info-balance");

  const usernameForm = document.getElementById("username-form");
  const usernameInput = document.getElementById("profile-username");
  const usernameMsg = document.getElementById("username-msg");

  const passwordForm = document.getElementById("password-form");
  const passwordMsg = document.getElementById("password-msg");

  const userAvatar = document.getElementById("user-avatar");
  const userNameEl = document.getElementById("user-name");
  const homeUsernameEl = document.getElementById("home-username");
  const sessionUserEl = document.getElementById("session-user");

  // ---------- Form slider: Login <-> Sign up ----------
  goSignupBtn.addEventListener("click", () => {
    authSlider.classList.add("show-signup");
    clearMessage(loginMsg);
  });

  goLoginBtn.addEventListener("click", () => {
    authSlider.classList.remove("show-signup");
    clearMessage(signupMsg);
  });

  // ---------- Show / hide password ----------
  document.querySelectorAll(".toggle-eye").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      target.type = target.type === "password" ? "text" : "password";
    });
  });

  // ---------- Sign up submit ----------
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    const result = registerAccount(username, email, password);
    showMessage(signupMsg, result.message, result.ok);

    if (result.ok) {
      setTimeout(() => enterHomeScreen(), 500);
    }
  });

  // ---------- Login submit ----------
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const remember = document.getElementById("remember-me").checked;

    const result = loginAccount(email, password, remember);
    showMessage(loginMsg, result.message, result.ok);

    if (result.ok) {
      setTimeout(() => enterHomeScreen(), 400);
    }
  });

  // ---------- Logout ----------
  logoutBtn.addEventListener("click", () => {
    logoutUser();
    loginForm.reset();
    signupForm.reset();
    authSlider.classList.remove("show-signup");
    closeSidebar();
    contentView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    navItems.forEach((el) => el.classList.remove("is-active"));
    showHomeOrAuth();
  });

  // ---------- Sidebar drawer (menu 3 gạch) ----------
  function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarOverlay.classList.add("is-open");
    sidebar.setAttribute("aria-hidden", "false");
    sidebarOpenBtn.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarOverlay.classList.remove("is-open");
    sidebar.setAttribute("aria-hidden", "true");
    sidebarOpenBtn.setAttribute("aria-expanded", "false");
  }

  sidebarOpenBtn.addEventListener("click", openSidebar);
  sidebarCloseBtn.addEventListener("click", closeSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);

  // ---------- Accordion: mở/đóng từng nhóm mục trong sidebar ----------
  document.querySelectorAll(".nav-group__toggle").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", () => {
      const group = toggleBtn.closest(".nav-group");
      group.classList.toggle("is-open");
    });
  });

  // ---------- Truy cập mục trong sidebar -> hiện trang con tương ứng ----------
  navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      if (item.dataset.page === "profile") {
        openProfilePage(item);
        return;
      }

      openContentPage(item.dataset.group, item.dataset.label, item);
    });
  });

  backToHomeBtn.addEventListener("click", () => {
    contentView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    navItems.forEach((el) => el.classList.remove("is-active"));
  });

  profileBackBtn.addEventListener("click", () => {
    profileView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    navItems.forEach((el) => el.classList.remove("is-active"));
  });

  /**
   * Hiện trang Hồ Sơ, đổ dữ liệu tài khoản hiện tại vào form.
   */
  function openProfilePage(clickedItem) {
    dashboardView.classList.add("hidden");
    contentView.classList.add("hidden");
    profileView.classList.remove("hidden");

    navItems.forEach((el) => el.classList.remove("is-active"));
    clickedItem.classList.add("is-active");

    fillProfileData();
    clearMessage(usernameMsg);
    clearMessage(passwordMsg);
    passwordForm.reset();

    closeSidebar();
  }

  /**
   * Đổ dữ liệu người dùng hiện tại (tên, email, ngày tham gia, số dư)
   * vào giao diện trang Hồ Sơ.
   */
  function fillProfileData() {
    const user = getCurrentUser();
    if (!user) return;

    profileAvatar.textContent = user.username.charAt(0).toUpperCase();
    profileDisplayName.textContent = user.username;
    profileDisplayEmail.textContent = user.email;
    infoEmail.textContent = user.email;
    infoJoined.textContent = user.createdAt ? formatJoinDate(user.createdAt) : "—";
    infoBalance.textContent = formatCurrency(user.balance);
    usernameInput.value = user.username;
  }

  /**
   * Định dạng timestamp thành ngày/tháng/năm kiểu Việt Nam.
   */
  function formatJoinDate(timestamp) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Định dạng số tiền theo kiểu Việt Nam, vd: 1.000.000 ₫
   */
  function formatCurrency(amount) {
    const value = typeof amount === "number" ? amount : 0;
    return `${value.toLocaleString("vi-VN")} ₫`;
  }

  // ---------- Đổi tên người dùng ----------
  usernameForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = updateUsername(usernameInput.value);
    showMessage(usernameMsg, result.message, result.ok);

    if (result.ok) {
      fillProfileData();
      // đồng bộ tên hiển thị ở header + trang chủ ngay lập tức
      const user = getCurrentUser();
      if (user) {
        userAvatar.textContent = user.username.charAt(0).toUpperCase();
        userNameEl.textContent = user.username;
        homeUsernameEl.textContent = user.username;
      }
    }
  });

  // ---------- Đổi mật khẩu ----------
  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    const result = changePassword(currentPassword, newPassword, confirmPassword);
    showMessage(passwordMsg, result.message, result.ok);

    if (result.ok) {
      passwordForm.reset();
    }
  });

  /**
   * Hiện trang con ứng với mục đã bấm trong sidebar (placeholder,
   * nội dung thật sẽ được xây dựng ở phiên bản kế tiếp).
   */
  function openContentPage(group, label, clickedItem) {
    pageBreadcrumb.textContent = `${group.toUpperCase()} // ${label.toUpperCase()}`;
    pageTitle.textContent = label;

    dashboardView.classList.add("hidden");
    contentView.classList.remove("hidden");

    navItems.forEach((el) => el.classList.remove("is-active"));
    clickedItem.classList.add("is-active");

    closeSidebar();
  }

  // ---------- Helpers ----------

  /**
   * Hiển thị thông báo lỗi (đỏ) hoặc thành công (xanh) dưới form.
   */
  function showMessage(el, text, isSuccess) {
    el.textContent = text;
    el.classList.remove("is-error", "is-success");
    el.classList.add(isSuccess ? "is-success" : "is-error");
  }

  function clearMessage(el) {
    el.textContent = "";
    el.classList.remove("is-error", "is-success");
  }

  /**
   * Điền thông tin user hiện tại vào header + hero, rồi hiện Trang chủ.
   */
  function enterHomeScreen() {
    const user = getCurrentUser();
    if (!user) return; // an toàn: không có session hợp lệ thì không vào được

    userAvatar.textContent = user.username.charAt(0).toUpperCase();
    userNameEl.textContent = user.username;
    homeUsernameEl.textContent = user.username;
    sessionUserEl.textContent = user.email;

    authScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
  }

  /**
   * Kiểm tra session lúc tải trang: nếu đã đăng nhập -> vào thẳng Trang chủ,
   * ngược lại hiển thị màn hình đăng nhập.
   */
  function showHomeOrAuth() {
    const user = getCurrentUser();
    if (user) {
      enterHomeScreen();
    } else {
      homeScreen.classList.add("hidden");
      authScreen.classList.remove("hidden");
      prefillLastEmail();
    }
  }

  /**
   * Tự động điền sẵn Gmail đăng nhập gần nhất vào form Login,
   * giúp khách hàng đỡ phải gõ lại email ở lần truy cập sau
   * (áp dụng cho cả trường hợp không tick "Ghi nhớ đăng nhập").
   */
  function prefillLastEmail() {
    const lastEmail = getLastEmail();
    if (!lastEmail) return;

    const loginEmailInput = document.getElementById("login-email");
    loginEmailInput.value = lastEmail;
    // đưa focus sẵn vào ô mật khẩu vì email đã có sẵn
    document.getElementById("login-password").focus();
  }

  // ---------- Init on page load (giữ đăng nhập khi F5) ----------
  showHomeOrAuth();
});