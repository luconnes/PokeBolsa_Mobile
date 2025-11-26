// services/api.ts

// Mudei a BASE_URL para a raiz (sem /classes)
const BASE_URL = "https://parseapi.back4app.com";

const APP_ID = "Glkhp9KySPIUGhGv0gcrOn16Gq23IsM0D1WPSlhG";
const REST_KEY = "VTlaXKQ66J1IzYgJQnRO6oh6qSJfNPaRjcNhhawd9";

const headers = {
  "X-Parse-Application-Id": APP_ID,
  "X-Parse-REST-API-Key": REST_KEY,
  "Content-Type": "application/json",
};

// Função auxiliar para definir a URL correta
const getUrl = (endpoint: string) => {
  // Se for endpoint de usuário ou login, usa a raiz. Se não, adiciona /classes/
  if (endpoint === 'users' || endpoint === 'login' || endpoint.startsWith('users/')) {
    return `${BASE_URL}/${endpoint}`;
  }
  return `${BASE_URL}/classes/${endpoint}`;
};

export async function apiGet(className: string) {
  try {
    const response = await fetch(getUrl(className), {
      method: "GET",
      headers: headers,
    });
    return response.json();
  } catch (error) {
    console.error("Erro apiGet:", error);
    throw error;
  }
}

// FUNÇÃO ESPECÍFICA PARA LOGIN (Necessária para o Parse)
export async function apiLogin(username: string, password: string) {
  try {
    // O Login no Parse é um GET com parâmetros na URL
    const params = new URLSearchParams({ username, password }).toString();
    const response = await fetch(`${BASE_URL}/login?${params}`, {
      method: "GET",
      headers: headers,
    });
    return response.json();
  } catch (error) {
    console.error("Erro apiLogin:", error);
    throw error;
  }
}

export async function apiPost(className: string, data: any) {
  try {
    const response = await fetch(getUrl(className), {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    console.error("Erro apiPost:", error);
    throw error;
  }
}

export async function apiPut(className: string, objectId: string, data: any) {
  try {
    const url = `${getUrl(className)}/${objectId}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    console.error("Erro apiPut:", error);
    throw error;
  }
}

export async function apiDelete(className: string, objectId: string) {
  try {
    const url = `${getUrl(className)}/${objectId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: headers,
    });
    return response.json();
  } catch (error) {
    console.error("Erro apiDelete:", error);
    throw error;
  }
}
