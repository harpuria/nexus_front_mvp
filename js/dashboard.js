$(document).ready(async function() {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "index.html";
    return;
  }

  // 관리자 정보 표시
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
  $("#adminName").text(adminInfo.adminNm || "Admin");
  $("#adminNm").text(adminInfo.adminNm || "-");
  $("#adminEmail").text(adminInfo.adminEmail || "-");
  $("#adminRole").text(adminInfo.adminRole || "-");

  // 게임 목록 불러오기
  try {
    const data = await apiRequest("/game/list", "GET", null, token);
    if (data.success) {
      const list = data.data.games || [];
      if (list.length === 0) {
        $("#gameList").append(`<li class='text-muted'>등록된 게임이 없습니다.</li>`);
      } else {
        list.forEach(g => {
          $("#gameList").append(`<li class="py-1 game-link" data-id="${g.gameId}" style="cursor:pointer;">
              🎮 ${g.name}
            </li>`);
        });

        // 클릭 이벤트 연결
        $(".game-link").click(function () {
          const gameId = $(this).data("id");
          localStorage.setItem("selectedGameId", gameId);
          location.href = "game-manage.html";
        });
      }
    } else {
      $("#gameList").append(`<li class='text-danger'>게임 정보를 불러올 수 없습니다.</li>`);
    }
  } catch (e) {
    $("#gameList").append(`<li class='text-danger'>서버 연결 실패</li>`);
  }

  // 로그아웃
  $("#btnLogout").click(() => {
    localStorage.clear();
    location.href = "index.html";
  });
});
