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

  // 🔹 상품 목록 조회
  async function loadProducts(page = 0, keyword = "") {
    $("#productTableBody").html(`<tr><td colspan="6" class="text-center text-muted">로딩 중...</td></tr>`);
    try {
      const data = await apiRequest(`/game/${gameId}/product/list?page=${page}&size=${pageSize}&keyword=${keyword}`, "GET", null, token);
      if (data.success && data.data) {
        const { products, totalPages, hasNext, hasPrevious } = data.data;
        renderTable(products);
        renderPagination(page, totalPages, hasNext, hasPrevious);
      } else {
        $("#productTableBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터 없음</td></tr>`);
      }
    } catch {
      $("#productTableBody").html(`<tr><td colspan="6" class="text-danger text-center">서버 오류</td></tr>`);
    }
  }

  // 🔹 테이블 렌더링
  function renderTable(list) {
    if (!list || list.length === 0) {
      $("#productTableBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터 없음</td></tr>`);
      return;
    }

    const rows = list.map(p => `
      <tr data-id="${p.productId}">
        <td>${p.productId}</td>
        <td><input type="text" class="form-control form-control-sm product-name" value="${p.name}"></td>
        <td><input type="number" class="form-control form-control-sm product-price" value="${p.price}"></td>
        <td>${p.type}</td>
        <td>
          <select class="form-select form-select-sm product-status">
            <option value="ON_SALE" ${p.status === "ON_SALE" ? "selected" : ""}>ON_SALE</option>
            <option value="OFF_SALE" ${p.status === "OFF_SALE" ? "selected" : ""}>OFF_SALE</option>
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-primary btnUpdate">수정</button>
          <button class="btn btn-sm btn-danger btnDelete">삭제</button>
        </td>
      </tr>
    `).join("");

    $("#productTableBody").html(rows);

    $(".btnUpdate").click(async function () {
      const row = $(this).closest("tr");
      const id = row.data("id");
      const body = {
        name: row.find(".product-name").val().trim(),
        price: parseInt(row.find(".product-price").val()) || 0,
        status: row.find(".product-status").val()
      };
      if (!body.name) return alert("상품명을 입력해주세요.");
      if (!confirm("수정하시겠습니까?")) return;
      try {
        const res = await apiRequest(`/game/${gameId}/product/${id}`, "PATCH", body, token);
        alert(res.success ? "수정 완료" : "수정 실패");
      } catch { alert("서버 오류"); }
    });

    $(".btnDelete").click(async function () {
      const id = $(this).closest("tr").data("id");
      if (!confirm("정말 삭제하시겠습니까?")) return;
      try {
        const res = await apiRequest(`/game/${gameId}/product/${id}`, "DELETE", null, token);
        if (res.success) {
          alert("삭제 완료");
          loadProducts(currentPage, keyword);
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

    $("#prevPage").click(e => { e.preventDefault(); if (current > 0) loadProducts(current - 1, keyword); });
    $(".page-num").click(e => { e.preventDefault(); loadProducts(parseInt($(e.target).data("page")), keyword); });
    $("#nextPage").click(e => { e.preventDefault(); if (hasNext) loadProducts(current + 1, keyword); });
  }

  // 🔹 검색
  $("#btnSearch").click(() => {
    keyword = $("#searchKeyword").val().trim();
    loadProducts(0, keyword);
  });

  // 🔹 신규 상품 등록
  $("#btnCreateProduct").click(() => $("#createProductModal").modal("show"));

  $("#btnSubmitCreate").click(async function () {
    const req = {
      name: $("#newProductName").val().trim(),
      price: parseInt($("#newProductPrice").val()) || 0,
      type: $("#newProductType").val(),
      status: $("#newProductStatus").val()
    };
    if (!req.name) return alert("상품명을 입력해주세요.");
    try {
      const res = await apiRequest(`/game/${gameId}/product`, "POST", req, token);
      if (res.success) {
        alert("등록 완료");
        $("#createProductModal").modal("hide");
        loadProducts(currentPage, keyword);
      } else alert("등록 실패");
    } catch { alert("서버 오류"); }
  });

  // 초기 로드
  loadProducts(currentPage, keyword);
});
