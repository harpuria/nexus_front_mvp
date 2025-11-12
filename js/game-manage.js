$(document).ready(async function () {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "index.html";
    return;
  }

  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
  $("#adminName").text(adminInfo.adminNm || "Admin");

  $("#btnLogout").click(() => {
    localStorage.clear();
    location.href = "index.html";
  });

  $("#btnBackList").click(() => {
    location.href = "game-list.html";
  });

  const gameId = localStorage.getItem("selectedGameId");
  if (!gameId) {
    alert("잘못된 접근입니다. 게임을 선택해주세요.");
    location.href = "game-list.html";
    return;
  }

  // 게임 상세 정보 로드
  try {
    const data = await apiRequest(`/game/${gameId}`, "GET", null, token);
    if (data.success && data.data) {
      const g = data.data;
      $("#gameId").val(g.gameId);
      $("#gameName").val(g.name);
      $("#gameVersion").val(g.version);
      $("#gameStatus").val(g.status);
      $("#orgId").val(g.orgId);
      $("#clientAppId").val(g.clientAppId || "-");
      $("#signatureKey").val(g.signatureKey || "-");
      $("#createdAt").val(g.createdAt ? g.createdAt.split("T")[0] : "-");
      $("#pageTitle").text(`게임 관리 - ${g.name}`);
    } else {
      alert("게임 정보를 불러올 수 없습니다.");
      location.href = "game-list.html";
    }
  } catch {
    alert("서버 오류가 발생했습니다.");
  }

  // 수정
  $("#btnUpdateGame").click(async function () {
    const body = {
      name: $("#gameName").val().trim(),
      version: $("#gameVersion").val().trim(),
      status: $("#gameStatus").val(),
    };

    if (!body.name) {
      alert("게임명을 입력해주세요.");
      return;
    }

    if (!confirm("게임 정보를 수정하시겠습니까?")) return;

    try {
      const res = await apiRequest(`/game/${gameId}`, "PATCH", body, token);
      if (res.success) {
        alert("수정이 완료되었습니다.");
      } else {
        alert("수정 실패: " + (res.message || "오류"));
      }
    } catch {
      alert("서버 연결 실패");
    }
  });

  // 삭제
  $("#btnDeleteGame").click(async function () {
    if (!confirm("정말 이 게임을 삭제하시겠습니까?")) return;
    try {
      const res = await apiRequest(`/game/${gameId}`, "DELETE", null, token);
      if (res.success) {
        alert("삭제가 완료되었습니다.");
        location.href = "game-list.html";
      } else {
        alert("삭제 실패: " + (res.message || "오류"));
      }
    } catch {
      alert("서버 연결 실패");
    }
  });
});
