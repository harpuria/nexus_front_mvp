$(document).ready(function() {
  $("#btnLogin").click(async function() {
    const id = $("#loginId").val();
    const pw = $("#loginPw").val();

    if (!id || !pw) {
      showAlert("danger", "로그인 정보를 입력해주세요.");
      return;
    }

    try {
      const data = await apiRequest("/admin/login", "POST", { loginId: id, loginPw: pw });
      if (data.success) {
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("adminInfo", JSON.stringify(data.data.admin));
        showAlert("success", "로그인 성공! 대시보드로 이동합니다...");
        setTimeout(() => window.location.href = "dashboard.html", 800);
      } else {
        showAlert("danger", data.message || "로그인 실패");
      }
    } catch (err) {
      showAlert("danger", "서버 연결 실패");
    }
  });

  $("#btnInit").click(() => $("#initModal").modal("show"));
});
