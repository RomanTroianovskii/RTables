import { useEffect, useState } from "react";
import { ip_this } from "./Config";
import { getData, Table } from "./Utils/SQLUtils";
import { getStorage, second, third } from "./data";

let rendered = false;

const LastTables = () => {
    const [Tables, setTables] = useState<Table[]>([]);
    const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
    const [storage, setStorage] = useState<{ first: string, second: string, third: string }>({ first: '', second: '', third: '' });
    useEffect(() => {
        setStorage(getStorage());
    }, []);

    const showToast = (message: string) => {
        setToast({ message, show: true });
        setTimeout(() => {
        setToast({ message: '', show: false });
        }, 3000);
    };

    useEffect(() => {
        const loadedTables = getData(showToast);
        setTables(loadedTables);
    }, []);

    const toastStyle: React.CSSProperties = {
        backgroundColor: 'white',
        color: '#333',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out',
        transform: toast.show ? 'translateY(0)' : 'translateY(-100px)',
        opacity: toast.show ? 1 : 0,
        position: 'relative',
      };
    
      const toastWrapperStyle: React.CSSProperties = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '2px',
        borderRadius: '12px',
        background: 'white',
        zIndex: 1000,
        transform: toast.show ? 'translateY(0)' : 'translateY(-100px)',
        opacity: toast.show ? 1 : 0,
        transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
      };
    
      const borderStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg,#4CAF50, #feb47b)',
        borderRadius: '12px',
        zIndex: -1,
        clipPath: toast.show ? 'inset(0 0 0 0)' : 'inset(100% 0 0 100%)',
        transition: 'clip-path 3s linear',
      };

      if(storage.first === null || storage.first === "null" || storage.first === undefined || storage.first === "")
      {
        return (
            <div className="recent-tables">
                <h2>Recent Tables:</h2>
                <p>No recent tables</p>
            </div>
        )
      }
      else
      {
        return (
                <>
                <div className="recent-tables">
                <h2>Recent Tables</h2>
                <div className="recent-tables-list">
                    <div className="recent-table-item" onClick={() => {
                        const id = storage.first?.split('id=')[1];
                        if (id) {
                            window.location.href = `${ip_this}?id=${id}`;
                        }
                    } }>
                        {Tables.find(t => `${ip_this}?create=false&id=${t.id}` === storage.first)?.name || "Untitled Table"}
                    </div>
                    {storage.second !== null && storage.second !== "null" && storage.second !== undefined && storage.second !== "" && (
                        <div className="recent-table-item" onClick={() => {
                            const id = storage.second?.split('id=')[1];
                            if (id) {
                                window.location.href = `${ip_this}?id=${id}`;
                            }
                        } }>
                            {Tables.find(t => `${ip_this}?create=false&id=${t.id}` === storage.second)?.name || "Untitled Table"}
                        </div>
                    )}
                    {third !== null && third !== "null" && third !== undefined && third !== "" && (
                        <div className="recent-table-item" onClick={() => {
                            const id = third?.split('id=')[1];
                            if (id) {
                                window.location.href = `${ip_this}?id=${id}`;
                            }
                        } }>
                            {Tables.find(t => `${ip_this}?create=false&id=${t.id}` === third)?.name || "Untitled Table"}
                        </div>
                    )}
                </div>
            </div>
            <div style={toastWrapperStyle}>
                    <div style={borderStyle}></div>
                    <div style={toastStyle}>
                        {toast.message}
                    </div>
                </div>
            </>
        )
      }
}

export default LastTables;

