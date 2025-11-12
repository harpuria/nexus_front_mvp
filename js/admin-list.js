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
  let direction = "ASC";

  // ✅ 관리자 목록 조회 (AdminListResponseDto 구조 반영)
  async function loadAdmins(page = 0, keyword = "") {
    $("#adminTableBody").html(`<tr><td colspan="6" class="text-center text-muted">로딩 중...</td></tr>`);

    try {
      const url = `/admin/list?page=${page}&size=${pageSize}&keyword=${keyword}&direction=${direction}`;
      const data = await apiRequest(url, "GET", null, token);

      if (data.success && data.data) {
        const { admins, page: pageNum, totalPages, hasNext, hasPrevious, totalCount } = data.data;
        renderTable(admins);
        renderPagination(pageNum, totalPages, hasNext, hasPrevious);
        $("#adminTotalCount").text(`총 ${totalCount.toLocaleString()}건`);
      } else {
        $("#adminTableBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터가 없습니다.</td></tr>`);
      }
    } catch (e) {
      $("#adminTableBody").html(`<tr><td colspan="6" class="text-center text-danger">서버 오류</td></tr>`);
    }
  }

  // ✅ 테이블 렌더링
  function renderTable(admins) {
    if (!admins || admins.length === 0) {
      $("#adminTableBody").html(`<tr><td colspan="6" class="text-center text-muted">검색 결과가 없습니다.</td></tr>`);
      return;
    }
  
    const rows = admins.map(a => `
      <tr class="admin-row" style="cursor:pointer;" data-id="${a.adminId}">
        <td>${a.adminId}</td>
        <td>${a.adminNm}</td>
        <td>${a.adminEmail}</td>
        <td>${a.adminRole}</td>
        <td>${a.orgId || "-"}</td>
        <td>${a.createdAt ? a.createdAt.split("T")[0] : "-"}</td>
      </tr>`).join("");
  
    $("#adminTableBody").html(rows);
  
    $(".admin-row").click(function () {
      const adminId = $(this).data("id");
      localStorage.setItem("selectedAdminId", adminId);
      location.href = "admin-detail.html";
    });
  }

  // ✅ 페이징 렌더링
  function renderPagination(currentPage, totalPages, hasNext, hasPrevious) {
    const maxVisible = 5; // 한 번에 보여줄 페이지 수
    const startPage = Math.floor(currentPage / maxVisible) * maxVisible;
    const endPage = Math.min(startPage + maxVisible, totalPages);
  
    let html = "";
  
    // 이전 버튼
    html += `
      <li class="page-item ${!hasPrevious ? "disabled" : ""}">
        <a class="page-link" href="#" id="prevPage">이전</a>
      </li>
    `;
  
    // 페이지 번호
    for (let i = startPage; i < endPage; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link page-num" href="#" data-page="${i}">${i + 1}</a>
        </li>
      `;
    }
  
    // 다음 버튼
    html += `
      <li class="page-item ${!hasNext ? "disabled" : ""}">
        <a class="page-link" href="#" id="nextPage">다음</a>
      </li>
    `;
  
    $("#pagination").html(html);
  
    // 이전 버튼 이벤트
    $("#prevPage").click(function (e) {
      e.preventDefault();
      if (currentPage > 0) {
        currentPage = Math.max(0, currentPage - 1);
        loadAdmins(currentPage, keyword);
      }
    });
  
    // 페이지 번호 클릭 이벤트
    $(".page-num").click(function (e) {
      e.preventDefault();
      const page = parseInt($(this).data("page"));
      currentPage = page;
      loadAdmins(currentPage, keyword);
    });
  
    // 다음 버튼 이벤트
    $("#nextPage").click(function (e) {
      e.preventDefault();
      if (currentPage < totalPages - 1) {
        currentPage++;
        loadAdmins(currentPage, keyword);
      }
    });

    // 신규 관리자 생성 버튼 이벤트
    $("#btnCreateAdmin").click(() => {
      $("#createAdminModal").modal("show");
    });

    // 신규 관리자 생성 제출 버튼 이벤트
    $("#btnCreateAdminSubmit").click(async function () {
      const req = {
        loginId: $("#newLoginId").val().trim(),
        loginPw: $("#newLoginPw").val().trim(),
        adminEmail: $("#newAdminEmail").val().trim(),
        adminNm: $("#newAdminNm").val().trim(),
        adminRole: $("#newAdminRole").val(),
        orgId: adminInfo.orgId
      };
    
      if (!req.loginId || !req.loginPw || !req.adminEmail || !req.adminNm) {
        alert("모든 항목을 입력해주세요.");
        return;
      }
    
      try {
        const res = await apiRequest("/admin", "POST", req, token);
        if (res.success) {
          alert("관리자가 등록되었습니다.");
          $("#createAdminModal").modal("hide");
          loadAdmins(currentPage, keyword); // 목록 새로고침
        } else {
          alert("등록 실패: " + (res.message || "서버 오류"));
        }
      } catch (e) {
        alert("서버 연결 실패");
      }
    });
    
    
  }
  

  // ✅ 검색 버튼 클릭
  $("#btnSearch").click(function () {
    keyword = $("#searchKeyword").val().trim();
    currentPage = 0;
    loadAdmins(currentPage, keyword);
  });

  // ✅ 사이드바 게임 목록 로드
  async function loadSidebarGames(token) {
    try {
      const data = await apiRequest("/game/list", "GET", null, token);
      if (!data.success) {
        $("#gameList").html(`<li class='text-danger'>게임 정보를 불러올 수 없습니다.</li>`);
        return;
      }

      const list = data.data.games || [];
      if (list.length === 0) {
        $("#gameList").html(`<li class='text-muted'>등록된 게임이 없습니다.</li>`);
        return;
      }

      const items = list.map(
        g => `<li class="py-1 sidebar-game-link" data-id="${g.gameId}" style="cursor:pointer;">🎮 ${g.name}</li>`
      ).join("");

      $("#gameList").html(items);
      $(".sidebar-game-link").click(function () {
        const gameId = $(this).data("id");
        localStorage.setItem("selectedGameId", gameId);
        location.href = "game-manage.html";
      });
    } catch (e) {
      $("#gameList").html(`<li class='text-danger'>서버 연결 실패</li>`);
    }
  }

  // ✅ 초기 로드
  loadAdmins(currentPage, keyword);
});
