$(document).ready(function() {
  $("#btnInitSubmit").click(async function() {
    const req = {
      loginId: $("#initLoginId").val(),
      loginPw: $("#initLoginPw").val(),
      adminEmail: $("#adminEmail").val(),
      adminNm: $("#adminNm").val(),
      orgNm: $("#orgNm").val(),
      orgCd: $("#orgCd").val()
    };

    if (!req.loginId || !req.loginPw || !req.adminEmail || !req.adminNm || !req.orgNm) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const data = await apiRequest("/admin/initialize", "POST", req);

      if (data.success) {
        alert("초기 관리자 등록 완료! 이제 로그인하세요.");
        $("#initModal").modal("hide");
      } else {
        alert(data.message || "등록 실패");
      }
    } catch (err) {
      alert("서버 연결 실패");
    }
  });
});
