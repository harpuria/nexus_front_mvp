async function loadGameLayout() {
    // layout html 불러오기
    const layoutHtml = await fetch("./templates/game-layout.html").then(res => res.text());
    $("#layoutContainer").html(layoutHtml);
  
    // 공통 스타일 및 관리자 이름
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      location.href = "index.html";
      return;
    }
  
    const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
    $("#adminName").text(adminInfo.adminNm || "Admin");
  
    // 로그아웃 버튼
    $("#btnLogout").click(() => {
      localStorage.clear();
      location.href = "index.html";
    });
  
    // 대시보드 복귀
    $("#btnBackDashboard").click(() => location.href = "dashboard.html");
  
    // 게임 ID 가져오기
    const gameId = localStorage.getItem("selectedGameId");
    if (!gameId) {
      alert("잘못된 접근입니다. 게임을 선택해주세요.");
      location.href = "game-list.html";
      return;
    }
  
    // 게임 정보 표시
    const data = await apiRequest(`/game/${gameId}`, "GET", null, token);
    if (data.success && data.data) {
      const g = data.data;
      $("#gameTitle").text(g.name);
      $("#gameInfo").html(
        `(ID: ${g.gameId}) <small class="ms-2 text-muted">버전 ${g.version} • 상태 ${g.status}</small>`
      );
    } else {
      $("#gameTitle").text("게임 정보를 불러올 수 없습니다.");
    }
  
    // Sidebar active 표시
    const currentPage = location.pathname.split("/").pop();
    $(".menu-item[data-page]").each(function () {
      if ($(this).data("page") === currentPage) $(this).addClass("active");
      $(this).click(() => {
        localStorage.setItem("selectedGameId", gameId);
        location.href = $(this).data("page");
      });
    });
  }
  