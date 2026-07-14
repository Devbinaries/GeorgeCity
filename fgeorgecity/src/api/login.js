import {getAuthToken}  from '../hooks/useAuth';
import {VITE_API_URL} from './api';


export async function fetchProfile() {
    const token = getAuthToken();
    if (!token) return null;

    const profile = await fetch(`${VITE_API_URL}/users/profile/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    return profile.json();
}

//refresh token
export async function refreshToken() {
    const refresh = localStorage.getItem("_auth_refresh");
    const response = await fetch(`${VITE_API_URL}/token/refresh/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
        throw new Error("Token refresh failed");
    }
    const data = await response.json();
    return data;
}