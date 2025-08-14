// src/Account.tsx
import { ip_this } from "./Config";
import { logout, deleteUser} from "./Utils/AuthUtils";
import { useState } from "react";
import './Account.css'; // Импортируем стили

const Account = (props: { name: string, pass: string }) => {
    const [ShowPass, setShowPass] = useState(false);
    const [ShowDelete, setShowDelete] = useState(false);
    
    return (
        <div className="account-container">
            <h1>Account Info:</h1>
            <div className="account-info">
                <div className="name-container">
                    <span className="name-span">{props.name}</span>
                </div>
                <div>
                    <label>Password:</label>
                    <input 
                        id="pass" 
                        name="pass" 
                        type={ShowPass ? "text" : "password"} 
                        value={props.pass} 
                        readOnly 
                    />
                    <button className="action-button" onClick={() => setShowPass(!ShowPass)}>
                        {ShowPass ? "Hide password" : "Show password"}
                    </button>
                </div>
            </div>
            <div className="button-container">
                <button className="action-button" onClick={logout}>Logout</button>
            </div>
            <div className="button-container">
                <button className="action-button" onClick={() => {
                    window.location.href = `${ip_this}/newpass`;
                }}>Edit Password</button>
            </div>
            <div className="button-container">
                <button className="red-button" onClick={() => {
                    setShowDelete(true);
                }}>Delete Account</button>
            </div>
            {ShowDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h1>Are you sure?</h1>
                        <div className="red-button">
                            <button className="red-button" onClick={() => {
                                deleteUser(props.name)
                                logout()
                            }}>Delete Account</button>
                            <button className="action-button" onClick={() => {
                                setShowDelete(false)
                            }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Account;