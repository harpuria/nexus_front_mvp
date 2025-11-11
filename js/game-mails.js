$(function () {
  const token  = localStorage.getItem("accessToken");
  const gameId = localStorage.getItem("selectedGameId");
  if (!token || !gameId) { alert("잘못된 접근입니다."); location.href="index.html"; return; }

  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
  $("#adminName").text(adminInfo.adminNm || "Admin");
  $("#btnLogout").click(() => { localStorage.clear(); location.href="index.html"; });

  // ---------- 상태 ----------
  let outboxPage = 0, outboxSize = 10, outboxKeyword = "";
  let tplPage = 0, tplSize = 10;

  // ---------- 유틸 ----------
  const q = (s)=>document.querySelector(s);

  // ---------- 발송 이력 로드 ----------
  async function loadOutbox(page = 0, keyword = "") {
    $("#outboxBody").html(`<tr><td colspan="6" class="text-center text-muted">로딩 중...</td></tr>`);
    try {
      const res = await apiRequest(`/game/${gameId}/mail/list?page=${page}&size=${outboxSize}&keyword=${encodeURIComponent(keyword)}`, "GET", null, token);
      if (res.success && res.data) {
        const { mails, totalPages, hasNext, hasPrevious } = res.data;
        renderOutbox(mails);
        renderPagination("#paginationOutbox", page, totalPages, hasNext, hasPrevious, (p)=>{ outboxPage=p; loadOutbox(outboxPage, outboxKeyword); });
      } else {
        $("#outboxBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터 없음</td></tr>`);
      }
    } catch {
      $("#outboxBody").html(`<tr><td colspan="6" class="text-danger text-center">서버 오류</td></tr>`);
    }
  }

  function renderOutbox(list = []) {
    if (!list.length) { $("#outboxBody").html(`<tr><td colspan="6" class="text-center text-muted">데이터 없음</td></tr>`); return; }
    const rows = list.map(m => `
      <tr>
        <td>${m.mailId}</td>
        <td>${escapeHtml(m.title)}</td>
        <td>${m.targetType}${m.userCount ? ` (${m.userCount}명)` : ""}</td>
        <td>${m.status || "-"}</td>
        <td>${m.sentAt ? m.sentAt.split("T")[0] : "-"}</td>
        <td class="small-muted">${m.errorMsg || "-"}</td>
      </tr>
    `).join("");
    $("#outboxBody").html(rows);
  }

  // ---------- 템플릿 로드 ----------
  async function loadTemplates(page = 0) {
    $("#templateBody").html(`<tr><td colspan="4" class="text-center text-muted">로딩 중...</td></tr>`);
    try {
      const res = await apiRequest(`/game/${gameId}/mail/template/list?page=${page}&size=${tplSize}`, "GET", null, token);
      if (res.success && res.data) {
        const { templates, totalPages, hasNext, hasPrevious } = res.data;
        renderTemplates(templates);
        renderPagination("#paginationTpl", page, totalPages, hasNext, hasPrevious, (p)=>{ tplPage=p; loadTemplates(tplPage); });
        // 새 메일 모달 템플릿 선택도 채우기
        fillComposeTemplateSelect(templates, page===0);
      } else {
        $("#templateBody").html(`<tr><td colspan="4" class="text-center text-muted">데이터 없음</td></tr>`);
      }
    } catch {
      $("#templateBody").html(`<tr><td colspan="4" class="text-danger text-center">서버 오류</td></tr>`);
    }
  }

  function renderTemplates(list = []) {
    if (!list.length) { $("#templateBody").html(`<tr><td colspan="4" class="text-center text-muted">데이터 없음</td></tr>`); return; }
    const rows = list.map(t => `
      <tr data-id="${t.templateId}">
        <td>${t.templateId}</td>
        <td>${escapeHtml(t.name)}</td>
        <td>${escapeHtml(t.title)}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary btnTplEdit">수정</button>
        </td>
      </tr>
    `).join("");
    $("#templateBody").html(rows);

    $(".btnTplEdit").click(function(){
      const tr = $(this).closest("tr");
      const id = tr.data("id");
      const name = tr.children().eq(1).text();
      const title = tr.children().eq(2).text();
      openTemplateModal({ templateId:id, name, title, content:"" }, true);
      // 내용은 상세호출이 필요하면 여기에 추가 호출: GET /mail/template/{id}
    });
  }

  function fillComposeTemplateSelect(templates = [], reset=false) {
    const sel = $("#composeTemplate");
    if (reset) sel.html(`<option value="">(선택 안 함)</option>`);
    templates.forEach(t => sel.append(`<option value="${t.templateId}" data-title="${escapeHtml(t.title)}">${escapeHtml(t.name)}</option>`));
  }

  // ---------- 페이지네이션 공통 ----------
  function renderPagination(containerSel, current, totalPages, hasNext, hasPrevious, onClick) {
    const maxVisible = 5;
    const start = Math.floor(current / maxVisible) * maxVisible;
    const end = Math.min(start + maxVisible, totalPages);
    let html = "";

    html += `<li class="page-item ${!hasPrevious ? "disabled" : ""}">
      <a class="page-link" href="#" data-nav="prev">이전</a></li>`;

    for (let i = start; i < end; i++) {
      html += `<li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" href="#" data-page="${i}">${i + 1}</a></li>`;
    }

    html += `<li class="page-item ${!hasNext ? "disabled" : ""}">
      <a class="page-link" href="#" data-nav="next">다음</a></li>`;

    const $c = $(containerSel);
    $c.html(html);

    $c.find("[data-nav='prev']").click(e => { e.preventDefault(); if (current>0) onClick(current-1); });
    $c.find("[data-page]").click(e => { e.preventDefault(); onClick(parseInt($(e.target).data("page"))); });
    $c.find("[data-nav='next']").click(e => { e.preventDefault(); if (current < totalPages-1) onClick(current+1); });
  }

  // ---------- 검색 ----------
  $("#btnSearch").click(() => {
    outboxKeyword = $("#searchKeyword").val().trim();
    outboxPage = 0;
    loadOutbox(outboxPage, outboxKeyword);
  });

  // ---------- 새 메일 작성 ----------
  $("#btnOpenCompose").click(async () => {
    // 템플릿 드롭다운 최신화
    await loadTemplates(0);
    $("#composeTitle").val("");
    $("#composeContent").val("");
    $("#composeTemplate").val("");
    $("#composeTargetType").val("ALL").trigger("change");
    $("#composeUserIds").val("");
    $("#composeModal").modal("show");
  });

  $("#composeTargetType").on("change", function(){
    const show = $(this).val() === "USER_ID";
    $("#composeUserIdsWrap").toggle(show);
  });

  $("#composeTemplate").on("change", function(){
    const tplId = $(this).val();
    if (!tplId) return;
    // 간단 매핑(빠른 반영) — 필요하면 상세 API 호출하여 본문 채우기
    const title = $(this).find("option:selected").data("title") || "";
    $("#composeTitle").val(title);
    // 본문은 템플릿 상세가 필요하다면 GET /mail/template/{id} 로 가져와 세팅하세요.
  });

  $("#btnSendMail").click(async function(){
    const targetType = $("#composeTargetType").val();
    const userIds = $("#composeUserIds").val().trim();
    const req = {
      title: $("#composeTitle").val().trim(),
      content: $("#composeContent").val().trim(),
      targetType,                    // "ALL" | "USER_ID"
      userIds: targetType==="USER_ID" ? splitIds(userIds) : []
    };
    if (!req.title || !req.content) return alert("제목과 내용을 입력해주세요.");
    if (targetType === "USER_ID" && req.userIds.length === 0) return alert("유저 ID를 입력해주세요.");

    if (!confirm("메일을 발송하시겠습니까?")) return;

    try {
      const res = await apiRequest(`/game/${gameId}/mail`, "POST", req, token);
      if (res.success) {
        alert("발송 요청이 접수되었습니다.");
        $("#composeModal").modal("hide");
        loadOutbox(outboxPage, outboxKeyword);
      } else {
        alert("발송 실패: " + (res.message || "오류"));
      }
    } catch { alert("서버 오류"); }
  });

  // ---------- 템플릿 등록/수정 ----------
  $("#btnOpenTemplateCreate").click(() => openTemplateModal(null, false));

  $("#btnTplSave").click(async function(){
    const id = $("#tplId").val();
    const body = {
      name: $("#tplName").val().trim(),
      title: $("#tplTitle").val().trim(),
      content: $("#tplContent").val().trim()
    };
    if (!body.name || !body.title || !body.content) return alert("이름/제목/내용을 모두 입력해주세요.");

    try {
      if (id) {
        // 수정
        const res = await apiRequest(`/game/${gameId}/mail/template/${id}`, "PATCH", body, token);
        if (res.success) {
          alert("템플릿이 수정되었습니다.");
          $("#templateModal").modal("hide");
          loadTemplates(tplPage);
        } else alert("수정 실패");
      } else {
        // 등록
        const res = await apiRequest(`/game/${gameId}/mail/template`, "POST", body, token);
        if (res.success) {
          alert("템플릿이 등록되었습니다.");
          $("#templateModal").modal("hide");
          tplPage = 0;
          loadTemplates(tplPage);
        } else alert("등록 실패");
      }
    } catch { alert("서버 오류"); }
  });

  $("#btnTplDelete").click(async function(){
    const id = $("#tplId").val();
    if (!id) return;
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    try {
      const res = await apiRequest(`/game/${gameId}/mail/template/${id}`, "DELETE", null, token);
      if (res.success) {
        alert("삭제되었습니다.");
        $("#templateModal").modal("hide");
        loadTemplates(tplPage);
      } else alert("삭제 실패");
    } catch { alert("서버 오류"); }
  });

  function openTemplateModal(tpl, isEdit){
    $("#templateModalTitle").text(isEdit ? "템플릿 수정" : "템플릿 등록");
    $("#tplId").val(tpl?.templateId || "");
    $("#tplName").val(tpl?.name || "");
    $("#tplTitle").val(tpl?.title || "");
    $("#tplContent").val(tpl?.content || "");
    $("#btnTplDelete").toggle(!!isEdit);
    $("#templateModal").modal("show");
  }

  // ---------- 헬퍼 ----------
  function splitIds(text){
    return text.split(/[\s,]+/).map(x=>x.trim()).filter(Boolean);
  }
  function escapeHtml(s=""){
    return s.replace(/[&<>"']/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
  }

  // 초기 로드
  loadOutbox(outboxPage, outboxKeyword);
  loadTemplates(tplPage);
});
