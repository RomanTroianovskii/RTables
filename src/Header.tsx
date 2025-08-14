import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import './Header.css';
import { ip_this } from './Config';
import { phone_number, email } from './Config';
const Header: React.FC = () => {

    const handleAccountClick = () => {
        window.location.href = `${ip_this}/account`;
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="contact-info">
                    <span>
                        <h3 style = {{ position: "absolute", top: "0px", left: "10px"}}><FontAwesomeIcon icon={faEnvelope} /> {email}</h3>
                        <h3 style = {{position: "absolute", top: "0px", left: "300px"}}><FontAwesomeIcon icon={faPhone} /> {phone_number}</h3>
                    </span> 
                </div>
                <button className="account-button" onClick={handleAccountClick}>
                    Account
                </button>
            </div>
        </header>
    );
};

export default Header;  