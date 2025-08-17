import { useState } from 'react';
import './NewPass.css';
import { changePassword } from './Utils/AuthUtils';
function NewPass(props: { name: string }) {
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(newPass, confirmPass);
        changePassword(newPass, props.name).then((result: boolean) => {console.log(`Result: ${result}`);         localStorage.setItem("pass", newPass);})
    }

    return (
        <div className="newpass-container">
            <h1>New Password</h1>
            <form onSubmit={handleSubmit}>
                <div className="newpass-input-container">
                    <input 
                        type="password" 
                        placeholder="New Password" 
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)} 
                        required 
                    />
                </div>
                <div className="newpass-input-container">
                    <input 
                        type="password" 
                        placeholder="Confirm New Password" 
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" className="action-button">Change Password</button>
            </form>
        </div>
    )
}

export default NewPass;