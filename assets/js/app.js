(() => {
  const { request, showFeedback, handleApiError } = window.apiClient;

  const state = {
    adminSearch: null,
    adminDetail: null,
    gameDetail: null,
    orgDetail: null,
  };

  const escapeHtml = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    return `${value}`
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatDateTime = (value) => {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return escapeHtml(value);
    }
    return escapeHtml(parsed.toLocaleString());
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || `${value}`.trim() === '') {
      return '-';
    }
    return escapeHtml(value);
  };

  const buildDetailItems = (items) =>
    items
      .map(({ label, value, type }) => {
        const displayValue = type === 'datetime' ? formatDateTime(value) : formatValue(value);
        return `
          <div class="detail-item">
            <h6>${escapeHtml(label)}</h6>
            <p>${displayValue}</p>
          </div>
        `;
      })
      .join('');

  const collectFormData = (formElement) => {
    const formData = new FormData(formElement);
    const entries = {};
    for (const [key, value] of formData.entries()) {
      entries[key] = typeof value === 'string' ? value.trim() : value;
    }
    return entries;
  };

  const pruneEmptyValues = (source) => {
    if (!source) {
      return {};
    }
    return Object.entries(source).reduce((accumulator, [key, value]) => {
      if (value === undefined || value === null) {
        return accumulator;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') {
          return accumulator;
        }
        accumulator[key] = trimmed;
        return accumulator;
      }
      accumulator[key] = value;
      return accumulator;
    }, {});
  };

  const toNumberIfPossible = (value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  };

  const setupAdminSection = () => {
    const adminListForm = document.getElementById('admin-list-form');
    const adminListBody = document.getElementById('admin-list-body');
    const adminResetButton = document.getElementById('admin-list-reset');
    const adminDetailForm = document.getElementById('admin-detail-form');
    const adminDetailContainer = document.getElementById('admin-detail-container');
    const adminDetailInput = document.getElementById('adminDetailId');
    const adminTable = document.getElementById('admin-list-table');

    const adminEditModalElement = document.getElementById('adminEditModal');
    const adminEditForm = document.getElementById('admin-edit-form');
    const adminDeleteButton = document.getElementById('admin-delete-button');

    if (!adminListForm || !adminListBody || !adminDetailForm || !adminDetailContainer || !adminTable) {
      return;
    }

    const renderAdminList = (list) => {
      if (!Array.isArray(list) || list.length === 0) {
        adminListBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted">검색 결과가 없습니다.</td>
          </tr>
        `;
        return;
      }

      adminListBody.innerHTML = list
        .map((item) => {
          const adminId = item?.adminId ?? '';
          const name = item?.adminNm ?? '-';
          const email = item?.adminEmail ?? '-';
          const role = item?.adminRole ?? '-';
          const gameId = item?.gameId ?? '-';
          const orgId = item?.orgId ?? '-';

          return `
            <tr data-admin-id="${escapeHtml(adminId)}">
              <td>${escapeHtml(adminId)}</td>
              <td>${escapeHtml(name)}</td>
              <td>${escapeHtml(email)}</td>
              <td>${escapeHtml(role)}</td>
              <td>${escapeHtml(gameId)}</td>
              <td>${escapeHtml(orgId)}</td>
              <td class="text-center">
                <button type="button" class="btn btn-sm btn-outline-primary" data-admin-action="edit" data-admin-id="${escapeHtml(
                  adminId
                )}">
                  수정
                </button>
              </td>
            </tr>
          `;
        })
        .join('');
    };

    const renderAdminDetail = (detail) => {
      if (!detail) {
        adminDetailContainer.innerHTML = '<p class="text-muted">관리자 상세 정보를 불러올 수 없습니다.</p>';
        return;
      }

      const items = [
        { label: '관리자 ID', value: detail.adminId },
        { label: '로그인 ID', value: detail.loginId },
        { label: '이름', value: detail.adminNm },
        { label: '이메일', value: detail.adminEmail },
        { label: '권한', value: detail.adminRole },
        { label: '게임 ID', value: detail.gameId },
        { label: '단체 ID', value: detail.orgId },
        { label: '삭제 여부', value: detail.isDel },
        { label: '생성일', value: detail.createdAt, type: 'datetime' },
        { label: '생성자', value: detail.createdBy },
        { label: '수정일', value: detail.updatedAt, type: 'datetime' },
        { label: '수정자', value: detail.updatedBy },
      ];

      adminDetailContainer.innerHTML = buildDetailItems(items);
    };

    const fetchAdminList = async (showMessage = true) => {
      const searchInputs = collectFormData(adminListForm);
      const params = pruneEmptyValues(searchInputs);
      state.adminSearch = params;

      try {
        const response = await request('/api/v1/admin/list', { method: 'GET', data: params });
        const data = Array.isArray(response?.data) ? response.data : [];
        renderAdminList(data);
        if (showMessage) {
          showFeedback('관리자 목록을 불러왔습니다.');
        }
      } catch (error) {
        handleApiError(error);
      }
    };

    const refreshAdminList = async () => {
      if (!state.adminSearch) {
        return;
      }
      try {
        const response = await request('/api/v1/admin/list', { method: 'GET', data: state.adminSearch });
        const data = Array.isArray(response?.data) ? response.data : [];
        renderAdminList(data);
      } catch (error) {
        handleApiError(error);
      }
    };

    const fetchAdminDetail = async (adminId, showMessage = true) => {
      if (!adminId) {
        return;
      }
      try {
        const response = await request(`/api/v1/admin/${adminId}`);
        const detail = response?.data ?? null;
        state.adminDetail = detail;
        renderAdminDetail(detail);
        if (adminDetailInput) {
          adminDetailInput.value = adminId;
        }
        if (showMessage) {
          showFeedback('관리자 상세 정보를 불러왔습니다.');
        }
      } catch (error) {
        handleApiError(error);
      }
    };

    adminListForm.addEventListener('submit', (event) => {
      event.preventDefault();
      fetchAdminList(true);
    });

    adminResetButton?.addEventListener('click', () => {
      adminListForm.reset();
      state.adminSearch = null;
      adminListBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">검색 조건을 입력하고 조회 버튼을 눌러주세요.</td>
        </tr>
      `;
    });

    adminDetailForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formValues = collectFormData(adminDetailForm);
      const adminId = formValues.adminId;
      fetchAdminDetail(adminId, true);
    });

    adminTable.addEventListener('click', (event) => {
      const editButton = event.target.closest('[data-admin-action="edit"]');
      if (editButton) {
        event.preventDefault();
        event.stopPropagation();
        const adminId = editButton.getAttribute('data-admin-id');
        openAdminEditModal(adminId);
        return;
      }

      const row = event.target.closest('tr[data-admin-id]');
      if (row) {
        const adminId = row.getAttribute('data-admin-id');
        fetchAdminDetail(adminId, false);
      }
    });

    const fillAdminEditForm = (detail) => {
      if (!detail) {
        return;
      }
      adminEditForm.reset();
      adminEditForm.dataset.adminId = detail.adminId ?? '';
      document.getElementById('adminEditId').value = detail.adminId ?? '';
      document.getElementById('adminEditGameId').value = detail.gameId ?? '';
      document.getElementById('adminEditRole').value = detail.adminRole ?? '';
      document.getElementById('adminEditName').value = detail.adminNm ?? '';
      document.getElementById('adminEditEmail').value = detail.adminEmail ?? '';
      document.getElementById('adminEditPassword').value = '';
      document.getElementById('adminEditIsDel').value = detail.isDel ?? '';
      document.getElementById('adminEditUpdatedBy').value = detail.updatedBy ?? '';
    };

    const openAdminEditModal = async (adminId) => {
      if (!adminId) {
        return;
      }

      let detail = state.adminDetail;
      if (!detail || String(detail.adminId) !== String(adminId)) {
        try {
          const response = await request(`/api/v1/admin/${adminId}`);
          detail = response?.data ?? null;
          state.adminDetail = detail;
        } catch (error) {
          handleApiError(error);
          return;
        }
      }

      fillAdminEditForm(detail);

      if (adminDetailInput) {
        adminDetailInput.value = adminId;
      }

      renderAdminDetail(detail);

      const modal = bootstrap.Modal.getOrCreateInstance(adminEditModalElement);
      modal.show();
    };

    adminEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const adminId = adminEditForm.dataset.adminId;
      if (!adminId) {
        return;
      }

      const payload = pruneEmptyValues({
        gameId: toNumberIfPossible(document.getElementById('adminEditGameId').value),
        adminRole: document.getElementById('adminEditRole').value,
        adminNm: document.getElementById('adminEditName').value,
        adminEmail: document.getElementById('adminEditEmail').value,
        loginPw: document.getElementById('adminEditPassword').value,
        isDel: document.getElementById('adminEditIsDel').value,
        updatedBy: document.getElementById('adminEditUpdatedBy').value,
      });

      try {
        await request(`/api/v1/admin/${adminId}`, { method: 'PATCH', data: payload });
        showFeedback('관리자 정보가 수정되었습니다.');
        bootstrap.Modal.getInstance(adminEditModalElement).hide();
        await fetchAdminDetail(adminId, false);
        await refreshAdminList();
      } catch (error) {
        handleApiError(error);
      }
    });

    adminDeleteButton?.addEventListener('click', async () => {
      const adminId = adminEditForm.dataset.adminId;
      if (!adminId) {
        return;
      }
      const confirmDelete = window.confirm('선택한 관리자를 삭제하시겠습니까? (논리적 삭제)');
      if (!confirmDelete) {
        return;
      }
      try {
        await request(`/api/v1/admin/${adminId}`, { method: 'DELETE' });
        showFeedback('관리자 삭제가 완료되었습니다.', 'success');
        bootstrap.Modal.getInstance(adminEditModalElement).hide();
        state.adminDetail = null;
        adminDetailContainer.innerHTML = '<p class="text-muted">삭제된 관리자입니다.</p>';
        await refreshAdminList();
      } catch (error) {
        handleApiError(error);
      }
    });
  };

  const setupGameSection = () => {
    const gameDetailForm = document.getElementById('game-detail-form');
    const gameDetailContainer = document.getElementById('game-detail-container');
    const gameDetailInput = document.getElementById('gameDetailId');
    const gameEditButton = document.getElementById('game-edit-button');
    const gameRefreshButton = document.getElementById('game-refresh-button');
    const gameEditModalElement = document.getElementById('gameEditModal');
    const gameEditForm = document.getElementById('game-edit-form');
    const gameDeleteButton = document.getElementById('game-delete-button');

    if (!gameDetailForm || !gameDetailContainer || !gameEditForm) {
      return;
    }

    const renderGameDetail = (detail) => {
      if (!detail) {
        gameDetailContainer.innerHTML = '<p class="text-muted">게임 상세 정보를 불러올 수 없습니다.</p>';
        return;
      }

      const items = [
        { label: '게임 ID', value: detail.gameId },
        { label: '단체 ID', value: detail.orgId },
        { label: '게임명', value: detail.name },
        { label: '상태', value: detail.status },
        { label: 'Client App ID', value: detail.clientAppId },
        { label: 'Signature Key', value: detail.signatureKey },
        { label: '삭제 여부', value: detail.isDel },
        { label: '생성일', value: detail.createdAt, type: 'datetime' },
        { label: '생성자', value: detail.createdBy },
        { label: '수정일', value: detail.updatedAt, type: 'datetime' },
        { label: '수정자', value: detail.updatedBy },
      ];

      gameDetailContainer.innerHTML = buildDetailItems(items);
    };

    const fetchGameDetail = async (gameId, showMessage = true) => {
      if (!gameId) {
        return;
      }
      try {
        const response = await request(`/api/v1/game/${gameId}`);
        const detail = response?.data ?? null;
        state.gameDetail = detail;
        renderGameDetail(detail);
        if (gameDetailInput) {
          gameDetailInput.value = gameId;
        }
        if (gameEditButton) {
          gameEditButton.disabled = !detail;
          gameEditButton.dataset.gameId = detail?.gameId ?? '';
        }
        if (gameRefreshButton) {
          gameRefreshButton.disabled = false;
          gameRefreshButton.dataset.gameId = gameId;
        }
        if (showMessage) {
          showFeedback('게임 상세 정보를 불러왔습니다.');
        }
      } catch (error) {
        handleApiError(error);
      }
    };

    gameDetailForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formValues = collectFormData(gameDetailForm);
      fetchGameDetail(formValues.gameId, true);
    });

    gameRefreshButton?.addEventListener('click', () => {
      const targetId = gameRefreshButton.dataset.gameId;
      if (targetId) {
        fetchGameDetail(targetId, false);
      }
    });

    const fillGameEditForm = (detail) => {
      if (!detail) {
        return;
      }
      gameEditForm.reset();
      gameEditForm.dataset.gameId = detail.gameId ?? '';
      document.getElementById('gameEditId').value = detail.gameId ?? '';
      document.getElementById('gameEditName').value = detail.name ?? '';
      document.getElementById('gameEditStatus').value = detail.status ?? '';
      document.getElementById('gameEditIsDel').value = detail.isDel ?? '';
      document.getElementById('gameEditUpdatedBy').value = detail.updatedBy ?? '';
    };

    const openGameEditModal = async () => {
      const gameId = gameEditForm.dataset.gameId || gameEditButton?.dataset.gameId;
      if (!gameId) {
        return;
      }
      let detail = state.gameDetail;
      if (!detail || String(detail.gameId) !== String(gameId)) {
        try {
          const response = await request(`/api/v1/game/${gameId}`);
          detail = response?.data ?? null;
          state.gameDetail = detail;
        } catch (error) {
          handleApiError(error);
          return;
        }
      }
      fillGameEditForm(detail);
      renderGameDetail(detail);
      const modal = bootstrap.Modal.getOrCreateInstance(gameEditModalElement);
      modal.show();
    };

    gameEditButton?.addEventListener('click', (event) => {
      event.preventDefault();
      openGameEditModal();
    });

    gameEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const gameId = gameEditForm.dataset.gameId;
      if (!gameId) {
        return;
      }

      const payload = pruneEmptyValues({
        name: document.getElementById('gameEditName').value,
        status: document.getElementById('gameEditStatus').value,
        isDel: document.getElementById('gameEditIsDel').value,
        updateBy: document.getElementById('gameEditUpdatedBy').value,
      });

      try {
        await request(`/api/v1/game/${gameId}`, { method: 'PATCH', data: payload });
        showFeedback('게임 정보가 수정되었습니다.');
        bootstrap.Modal.getInstance(gameEditModalElement).hide();
        await fetchGameDetail(gameId, false);
      } catch (error) {
        handleApiError(error);
      }
    });

    gameDeleteButton?.addEventListener('click', async () => {
      const gameId = gameEditForm.dataset.gameId;
      if (!gameId) {
        return;
      }
      const confirmDelete = window.confirm('선택한 게임을 삭제하시겠습니까?');
      if (!confirmDelete) {
        return;
      }
      try {
        await request(`/api/v1/game/${gameId}`, { method: 'DELETE' });
        showFeedback('게임 삭제 요청이 완료되었습니다.', 'success');
        bootstrap.Modal.getInstance(gameEditModalElement).hide();
        state.gameDetail = null;
        gameDetailContainer.innerHTML = '<p class="text-muted">삭제된 게임입니다.</p>';
        if (gameEditButton) {
          gameEditButton.disabled = true;
        }
      } catch (error) {
        handleApiError(error);
      }
    });
  };

  const setupOrgSection = () => {
    const orgDetailForm = document.getElementById('org-detail-form');
    const orgDetailContainer = document.getElementById('org-detail-container');
    const orgDetailInput = document.getElementById('orgDetailId');
    const orgEditButton = document.getElementById('org-edit-button');
    const orgRefreshButton = document.getElementById('org-refresh-button');
    const orgEditModalElement = document.getElementById('orgEditModal');
    const orgEditForm = document.getElementById('org-edit-form');
    const orgDeleteButton = document.getElementById('org-delete-button');

    if (!orgDetailForm || !orgDetailContainer || !orgEditForm) {
      return;
    }

    const renderOrgDetail = (detail) => {
      if (!detail) {
        orgDetailContainer.innerHTML = '<p class="text-muted">단체 상세 정보를 불러올 수 없습니다.</p>';
        return;
      }

      const items = [
        { label: '단체 ID', value: detail.orgId },
        { label: '단체명', value: detail.orgNm },
        { label: '사업자번호', value: detail.orgCd },
        { label: '삭제 여부', value: detail.isDel },
        { label: '생성일', value: detail.createdAt, type: 'datetime' },
        { label: '생성자', value: detail.createdBy },
        { label: '수정일', value: detail.updatedAt, type: 'datetime' },
        { label: '수정자', value: detail.updatedBy },
      ];

      orgDetailContainer.innerHTML = buildDetailItems(items);
    };

    const fetchOrgDetail = async (orgId, showMessage = true) => {
      if (!orgId) {
        return;
      }
      try {
        const response = await request(`/api/v1/org/${orgId}`);
        const detail = response?.data ?? null;
        state.orgDetail = detail;
        renderOrgDetail(detail);
        if (orgDetailInput) {
          orgDetailInput.value = orgId;
        }
        if (orgEditButton) {
          orgEditButton.disabled = !detail;
          orgEditButton.dataset.orgId = detail?.orgId ?? '';
        }
        if (orgRefreshButton) {
          orgRefreshButton.disabled = false;
          orgRefreshButton.dataset.orgId = orgId;
        }
        if (showMessage) {
          showFeedback('단체 상세 정보를 불러왔습니다.');
        }
      } catch (error) {
        handleApiError(error);
      }
    };

    orgDetailForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formValues = collectFormData(orgDetailForm);
      fetchOrgDetail(formValues.orgId, true);
    });

    orgRefreshButton?.addEventListener('click', () => {
      const targetId = orgRefreshButton.dataset.orgId;
      if (targetId) {
        fetchOrgDetail(targetId, false);
      }
    });

    const fillOrgEditForm = (detail) => {
      if (!detail) {
        return;
      }
      orgEditForm.reset();
      orgEditForm.dataset.orgId = detail.orgId ?? '';
      document.getElementById('orgEditId').value = detail.orgId ?? '';
      document.getElementById('orgEditName').value = detail.orgNm ?? '';
      document.getElementById('orgEditCode').value = detail.orgCd ?? '';
      document.getElementById('orgEditUpdatedBy').value = detail.updatedBy ?? '';
    };

    const openOrgEditModal = async () => {
      const orgId = orgEditForm.dataset.orgId || orgEditButton?.dataset.orgId;
      if (!orgId) {
        return;
      }
      let detail = state.orgDetail;
      if (!detail || String(detail.orgId) !== String(orgId)) {
        try {
          const response = await request(`/api/v1/org/${orgId}`);
          detail = response?.data ?? null;
          state.orgDetail = detail;
        } catch (error) {
          handleApiError(error);
          return;
        }
      }
      fillOrgEditForm(detail);
      renderOrgDetail(detail);
      const modal = bootstrap.Modal.getOrCreateInstance(orgEditModalElement);
      modal.show();
    };

    orgEditButton?.addEventListener('click', (event) => {
      event.preventDefault();
      openOrgEditModal();
    });

    orgEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const orgId = orgEditForm.dataset.orgId;
      if (!orgId) {
        return;
      }

      const payload = pruneEmptyValues({
        orgNm: document.getElementById('orgEditName').value,
        orgCd: document.getElementById('orgEditCode').value,
        updateBy: document.getElementById('orgEditUpdatedBy').value,
      });

      try {
        await request(`/api/v1/org/${orgId}`, { method: 'PATCH', data: payload });
        showFeedback('단체 정보가 수정되었습니다.');
        bootstrap.Modal.getInstance(orgEditModalElement).hide();
        await fetchOrgDetail(orgId, false);
      } catch (error) {
        handleApiError(error);
      }
    });

    orgDeleteButton?.addEventListener('click', async () => {
      const orgId = orgEditForm.dataset.orgId;
      if (!orgId) {
        return;
      }
      const confirmDelete = window.confirm('선택한 단체를 삭제하시겠습니까?');
      if (!confirmDelete) {
        return;
      }
      try {
        await request(`/api/v1/org/${orgId}`, { method: 'DELETE' });
        showFeedback('단체 삭제 요청이 완료되었습니다.', 'success');
        bootstrap.Modal.getInstance(orgEditModalElement).hide();
        state.orgDetail = null;
        orgDetailContainer.innerHTML = '<p class="text-muted">삭제된 단체입니다.</p>';
        if (orgEditButton) {
          orgEditButton.disabled = true;
        }
      } catch (error) {
        handleApiError(error);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    setupAdminSection();
    setupGameSection();
    setupOrgSection();
  });
})();
