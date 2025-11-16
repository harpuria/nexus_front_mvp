$(document).ready(async function () {
  const token = localStorage.getItem("accessToken");
  const gameId = localStorage.getItem("selectedGameId");
  const userId = localStorage.getItem("selectedUserId");

  if (!token || !gameId || !userId) {
    alert("잘못된 접근입니다.");
    location.href = "game-users.html";
    return;
  }

  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
  $("#adminName").text(adminInfo.adminNm || "Admin");

  $("#btnLogout").click(() => {
    localStorage.clear();
    location.href = "index.html";
  });

  $("#btnBack").click(() => location.href = "game-users.html");

  const blockModalElement = document.getElementById("blockUserModal");
  const blockModal = blockModalElement ? new bootstrap.Modal(blockModalElement) : null;
  let currentUser = null;

  const formatDate = (value) => value ? value.split("T")[0] : "-";
  const toKstMidnightIso = (dateStr) => dateStr ? `${dateStr}T00:00:00+09:00` : null;
  const fallbackText = (value) => {
    if (value === null || value === undefined) return "-";
    const text = String(value).trim();
    return text.length ? text : "-";
  };

  async function loadUserDetail() {
    try {
      const res = await apiRequest(`/game-user/${gameId}/${userId}`, "GET", null, token);
      if (res.success && res.data) {
        const u = res.data;
        currentUser = u;
        $("#userId").val(u.userId || "-");
        $("#nickname").val(u.nickname || "");
        $("#device").val(fallbackText(u.device));
        $("#socialId").val(fallbackText(u.socialId));
        $("#blockStartDate").val(formatDate(u.blockStartDate));
        $("#blockEndDate").val(formatDate(u.blockEndDate));
        $("#blockReason").val(fallbackText(u.blockReason));
        $("#withdrawalDate").val(formatDate(u.withdrawalDate));
        $("#withdrawalReason").val(fallbackText(u.withdrawalReason));
      } else {
        alert("유저 정보를 불러올 수 없습니다.");
      }
    } catch {
      alert("유저 정보를 불러올 수 없습니다.");
    }
  }

  await loadUserDetail();

  // ✅ 유저 수정
  $("#btnUpdateUser").click(async function () {
    const body = {
      nickname: $("#nickname").val().trim()
    };
    if (!body.nickname) return alert("닉네임을 입력해주세요.");
    if (!confirm("유저 정보를 수정하시겠습니까?")) return;
    try {
      const res = await apiRequest(`/game-user/${gameId}/${userId}`, "PATCH", body, token);
      alert(res.success ? "수정 완료" : "수정 실패: " + (res.message || "오류"));
    } catch { alert("서버 오류"); }
  });

  // ✅ 유저 삭제
  $("#btnDeleteUser").click(async function () {
    if (!confirm("정말로 이 유저를 삭제하시겠습니까?")) return;
    try {
      const res = await apiRequest(`/game-user/${gameId}/${userId}`, "DELETE", null, token);
      if (res.success) {
        alert("삭제 완료");
        location.href = "game-users.html";
      } else alert("삭제 실패");
    } catch { alert("서버 오류"); }
  });

  $("#btnOpenBlockModal").click(() => {
    if (!blockModal) return;
    const today = new Date().toISOString().split("T")[0];
    const defaultStart = currentUser?.blockStartDate ? formatDate(currentUser.blockStartDate) : today;
    $("#modalBlockStartDate").val($("#modalBlockStartDate").val() || defaultStart);
    $("#modalBlockDays").val($("#modalBlockDays").val() || 1);
    const reasonPreset = $("#blockReason").val();
    $("#modalBlockReason").val(reasonPreset === "-" ? "" : reasonPreset);
    blockModal.show();
  });

  $("#btnSaveBlock").click(async () => {
    if (!blockModal) return;
    const blockStartDate = $("#modalBlockStartDate").val();
    const blockDays = parseInt($("#modalBlockDays").val(), 10);
    const blockReason = $("#modalBlockReason").val().trim();
    if (!blockStartDate) return alert("정지 시작일을 선택해주세요.");
    if (!blockDays || blockDays < 1) return alert("정지 기간은 1일 이상이어야 합니다.");
    if (!blockReason) return alert("정지 사유를 입력해주세요.");
    const body = {
      blockStartDate: toKstMidnightIso(blockStartDate),
      blockReason: blockReason,
      updatedBy: adminInfo.loginId || "admin",
      blockDay: blockDays
    };
    if (!confirm("해당 정보로 접속 정지를 설정하시겠습니까?")) return;
    try {
      const res = await apiRequest(`/game-user/block/${userId}`, "PATCH", body, token);
      if (res.success) {
        alert("접속 정지 정보가 저장되었습니다.");
        await loadUserDetail();
        blockModal.hide();
      } else {
        alert(res.message || "저장 실패");
      }
    } catch {
      alert("서버 오류");
    }
  });

  // ✅ 재화, 인벤토리, 로그 불러오기
  loadCurrency(); loadInventory(); loadLogs();

  async function loadCurrency() {
    try {
      const res = await apiRequest(`/game/${gameId}/user/${userId}/currency`, "GET", null, token);
      if (res.success && res.data?.length) {
        $("#currencyBody").html(res.data.map(c => `<tr><td>${c.name}</td><td>${c.amount}</td></tr>`).join(""));
      } else $("#currencyBody").html(`<tr><td colspan="2" class="text-center text-muted">데이터 없음</td></tr>`);
    } catch { $("#currencyBody").html(`<tr><td colspan="2" class="text-danger text-center">로드 실패</td></tr>`); }
  }

  async function loadInventory() {
    try {
      const res = await apiRequest(`/game/${gameId}/user/${userId}/inventory`, "GET", null, token);
      if (res.success && res.data?.length) {
        $("#inventoryBody").html(res.data.map(i => `<tr><td>${i.itemName}</td><td>${i.quantity}</td></tr>`).join(""));
      } else $("#inventoryBody").html(`<tr><td colspan="2" class="text-center text-muted">데이터 없음</td></tr>`);
    } catch { $("#inventoryBody").html(`<tr><td colspan="2" class="text-danger text-center">로드 실패</td></tr>`); }
  }

  async function loadLogs() {
    try {
      const res = await apiRequest(`/game/${gameId}/user/${userId}/logs`, "GET", null, token);
      if (res.success && res.data?.length) {
        $("#logList").html(res.data.map(l => `<li class="list-group-item">${l.action} - ${l.timestamp?.split("T")[0]}</li>`).join(""));
      } else $("#logList").html(`<li class="list-group-item text-muted text-center">데이터 없음</li>`);
    } catch { $("#logList").html(`<li class="list-group-item text-danger text-center">로드 실패</li>`); }
  }

  // ✅ 운영 액션: 보상 지급
  $("#btnSendReward").click(async function () {
    const req = {
      type: $("#rewardType").val(),
      name: $("#rewardName").val().trim(),
      amount: parseInt($("#rewardAmount").val()) || 1
    };
    if (!req.name) return alert("보상명을 입력해주세요.");
    if (!confirm(`"${req.name}" ${req.amount}개를 지급하시겠습니까?`)) return;
    try {
      const res = await apiRequest(`/game/${gameId}/user/${userId}/reward`, "POST", req, token);
      alert(res.success ? "보상 지급 완료" : "실패: " + (res.message || "오류"));
    } catch { alert("서버 오류"); }
  });

  // ✅ 운영 액션: 메일 발송
  $("#btnSendMail").click(async function () {
    const req = {
      title: $("#mailTitle").val().trim(),
      content: $("#mailContent").val().trim(),
    };
    if (!req.title || !req.content) return alert("메일 제목과 내용을 입력해주세요.");
    if (!confirm(`"${req.title}" 메일을 발송하시겠습니까?`)) return;
    try {
      const res = await apiRequest(`/game/${gameId}/user/${userId}/mail`, "POST", req, token);
      alert(res.success ? "메일 발송 완료" : "발송 실패: " + (res.message || "오류"));
    } catch { alert("서버 오류"); }
  });

  // ✅ 운영 액션: 계정 정지
  $("#btnBanUser").click(async function () {
    if (!confirm("이 유저를 정지하시겠습니까?")) return;
    try {
      const res = await apiRequest(`/game/${gameId}/user/${userId}/ban`, "POST", null, token);
      alert(res.success ? "계정이 정지되었습니다." : "정지 실패");
    } catch { alert("서버 오류"); }
  });

  // ✅ 운영 액션: 정지 해제
  $("#btnUnbanUser").click(async function () {
    if (!confirm("정지를 해제하시겠습니까?")) return;
    try {
      const res = await apiRequest(`/game/${gameId}/user/${userId}/unban`, "POST", null, token);
      alert(res.success ? "정지가 해제되었습니다." : "해제 실패");
    } catch { alert("서버 오류"); }
  });
});
