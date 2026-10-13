// src/utils/tabToken.js

const getTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = crypto.randomUUID();
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

export const tokenKey = () => `token_${getTabId()}`;

export const getToken = () => localStorage.getItem(tokenKey());
export const setToken = (token) => localStorage.setItem(tokenKey(), token);
export const removeToken = () => localStorage.removeItem(tokenKey());