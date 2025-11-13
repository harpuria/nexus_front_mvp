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

  // 🔹 재화 목록 조회
  async function loadCurrencies(page = 0, keyword = "") {
    $("#currencyTableBody").html(`<tr><td colspan="5" class="text-center text-muted">로딩 중...</td></tr>`);
    try {
      const data = await apiRequest(`/currency/list/${gameId}?page=${page}&size=${pageSize}&keyword=${keyword}`, "GET", null, token);
      if (data.success && data.data) {
        const { currencies, totalPages, hasNext, hasPrevious } = data.data;
        renderTable(currencies);
        renderPagination(page, totalPages, hasNext, hasPrevious);
      } else {
        $("#currencyTableBody").html(`<tr><td colspan="5" class="text-center text-muted">데이터 없음</td></tr>`);
      }
    } catch {
      $("#currencyTableBody").html(`<tr><td colspan="5" class="text-danger text-center">서버 오류</td></tr>`);
    }
  }

  // 🔹 테이블 렌더링
  function renderTable(list) {
    if (!list || list.length === 0) {
      $("#currencyTableBody").html(`<tr><td colspan="5" class="text-center text-muted">데이터 없음</td></tr>`);
      return;
    }

    const rows = list.map(c => `
      <tr data-id="${c.currencyId}">
        <td>${c.currencyId}</td>
        <td><input type="text" class="form-control form-control-sm currency-name" value="${c.name}"></td>
        <td><input type="number" class="form-control form-control-sm currency-max" value="${c.maxAmount ?? c.max_amount ?? ""}"></td>
        <td><input type="text" class="form-control form-control-sm currency-desc" value="${c.desc ?? c.description ?? ""}"></td>
        <td>
          <button class="btn btn-sm btn-primary btnUpdate">수정</button>
          <button class="btn btn-sm btn-danger btnDelete">삭제</button>
        </td>
      </tr>
    `).join("");

    $("#currencyTableBody").html(rows);

    // 수정 이벤트
    $(".btnUpdate").click(async function () {
      const row = $(this).closest("tr");
      const id = row.data("id");
      const body = {
        name: row.find(".currency-name").val(),
        maxAmount: parseInt(row.find(".currency-max").val()) || 0,
        max_amount: parseInt(row.find(".currency-max").val()) || 0,
        desc: row.find(".currency-desc").val(),
        description: row.find(".currency-desc").val()
      };
      if (!confirm("수정하시겠습니까?")) return;
      try {
        const res = await apiRequest(`/game/${gameId}/currency/${id}`, "PATCH", body, token);
        alert(res.success ? "수정 완료" : "수정 실패");
      } catch { alert("서버 오류"); }
    });

    // 삭제 이벤트
    $(".btnDelete").click(async function () {
      const id = $(this).closest("tr").data("id");
      if (!confirm("정말 삭제하시겠습니까?")) return;
      try {
        const res = await apiRequest(`/game/${gameId}/currency/${id}`, "DELETE", null, token);
        if (res.success) {
          alert("삭제 완료");
          loadCurrencies(currentPage, keyword);
        } else alert("삭제 실패");
      } catch { alert("서버 오류"); }
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

    $("#prevPage").click(e => { e.preventDefault(); if (current > 0) loadCurrencies(current - 1, keyword); });
    $(".page-num").click(e => { e.preventDefault(); loadCurrencies(parseInt($(e.target).data("page")), keyword); });
    $("#nextPage").click(e => { e.preventDefault(); if (hasNext) loadCurrencies(current + 1, keyword); });
  }

  // 🔹 검색
  $("#btnSearch").click(() => {
    keyword = $("#searchKeyword").val().trim();
    loadCurrencies(0, keyword);
  });

  // 🔹 신규 재화 등록
  $("#btnCreateCurrency").click(() => $("#createCurrencyModal").modal("show"));

  $("#btnSubmitCreate").click(async function () {
    const maxValue = parseInt($("#newCurrencyMax").val()) || 0;
    const description = $("#newCurrencyDesc").val().trim();
    const req = {
      gameId: gameId,
      name: $("#newCurrencyName").val().trim(),
      maxAmount: maxValue,
      max_amount: maxValue,
      desc: description,
      createdBy:adminInfo.loginId
    };
    if (!req.name) return alert("재화 이름을 입력해주세요.");
    try {
      const res = await apiRequest(`/currency`, "POST", req, token);
      if (res.success) {
        alert("등록 완료");
        $("#createCurrencyModal").modal("hide");
        loadCurrencies(currentPage, keyword);
      } else alert("등록 실패");
    } catch { alert("서버 오류"); }
  });

  // 초기 로드
  loadCurrencies(currentPage, keyword);
});
