$(document).ready(function () {
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

  loadSidebarGames(token);

  let currentPage = 0;
  const pageSize = 10;
  let keyword = "";

  // ✅ 신규 게임 생성 버튼
  $("#btnCreateGame").click(() => {
    $("#createGameModal").modal("show");
  });

  // ✅ 게임 등록
  $("#btnCreateGameSubmit").click(async function () {
    const req = {
      name: $("#newGameName").val().trim(),
      version: $("#newGameVersion").val().trim(),
      status: $("#newGameStatus").val(),
      createdBy: adminInfo.loginId,
      orgId: adminInfo.orgId
    };

    if (!req.name) {
      alert("게임명을 입력해주세요.");
      return;
    }

    try {
      const res = await apiRequest("/game", "POST", req, token);
      if (res.success) {
        alert("신규 게임이 등록되었습니다.");
        $("#createGameModal").modal("hide");
        loadGames(currentPage, keyword);
      } else {
        alert("등록 실패: " + (res.message || "오류"));
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  });

  // ✅ 게임 목록 불러오기
  async function loadGames(page = 0, keyword = "") {
    $("#gameTableBody").html(`<tr><td colspan="6" class="text-center text-muted">로딩 중...</td></tr>`);
    try {
      const query = new URLSearchParams({ page, size: pageSize }).toString();
      const data = await apiRequest(`/game/list?${query}`, "GET", null, token);

      if (data.success && data.data && Array.isArray(data.data.games)) {
        const { games, totalPages, hasNext, hasPrevious } = data.data;
        const list = games.filter(g => !keyword || g.name.toLowerCase().includes(keyword.toLowerCase()));
        renderTable(list);
        renderPagination(page, totalPages, hasNext, hasPrevious);
      } else {
        $("#gameTableBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터가 없습니다.</td></tr>`);
      }
    } catch {
      $("#gameTableBody").html(`<tr><td colspan="6" class="text-center text-danger">서버 오류</td></tr>`);
    }
  }

  // ✅ 테이블 렌더링
  function renderTable(games) {
    if (!games || games.length === 0) {
      $("#gameTableBody").html(`<tr><td colspan="6" class="text-center text-muted">검색 결과가 없습니다.</td></tr>`);
      return;
    }

    const rows = games.map(
      g => `
      <tr class="game-row" style="cursor:pointer;" data-id="${g.gameId}">
        <td>${g.gameId}</td>
        <td>${g.name}</td>
        <td>${g.status}</td>
        <td>${g.version}</td>
        <td>${g.orgId || "-"}</td>
        <td>${g.createdAt ? g.createdAt.split("T")[0] : "-"}</td>
      </tr>`
    ).join("");

    $("#gameTableBody").html(rows);

    $(".game-row").click(function () {
      const gameId = $(this).data("id");
      localStorage.setItem("selectedGameId", gameId);
      location.href = "game-detail.html";
    });
  }

  // ✅ [이전] 1 2 3 4 5 [다음] 페이지네이션
  function renderPagination(current, totalPages, hasNext, hasPrevious) {
    const maxVisible = 5;
    const start = Math.floor(current / maxVisible) * maxVisible;
    const end = Math.min(start + maxVisible, totalPages);
    let html = "";

    html += `<li class="page-item ${!hasPrevious ? "disabled" : ""}">
      <a class="page-link" href="#" id="prevPage">이전</a></li>`;

    for (let i = start; i < end; i++) {
      html += `<li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link page-num" href="#" data-page="${i}">${i + 1}</a></li>`;
    }

    html += `<li class="page-item ${!hasNext ? "disabled" : ""}">
      <a class="page-link" href="#" id="nextPage">다음</a></li>`;

    $("#pagination").html(html);

    $("#prevPage").click(function (e) {
      e.preventDefault();
      if (current > 0) {
        currentPage--;
        loadGames(currentPage, keyword);
      }
    });

    $(".page-num").click(function (e) {
      e.preventDefault();
      const page = parseInt($(this).data("page"));
      currentPage = page;
      loadGames(currentPage, keyword);
    });

    $("#nextPage").click(function (e) {
      e.preventDefault();
      currentPage++;
      loadGames(currentPage, keyword);
    });
  }

  // 검색
  $("#btnSearch").click(function () {
    keyword = $("#searchKeyword").val();
    currentPage = 0;
    loadGames(currentPage, keyword);
  });

  async function loadSidebarGames(token) {
    try {
      const data = await apiRequest("/game/list", "GET", null, token);
      if (data.success) {
        const list = data.data.games || [];
        $("#gameList").html(
          list.length === 0
            ? `<li class='text-muted'>등록된 게임이 없습니다.</li>`
            : list.map(g => `<li class='py-1'>🎮 ${g.name}</li>`).join("")
        );
      }
    } catch {
      $("#gameList").append(`<li class='text-danger'>서버 오류</li>`);
    }
  }

  loadGames(currentPage, keyword);
});
