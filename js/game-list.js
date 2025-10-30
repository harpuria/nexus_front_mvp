$(document).ready(function () {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "index.html";
    return;
  }

  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
  $("#adminName").text(adminInfo.adminNm || "Admin");

  // 로그아웃
  $("#btnLogout").click(() => {
    localStorage.clear();
    location.href = "index.html";
  });

  // 사이드바의 게임 목록 (좌측 하단)
  loadSidebarGames(token);

  // 페이징 & 검색
  let currentPage = 0;
  const pageSize = 10;
  let keyword = "";

  async function loadGames(page = 0, keyword = "") {
    $("#gameTableBody").html(`<tr><td colspan="6" class="text-center text-muted">로딩 중...</td></tr>`);

    try {
      const query = new URLSearchParams({ page, size: pageSize }).toString();
      const data = await apiRequest(`/game/list?${query}`, "GET", null, token);

      if (data.success && data.data && Array.isArray(data.data.games)) {
        const list = data.data.games.filter(g => 
          !keyword || g.name.toLowerCase().includes(keyword.toLowerCase())
        );
        renderTable(list);
        renderPagination(page, data.data.hasNext);
      } else {
        $("#gameTableBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터가 없습니다.</td></tr>`);
      }
    } catch (e) {
      $("#gameTableBody").html(`<tr><td colspan="6" class="text-center text-danger">서버 오류</td></tr>`);
    }
  }

  function renderTable(games) {
    if (!games || games.length === 0) {
      $("#gameTableBody").html(`<tr><td colspan="6" class="text-center text-muted">검색 결과가 없습니다.</td></tr>`);
      return;
    }

    const rows = games
      .map(
        (g) => `
        <tr class="game-row" data-id="${g.gameId}">
          <td>${g.gameId}</td>
          <td>${g.name}</td>
          <td>${g.status}</td>
          <td>${g.version}</td>
          <td>${g.orgId}</td>
          <td>${g.createdAt ? g.createdAt.split("T")[0] : "-"}</td>
        </tr>`
      )
      .join("");

    $("#gameTableBody").html(rows);

    // 행 클릭 시 상세 페이지 이동
    $(".game-row").click(function () {
      const gameId = $(this).data("id");
      localStorage.setItem("selectedGameId", gameId);
      location.href = "game-detail.html";
    });
  }

  function renderPagination(current, hasNext) {
    const prevDisabled = current === 0 ? "disabled" : "";
    const nextDisabled = !hasNext ? "disabled" : "";

    $("#pagination").html(`
      <li class="page-item ${prevDisabled}">
        <a class="page-link" href="#" id="prevPage">이전</a>
      </li>
      <li class="page-item active"><span class="page-link">${current + 1}</span></li>
      <li class="page-item ${nextDisabled}">
        <a class="page-link" href="#" id="nextPage">다음</a>
      </li>
    `);

    $("#prevPage").click(function (e) {
      e.preventDefault();
      if (current > 0) {
        currentPage--;
        loadGames(currentPage, keyword);
      }
    });

    $("#nextPage").click(function (e) {
      e.preventDefault();
      currentPage++;
      loadGames(currentPage, keyword);
    });
  }

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
        if (list.length === 0) {
          $("#gameList").append(`<li class='text-muted'>등록된 게임이 없습니다.</li>`);
        } else {
          list.forEach(g => $("#gameList").append(`<li class='py-1'>🎮 ${g.name}</li>`));
        }
      }
    } catch (e) {
      $("#gameList").append(`<li class='text-danger'>서버 오류</li>`);
    }
  }

  // 초기 로드
  loadGames(currentPage, keyword);
});
