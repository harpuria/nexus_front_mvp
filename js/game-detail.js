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

  const gameId = localStorage.getItem("selectedGameId");
  if (!gameId) {
    alert("잘못된 접근입니다.");
    location.href = "game-list.html";
    return;
  }

  // 게임 상세 조회
  try {
    const data = await apiRequest(`/game/${gameId}`, "GET", null, token);
    if (data.success && data.data) {
      const g = data.data;
      $("#gameId").val(g.gameId);
      $("#gameName").val(g.name);
      $("#gameStatus").val(g.status);
      $("#gameVersion").val(g.version);
      $("#orgId").val(g.orgId);
      $("#clientAppId").val(g.clientAppId);
      $("#signatureKey").val(g.signatureKey);
      $("#createdAt").val(g.createdAt ? g.createdAt.split("T")[0] : "-");
    } else {
      alert("게임 정보를 불러올 수 없습니다.");
      location.href = "game-list.html";
    }
  } catch (e) {
    alert("서버 오류가 발생했습니다.");
  }

  // 수정
  $("#btnUpdate").click(async function () {
    const body = {
      name: $("#gameName").val(),
      status: $("#gameStatus").val(),
      version: $("#gameVersion").val(),
      updateBy: adminInfo.loginId || "system",
      isDel: "N"
    };

    if (!body.name) {
      alert("게임 이름은 필수입니다.");
      return;
    }

    if (!confirm("게임 정보를 수정하시겠습니까?")) return;

    try {
      const res = await apiRequest(`/game/${gameId}`, "PATCH", body, token);
      if (res.success) {
        alert("수정이 완료되었습니다.");
        location.href = "game-list.html";
      } else {
        alert("수정 실패: " + (res.message || "오류"));
      }
    } catch (e) {
      alert("서버 오류가 발생했습니다.");
    }
  });

  // 삭제
  $("#btnDelete").click(async function () {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await apiRequest(`/game/${gameId}`, "DELETE", null, token);
      if (res.success) {
        alert("삭제 완료되었습니다.");
        location.href = "game-list.html";
      } else {
        alert("삭제 실패: " + (res.message || "오류"));
      }
    } catch (e) {
      alert("서버 오류가 발생했습니다.");
    }
  });

  // 사이드바의 게임 목록
  try {
    const data = await apiRequest("/game/list", "GET", null, token);
    if (data.success) {
      const list = data.data.games || [];
      if (list.length === 0) {
        $("#gameList").append(`<li class='text-muted'>등록된 게임이 없습니다.</li>`);
      } else {
        list.forEach(g => $("#gameList").append(`<li class='py-1'>🎮 ${g.name}</li>`));
      }
    }
  } catch (e) {
    $("#gameList").append(`<li class='text-danger'>서버 오류</li>`);
  }
});
