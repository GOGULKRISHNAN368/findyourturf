const API_URL = "http://localhost:5000";

export async function loginAdmin(email, password) {
  const response = await fetch(
    `${API_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Login failed"
    );
  }

  localStorage.setItem(
    "adminToken",
    data.token
  );

  localStorage.setItem(
    "admin",
    JSON.stringify(data.admin)
  );

  return data;
}

export function getAdminToken() {
  return localStorage.getItem("adminToken");
}

export function getAdmin() {
  const admin = localStorage.getItem("admin");

  if (!admin) {
    return null;
  }

  try {
    return JSON.parse(admin);
  } catch {
    return null;
  }
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken());
}

export function logoutAdmin() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
}