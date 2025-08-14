// AuthUtils file

import { faSlash } from '@fortawesome/free-solid-svg-icons';
import { ip_db, ip_this } from '../Config';
import { CurrentUser } from '../data';
import { resolve } from 'path';

interface AuthToken {
    token: string;
    expires: number;
    username: string;
}

let currentAuth: AuthToken | null = null;

export function deleteUser(username: string): Promise<boolean>{
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const url = `${ip_db}/deluser`;
        
        xhr.open("POST", url, false);
        xhr.setRequestHeader("Content-Type", "application/json");

        try
        {
            xhr.send(JSON.stringify({ username }));
            console.log(xhr.status)
            console.log(xhr.statusText)
            resolve(true)
        }
        catch(e)
        {
            console.error("error while deliting a user")
            resolve(false)
        }
    })
}
export function login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const url = `${ip_db}/auth`;
        
        xhr.open("POST", url, false);
        xhr.setRequestHeader("Content-Type", "application/json");
        
        try {
            console.log("Attempting to login at:", url);
            xhr.send(JSON.stringify({ username, password }));
            
            if (xhr.status === 200) {
                console.log("Login successful");
                const response = JSON.parse(xhr.responseText);
                currentAuth = {
                    token: response.token,
                    expires: Date.now() + (24 * 60 * 60 * 1000), // 24 часа
                    username: response.username
                };
                localStorage.setItem('authToken', JSON.stringify(currentAuth));
                resolve(true);
            } else {
                console.error("Login failed with status:", xhr.status);
                console.error("Response:", xhr.responseText);
                resolve(false);
            }
        } catch (error) {
            console.error("Login error details:", error);
            console.error("Server URL:", url);
            resolve(false);
        }
    });
}

export function register(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const url = `${ip_db}/register`;
        
        xhr.open("POST", url, false);
        xhr.setRequestHeader("Content-Type", "application/json");
        
        try {
            console.log("Attempting to register at:", url);
            xhr.send(JSON.stringify({ username, password }));
            
            if (xhr.status === 200) {
                console.log("Registration successful");
                resolve(true);
            } else {
                console.error("Registration failed with status:", xhr.status);
                console.error("Response:", xhr.responseText);
                resolve(false);
            }
        } catch (error) {
            console.error("Registration error details:", error);
            console.error("Server URL:", url);
            resolve(false);
        }
    });
}

export function changePassword(newPassword: string, username: string): Promise<boolean> {
    return new Promise((resolve) => {
        try{
            console.log("Attempting to set new password")
            deleteUser(username)
            register(username, newPassword)
            resolve(true)
        }
        catch(error)
        {
            console.error("Change password error details:", error);
            resolve(false);
        }
    })
}

export function logout(): void {
    currentAuth = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('pass');
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
    
    logout();
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