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

  // 사이드바 게임 목록
  loadSidebarGames(token);

  // 페이징 + 검색
  let currentPage = 0;
  const pageSize = 10;
  let keyword = "";

  async function loadAdmins(page = 0, keyword = "") {
    $("#adminTableBody").html(`<tr><td colspan="6" class="text-center text-muted">로딩 중...</td></tr>`);
    try {
      const body = { page, size: pageSize, keyword };
      const data = await apiRequest("/admin/list", "POST", body, token); // ← POST로 수정 권장
      if (data.success && Array.isArray(data.data)) {
        renderTable(data.data);
        renderPagination(page, data.data.length >= pageSize);
      } else {
        $("#adminTableBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터가 없습니다.</td></tr>`);
      }
    } catch (e) {
      $("#adminTableBody").html(`<tr><td colspan="6" class="text-center text-danger">서버 오류</td></tr>`);
    }
  }

  function renderTable(admins) {
    if (!admins || admins.length === 0) {
      $("#adminTableBody").html(`<tr><td colspan="6" class="text-center text-muted">검색 결과가 없습니다.</td></tr>`);
      return;
    }

    const rows = admins
      .map(
        (a) => `
        <tr class="admin-row" data-id="${a.adminId}">
          <td>${a.adminId}</td>
          <td>${a.adminNm}</td>
          <td>${a.adminEmail}</td>
          <td>${a.adminRole}</td>
          <td>${a.orgId || "-"}</td>
          <td>${a.createdAt ? a.createdAt.split("T")[0] : "-"}</td>
        </tr>`
      )
      .join("");

    $("#adminTableBody").html(rows);

    $(".admin-row").click(function () {
      const adminId = $(this).data("id");
      localStorage.setItem("selectedAdminId", adminId);
      location.href = "admin-detail.html";
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
        loadAdmins(currentPage, keyword);
      }
    });

    $("#nextPage").click(function (e) {
      e.preventDefault();
      currentPage++;
      loadAdmins(currentPage, keyword);
    });
  }

  $("#btnSearch").click(function () {
    keyword = $("#searchKeyword").val();
    currentPage = 0;
    loadAdmins(currentPage, keyword);
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
      } else {
        $("#gameList").append(`<li class='text-danger'>게임 정보를 불러올 수 없습니다.</li>`);
      }
    } catch (e) {
      $("#gameList").append(`<li class='text-danger'>서버 연결 실패</li>`);
    }
  }

  // 초기 로드
  loadAdmins(currentPage, keyword);
});
