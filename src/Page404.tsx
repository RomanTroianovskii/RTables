import { ip_this } from "./Config";
import LastTables from "./LastTables";
const Page404 = () => {
    const handleLinkHome = () => {
        window.location.href = `${ip_this}?create=true`;
    }
    return (
        <div className="app-container">
        <div className="welcome-screen">
          <h1>404 - Table not found</h1>
              <p>The requested table does not exist or has been deleted</p>
              
              <div className="quick-actions">
                <button onClick={handleLinkHome} className="action-button">
                  Home
                </button>
              </div>

              <LastTables />
             
            </div>
          </div>
    )
}

export default Page404;