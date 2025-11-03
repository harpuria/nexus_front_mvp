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
  
    $("#btnBackDashboard").click(() => {
      location.href = "dashboard.html";
    });
  
    const gameId = localStorage.getItem("selectedGameId");
    if (!gameId) {
      alert("잘못된 접근입니다. 게임을 선택해주세요.");
      location.href = "game-list.html";
      return;
    }
  
    // 게임 상세 조회
    try {
      const data = await apiRequest(`/game/${gameId}`, "GET", null, token);
      if (data.success && data.data) {
        const g = data.data;
  
        // 헤더 바 표시
        $("#gameTitle").text(g.name);
        $("#gameInfo").html(
          `(ID: ${g.gameId}) <small class="ms-2 text-muted">버전 ${g.version} • 상태 ${g.status}</small>`
        );
  
        // 상세 카드 정보
        $("#gameId").text(g.gameId);
        $("#gameName").text(g.name);
        $("#gameVersion").text(g.version);
        $("#gameStatus").text(g.status);
        $("#orgId").text(g.orgId);
        $("#createdAt").text(g.createdAt ? g.createdAt.split("T")[0] : "-");
      } else {
        alert("게임 정보를 불러올 수 없습니다.");
        location.href = "game-list.html";
      }
    } catch (e) {
      alert("서버 오류가 발생했습니다.");
    }
  });
  