import { ip_db, ip_this } from '../Config';
import { CurrentUser } from '../data';

interface AuthToken {
    token: string;
    expires: number;
    username: string;
}

let currentAuth: AuthToken | null = null;

function clearAuthState(): void {
    currentAuth = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('pass');
}

async function postJson<T>(url: string, payload: unknown): Promise<{
    ok: boolean;
    status: number;
    data: T | null;
    text: string;
}> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data: T | null = null;

    if (text) {
        try {
            data = JSON.parse(text) as T;
        } catch {
            data = null;
        }
    }

    return {
        ok: response.ok,
        status: response.status,
        data,
        text
    };
}

export async function deleteUser(username: string): Promise<boolean> {
    const url = `${ip_db}/deluser`;

    try {
        const response = await postJson<{ message?: string; error?: string }>(url, { username });
        console.log(response.status);
        return response.ok;
    } catch (error) {
        console.error('Delete user error details:', error);
        return false;
    }
}

export async function login(username: string, password: string): Promise<boolean> {
    const url = `${ip_db}/auth`;

    try {
        console.log('Attempting to login at:', url);
        const response = await postJson<{ token?: string; username?: string; error?: string }>(url, { username, password });

        if (response.ok && response.data?.token && response.data?.username) {
            console.log('Login successful');
            currentAuth = {
                token: response.data.token,
                expires: Date.now() + (24 * 60 * 60 * 1000),
                username: response.data.username
            };
            localStorage.setItem('authToken', JSON.stringify(currentAuth));
            return true;
        }

        console.error('Login failed with status:', response.status);
        console.error('Response:', response.text);
        return false;
    } catch (error) {
        console.error('Login error details:', error);
        console.error('Server URL:', url);
        return false;
    }
}

export async function register(username: string, password: string): Promise<boolean> {
    const url = `${ip_db}/register`;

    try {
        console.log('Attempting to register at:', url);
        const response = await postJson<{ message?: string; error?: string }>(url, { username, password });

        if (response.ok) {
            console.log('Registration successful');
            return true;
        }

        console.error('Registration failed with status:', response.status);
        console.error('Response:', response.text);
        return false;
    } catch (error) {
        console.error('Registration error details:', error);
        console.error('Server URL:', url);
        return false;
    }
}

export async function changePassword(newPassword: string, username: string): Promise<boolean> {
    try {
        console.log('Attempting to set new password');
        await deleteUser(username);
        await register(username, newPassword);
        return true;
    } catch (error) {
        console.error('Change password error details:', error);
        return false;
    }
}

export function logout(): void {
    clearAuthState();
    window.location.href = `${ip_this}/`;
}

export function isAuthenticated(): boolean {
    if (!currentAuth) {
        const savedAuth = localStorage.getItem('authToken');
        if (savedAuth) {
            currentAuth = JSON.parse(savedAuth);
            if (currentAuth) {
                CurrentUser.username = currentAuth.username;
            }
        }
    }

    if (currentAuth && currentAuth.expires > Date.now()) {
        return true;
    }

    clearAuthState();
    return false;
}

export function getAuthToken(): string | null {
    if (isAuthenticated() && currentAuth) {
        return currentAuth.token;
    }
    return null;
}

export function getCurrentUsername(): string | null {
    if (isAuthenticated() && currentAuth) {
        return currentAuth.username;
    }
    return null;
}
