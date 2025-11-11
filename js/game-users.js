$(document).ready(function () {
  const token = localStorage.getItem("accessToken");
  const gameId = localStorage.getItem("selectedGameId");
  if (!token || !gameId) {
    alert("잘못된 접근입니다.");
    location.href = "index.html";
    return;
  }

  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
  $("#adminName").text(adminInfo.adminNm || "Admin");

  $("#btnLogout").click(() => {
    localStorage.clear();
    location.href = "index.html";
  });

  let currentPage = 0;
  const pageSize = 10;
  let keyword = "";

  // 🔹 목록 조회
  async function loadList(page = 0, keyword = "") {
    $("#tableBody").html(`<tr><td colspan="5" class="text-center text-muted">로딩 중...</td></tr>`);
    try {
      const data = await apiRequest(`/game/${gameId}/user/list?page=${page}&size=${pageSize}&keyword=${keyword}`, "GET", null, token);
      if (data.success && data.data) {
        const { users, totalPages, hasNext, hasPrevious } = data.data;
        renderTable(users);
        renderPagination(page, totalPages, hasNext, hasPrevious);
      } else {
        $("#tableBody").html(`<tr><td colspan="5" class="text-center text-muted">데이터가 없습니다.</td></tr>`);
      }
    } catch {
      $("#tableBody").html(`<tr><td colspan="5" class="text-center text-danger">서버 오류</td></tr>`);
    }
  }

  // 🔹 테이블 렌더링
  function renderTable(users) {
    if (!users || users.length === 0) {
      $("#tableBody").html(`<tr><td colspan="5" class="text-center text-muted">검색 결과가 없습니다.</td></tr>`);
      return;
    }

    const rows = users.map(u => `
      <tr class="row-click" data-id="${u.userId}" style="cursor:pointer;">
        <td>${u.userId}</td>
        <td>${u.nickname}</td>
        <td>${u.level}</td>
        <td>${u.createdAt?.split("T")[0] || "-"}</td>
        <td>${u.status}</td>
      </tr>
    `).join("");

    $("#tableBody").html(rows);

    $(".row-click").click(function () {
      const userId = $(this).data("id");
      localStorage.setItem("selectedUserId", userId);
      location.href = "game-user-detail.html";
    });
  }

  // 🔹 페이지네이션
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

    $("#prevPage").click(e => {
      e.preventDefault();
      if (current > 0) {
        currentPage--;
        loadList(currentPage, keyword);
      }
    });

    $(".page-num").click(e => {
      e.preventDefault();
      const page = parseInt($(e.target).data("page"));
      currentPage = page;
      loadList(currentPage, keyword);
    });

    $("#nextPage").click(e => {
      e.preventDefault();
      if (hasNext) {
        currentPage++;
        loadList(currentPage, keyword);
      }
    });
  }

  // 🔹 검색
  $("#btnSearch").click(() => {
    keyword = $("#searchKeyword").val().trim();
    currentPage = 0;
    loadList(currentPage, keyword);
  });

  // 🔹 신규 생성 모달
  $("#btnCreate").click(() => $("#createModal").modal("show"));

  // 🔹 신규 유저 생성
  $("#btnSubmitCreate").click(async function () {
    const req = {
      nickname: $("#newName").val().trim(),
      level: parseInt($("#newLevel").val()) || 1,
      status: $("#newStatus").val(),
    };

    if (!req.nickname) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      const res = await apiRequest(`/game/${gameId}/user`, "POST", req, token);
      if (res.success) {
        alert("유저가 등록되었습니다.");
        $("#createModal").modal("hide");
        loadList(currentPage, keyword);
      } else {
        alert("등록 실패: " + (res.message || "오류"));
      }
    } catch {
      alert("서버 연결 실패");
    }
  });

  loadList(currentPage, keyword);
});
