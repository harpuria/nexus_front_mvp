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
        showAlert("success", "로그인 성공! " + data.data.admin.adminNm + "님 환영합니다.");
        localStorage.setItem("accessToken", data.data.accessToken);
        // TODO: 추후 dashboard.html 로 이동
        // window.location.href = "dashboard.html";
      } else {
        showAlert("danger", data.message || "로그인 실패");
      }
    } catch (err) {
      showAlert("danger", "서버 연결 실패");
    }
  });

  $("#btnInit").click(() => $("#initModal").modal("show"));
});
