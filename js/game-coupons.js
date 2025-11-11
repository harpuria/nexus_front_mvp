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

  // 🔹 쿠폰 목록 조회
  async function loadCoupons(page = 0, keyword = "") {
    $("#couponTableBody").html(`<tr><td colspan="6" class="text-center text-muted">로딩 중...</td></tr>`);
    try {
      const data = await apiRequest(`/game/${gameId}/coupon/list?page=${page}&size=${pageSize}&keyword=${keyword}`, "GET", null, token);
      if (data.success && data.data) {
        const { coupons, totalPages, hasNext, hasPrevious } = data.data;
        renderTable(coupons);
        renderPagination(page, totalPages, hasNext, hasPrevious);
      } else {
        $("#couponTableBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터 없음</td></tr>`);
      }
    } catch {
      $("#couponTableBody").html(`<tr><td colspan="6" class="text-danger text-center">서버 오류</td></tr>`);
    }
  }

  // 🔹 테이블 렌더링
  function renderTable(list) {
    if (!list || list.length === 0) {
      $("#couponTableBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터 없음</td></tr>`);
      return;
    }

    const rows = list.map(c => `
      <tr data-id="${c.couponId}">
        <td>${c.couponId}</td>
        <td><input type="text" class="form-control form-control-sm coupon-name" value="${c.name}"></td>
        <td><input type="text" class="form-control form-control-sm coupon-code" value="${c.code}"></td>
        <td><input type="date" class="form-control form-control-sm coupon-expire" value="${c.expireDate?.split("T")[0] || ""}"></td>
        <td>
          <select class="form-select form-select-sm coupon-status">
            <option value="ACTIVE" ${c.status === "ACTIVE" ? "selected" : ""}>ACTIVE</option>
            <option value="INACTIVE" ${c.status === "INACTIVE" ? "selected" : ""}>INACTIVE</option>
            <option value="EXPIRED" ${c.status === "EXPIRED" ? "selected" : ""}>EXPIRED</option>
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-primary btnUpdate">수정</button>
          <button class="btn btn-sm btn-danger btnDelete">삭제</button>
        </td>
      </tr>
    `).join("");

    $("#couponTableBody").html(rows);

    // 수정
    $(".btnUpdate").click(async function () {
      const row = $(this).closest("tr");
      const id = row.data("id");
      const body = {
        name: row.find(".coupon-name").val().trim(),
        code: row.find(".coupon-code").val().trim(),
        expireDate: row.find(".coupon-expire").val(),
        status: row.find(".coupon-status").val()
      };
      if (!confirm("수정하시겠습니까?")) return;
      try {
        const res = await apiRequest(`/game/${gameId}/coupon/${id}`, "PATCH", body, token);
        alert(res.success ? "수정 완료" : "수정 실패");
      } catch { alert("서버 오류"); }
    });

    // 삭제
    $(".btnDelete").click(async function () {
      const id = $(this).closest("tr").data("id");
      if (!confirm("정말 삭제하시겠습니까?")) return;
      try {
        const res = await apiRequest(`/game/${gameId}/coupon/${id}`, "DELETE", null, token);
        if (res.success) {
          alert("삭제 완료");
          loadCoupons(currentPage, keyword);
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

    $("#prevPage").click(e => { e.preventDefault(); if (current > 0) loadCoupons(current - 1, keyword); });
    $(".page-num").click(e => { e.preventDefault(); loadCoupons(parseInt($(e.target).data("page")), keyword); });
    $("#nextPage").click(e => { e.preventDefault(); if (hasNext) loadCoupons(current + 1, keyword); });
  }

  // 🔹 검색
  $("#btnSearch").click(() => {
    keyword = $("#searchKeyword").val().trim();
    loadCoupons(0, keyword);
  });

  // 🔹 신규 쿠폰 등록
  $("#btnCreateCoupon").click(() => $("#createCouponModal").modal("show"));

  $("#btnSubmitCreate").click(async function () {
    const req = {
      name: $("#newCouponName").val().trim(),
      code: $("#newCouponCode").val().trim(),
      expireDate: $("#newCouponExpire").val(),
      status: $("#newCouponStatus").val()
    };
    if (!req.name || !req.code) return alert("쿠폰명과 코드를 입력해주세요.");
    try {
      const res = await apiRequest(`/game/${gameId}/coupon`, "POST", req, token);
      if (res.success) {
        alert("등록 완료");
        $("#createCouponModal").modal("hide");
        loadCoupons(currentPage, keyword);
      } else alert("등록 실패");
    } catch { alert("서버 오류"); }
  });

  // 초기 로드
  loadCoupons(currentPage, keyword);
});
