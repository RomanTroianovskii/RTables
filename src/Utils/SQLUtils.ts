import { ip_db } from '../Config';
import { isAuthenticated, getAuthToken } from './AuthUtils';

export class Table {
    id: number;
    name: string;
    content: string;

    constructor(id: number, name: string, content: string) {
        this.id = id;
        this.name = name;
        this.content = content;
    }

    static isValidName(name: string): boolean {
        return name.length >= 3 && name.length <= 50 &&
            /^[a-zA-Z0-9\s_-]+$/.test(name);
    }
}

function validateId(id: number): boolean {
    return Number.isInteger(id) && id > 0;
}

function validateTableName(name: string): boolean {
    return name.length >= 3 && name.length <= 50 &&
        /^[a-zA-Z0-9\s_-]+$/.test(name);
}

function escapeString(str: string): string {
    return str.replace(/"/g, '\\"');
}

function parseTableContent(content: string): string[][] {
    try {
        // Удаляем экранированные кавычки
        const cleanContent = content.replace(/\\"/g, '"');
        console.log("Очищенный контент:", cleanContent);
        
        // Если контент уже является массивом массивов, возвращаем его
        if (Array.isArray(cleanContent)) {
            return cleanContent;
        }
        
        // Если строка начинается с [ и заканчивается на ], но не является валидным JSON
        if (cleanContent.startsWith('[') && cleanContent.endsWith(']')) {
            // Разбиваем строку на массивы по ],[
            const rows = cleanContent.split('],[');
            return rows.map(row => {
                // Убираем скобки и разбиваем на элементы
                const cleanRow = row.replace(/[\[\]]/g, '');
                return cleanRow.split(',').map(cell => cell.replace(/"/g, ''));
            });
        }
        
        // Парсим JSON
        const parsed = JSON.parse(cleanContent);
        console.log("Распарсенный контент:", parsed);
        
        // Убеждаемся, что результат - это массив массивов
        if (!Array.isArray(parsed) || !parsed.every(row => Array.isArray(row))) {
            console.error("Неправильный формат данных таблицы:", parsed);
            return [];
        }
        
        return parsed;
    } catch (error) {
        console.error("Ошибка парсинга контента таблицы:", error);
        console.error("Исходный контент:", content);
        return [];
    }
}

export function insertData(id: number, name: string, ContentAsJSON: string, onError: (message: string) => void): void {
    if (!isAuthenticated()) {
        onError("Authentication required");
        return;
    }

    if (!validateId(id)) {
        onError("Invalid ID format");
        return;
    }

    if (!validateTableName(name)) {
        onError("Invalid table name format");
        return;
    }

    const url = `${ip_db}/query`;
    const xhr = new XMLHttpRequest();

    // Экранируем входные данные
    const escapedName = escapeString(name);
    const escapedContent = escapeString(ContentAsJSON);
    const token = getAuthToken();

    const body = JSON.stringify({
        sql: "INSERT INTO TABLES(ID, NAME, CONTENT) VALUES (?, ?, ?)",
        params: [id, escapedName, escapedContent],
        token: token
    });

    xhr.open("POST", url, false);
    xhr.setRequestHeader("Content-Type", "application/json");

    try {
        xhr.send(body);

        if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            console.log("Результат вставки:", result);
        } else if (xhr.status === 401) {
            onError("Authentication failed");
        } else {
            onError("Server Error. Check console");
            console.error("Ошибка вставки данных:", xhr.status);
        }
    } catch (error) {
        onError("Server Error. Check console");
        console.error("Ошибка при вставке данных:", error);
    }
}

export function getData(onError: (message: string) => void): Table[] {
    if (!isAuthenticated()) {
        onError("Authentication required");
        return [];
    }

    const token = getAuthToken();
    const url = `${ip_db}/query?sql=SELECT%20*%20FROM%20TABLES&token=${token}`;
    const xhr = new XMLHttpRequest();

    xhr.open("GET", url, false);
    try {
        xhr.send();
        console.log(xhr.status);    
        if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            console.log("Полученные данные от сервера:", result);
            
            const tables: Table[] = [];
            const data = result["data"];
            
            if (data) {
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    console.log("Обработка строки:", row);
                    
                    if (!row.ID || !row.NAME || !row.CONTENT) {
                        console.log("Log 1", row);
                        console.error("Отсутствуют необходимые поля в строке:", row);
                        continue;
                    }
                    
                    const parsedContent = parseTableContent(row.CONTENT);
                    const table = new Table(
                        parseInt(row.ID),
                        row.NAME,
                        JSON.stringify(parsedContent)
                    );
                    console.log("Создана таблица:", table);
                    tables.push(table);
                }
            } else {
                console.error("Нет поля data в результате:", result);
                onError("Invalid data format received from server");
                return [];
            }
            
            console.log("Все преобразованные таблицы:", tables);
            return tables;
            
        } else if (xhr.status === 401) {
            onError("Authentication failed");
            return [];
        } else {
            onError("Server Error. Check console");
            console.error("Ошибка запроса:", xhr.status);
            return [];
        }
    } catch (error) {
        onError("Server Error. Check console");
        console.error("Ошибка при получении данных:", error);
        return [];
    }
}

export function DelData(id: number, onError: (message: string) => void): boolean {
    if (!isAuthenticated()) {
        onError("Authentication required");
        return false;
    }

    if (!validateId(id)) {
        onError("Invalid ID format");
        return false;
    }

    const token = getAuthToken();
    const url = `${ip_db}/query?sql=DELETE%20FROM%20TABLES%20WHERE%20ID=${id}&token=${token}`;
    const xhr = new XMLHttpRequest();
  
    xhr.open("GET", url, false);
    try {
        xhr.send();
  
        if (xhr.status === 200) {
            console.log(xhr.status);
            return true;
        } else if (xhr.status === 401) {
            onError("Authentication failed");
            return false;
        } else {
            onError("Server Error. Check console");
            console.error("Ошибка запроса:", xhr.status);
            return false;
        }
    } catch (error) {
        onError("Server Error. Check console");
        console.error("Ошибка при получении данных:", error);
        return false;
    }
} 