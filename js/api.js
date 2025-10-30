const API_BASE = "http://localhost:9630/api/v1";

async function apiRequest(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  return res.json();
}

function showAlert(type, msg) {
  $("#alert-box")
    .removeClass("d-none alert-success alert-danger")
    .addClass("alert-" + type)
    .text(msg);
}
