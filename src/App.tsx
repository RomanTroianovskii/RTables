import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { createEmptyTable } from "./Utils/tableUtils";
import { exportTableToExcel, importExcelFile } from "./Utils/excelUtils";
import './App.css';
import { insertData, getData, Table, DelData } from "./Utils/SQLUtils";
import { ip_404, ip_this } from './Config';
import { login, isAuthenticated, register } from './Utils/AuthUtils';
import { Routes, Route, data, BrowserRouter } from 'react-router-dom';
import Header from './Header';
import LastTables from './LastTables';
import { setStorageByHref } from './data';

let setted = false;
let find = false;
let redid: string = "0";


function App() { 

  const [tableData, setTableData] = useState<string[][] | null>(null);
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  const [rawCellValues, setRawCellValues] = useState<string[][] | null>(null);
  const [tableName, setTableName] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [tempRows, setTempRows] = useState<string>("3");
  const [tempCols, setTempCols] = useState<string>("3");
  const [tempName, setTempName] = useState<string>("");
  const [showLoginModal, setShowLoginModal] = useState<boolean>(!isAuthenticated());
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [tables, setTables] = useState<Table[]>([]);

  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [recentTables, setRecentTables] = useState<string[]>([]);
  const [show404, setShow404] = useState<boolean>(false);

  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };

  const id = new URLSearchParams(window.location.search).get('id')
  const create = new URLSearchParams(window.location.search).get('create')


  if(id) redid = id



  
  const handleCreateTable = (): void => {
    setShowModal(true);
    redid = `${tables.length + 1}`;
  };

  const confirmCreateTable = (): void => {
    console.log(tempRows);
    console.log(tempCols);
    console.log(tempName);
    
    const newRows = parseInt(tempRows, 10);
    const newCols = parseInt(tempCols, 10);
    if (isNaN(newRows) || isNaN(newCols) || newRows <= 0 || newCols <= 0) {
        showToast("Invalid input");
        return;
    }
    if (!tempName.trim()) {
        showToast("Please enter a table name");
        return;
    }
    setRows(newRows);
    setCols(newCols);
    setTableName(tempName);
    const emptyTable = createEmptyTable(newRows, newCols);
    setTableData(emptyTable);
    setRawCellValues(emptyTable);
    console.log(newRows);
    console.log(newCols);
    console.log(tempName);
    let resStr = JSON.stringify(emptyTable);

    redid = `${tables.length + 1}`;

    console.log(redid);

    setShowModal(false);

    insertData(parseInt(redid), tempName, resStr, showToast);

    window.location.href = `${ip_this}?create=false&id=${redid}`;
  };

  const calculateFormula = (formula: string, tableData: string[][]): string => {
  
    try {
      // Remove the = sign if present
      formula = formula.replace(/^=/, '');
      
      // Replace cell references with their values
      const cellRefRegex = /([A-Z]+)(\d+)/g;
      formula = formula.replace(cellRefRegex, (match, col, row) => {
        // Convert Excel column letter to number (A=0, B=1, etc.)
        let colNum = 0;
        for (let i = 0; i < col.length; i++) {
          colNum = colNum * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0));
        }
        
        // Convert to 0-based indices
        const rowIndex = parseInt(row) - 1;
        
        // Get the cell value
        const cellValue = tableData[rowIndex]?.[colNum] || '0';
        
        // If the cell contains a formula, calculate it recursively
        if (cellValue.startsWith('=')) {
          return calculateFormula(cellValue, tableData);
        }
        
        return cellValue;
      });

      // Evaluate the formula
      return eval(formula).toString();
    } catch (error) {
      return '#ERROR!';
    }
  };

  const handleChange = (rowIndex: number, colIndex: number, value: string): void => {
    if (!tableData) return;
    
    // Initialize rawCellValues if it's null
    if (!rawCellValues) {
      setRawCellValues(tableData);
      return;
    }
    
    // Update raw values without calculating
    setRawCellValues(prevData =>
      prevData!.map((row, rIdx) =>
        row.map((cell, cIdx) => (rIdx === rowIndex && cIdx === colIndex ? value : cell))
      )
    );
  };

  const handleKeyDown = (rowIndex: number, colIndex: number, event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      calculateAndUpdateCell(rowIndex, colIndex);
      // Move focus to next cell
      const nextCell = event.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
      if (nextCell) {
        nextCell.focus();
      }
    }
  };

  const handleBlur = (rowIndex: number, colIndex: number): void => {
    calculateAndUpdateCell(rowIndex, colIndex);
  };

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

  const calculateAndUpdateCell = (rowIndex: number, colIndex: number): void => {
    if (!tableData || !rawCellValues) return;
    
    const rawValue = rawCellValues[rowIndex][colIndex];
    let finalValue = rawValue;
    
    // If the value starts with =, it's a formula
    if (rawValue.startsWith('=')) {
      finalValue = calculateFormula(rawValue, tableData);
    }
    
    // Update both tableData and rawCellValues
    setTableData(prevData =>
      prevData!.map((row, rIdx) =>
        row.map((cell, cIdx) => (rIdx === rowIndex && cIdx === colIndex ? finalValue : cell))
      )
    );
    
    setRawCellValues(prevData =>
      prevData!.map((row, rIdx) =>
        row.map((cell, cIdx) => (rIdx === rowIndex && cIdx === colIndex ? finalValue : cell))
      )
    );
  };

  const handleDelete = () => {
    DelData(parseInt(redid), showToast);
    window.location.href = `${ip_this}?create=true`
  }

  const updateData = () => {
    if (!tableData) return;
    
    console.log("tableData:", tableData)
    let resStr = JSON.stringify(tableData);
    DelData(parseInt(redid), showToast);
    insertData(parseInt(redid), tableName, resStr, showToast);
  }

  

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

  const handleLink = () => {
    const inputElement: HTMLInputElement = document.createElement('input');
    inputElement.value = `${ip_this}?create=false&id=${redid}`;
    document.body.appendChild(inputElement);
    inputElement.select();

    if (document.execCommand('copy')) {
        showToast("Link copied to clipboard!");
    } else {
        console.log("Error");
    }

    document.body.removeChild(inputElement);
  }

  const handleExport = (): void => {
    if (!tableData) return;
    exportTableToExcel(tableData);
  };

    const handleImport = (event: ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (!file) return;
      importExcelFile(file, (newTableData: string[][]) => {
        console.log("newTableData:", newTableData);
        setRows(newTableData.length);
        setCols(newTableData[0]?.length || 0);
        setTableData(newTableData);
        updateData();
      });
      showToast("Table imported successfully! Update page to see changes.");
    };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password");
      return;
    }

    const success = await login(username, password);
    if (success) {
      localStorage.setItem("username", username);
      localStorage.setItem("pass", password);
      setShowLoginModal(false);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password");
      return;
    }

    const success = await register(username, password);
    if (success) {
      setIsRegistering(false);
      setLoginError("");
      showToast("Registration successful! Please login.");
    } else {
      setLoginError("Username already exists or registration failed");
    }
  };

  const updateTableSize = (newRows: number, newCols: number): void => {
    if (!tableData) return;
    setRows(newRows);
    setCols(newCols);
    const newTableData = Array.from({ length: newRows }, (_, rIdx) =>
      Array.from({ length: newCols }, (_, cIdx) => tableData?.[rIdx]?.[cIdx] || "")
    );
    setTableData(newTableData);
    setRawCellValues(newTableData);
  };

  const convertToBoolean = (input: string): boolean => {
    try {
        return JSON.parse(input.toLowerCase());
    }
    catch (e) {
        return false
    }
  }

  const parseTableContent = (content: string): string[][] => {
    try {
      // Удаляем экранированные кавычки и заменяем их на обычные
      const cleanContent = content.replace(/\\"/g, '"');
      // Парсим JSON
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Error parsing table content:', error);
      // В случае ошибки возвращаем пустую таблицу
      return [['']];
    }
  }

  if(create && convertToBoolean(create))
    find = convertToBoolean(create)

  
  useEffect(() => {
    const loadData = () => {
        const loadedTables = getData(showToast);
        setTables(loadedTables);
        
        let found = false; // Переменная для отслеживания, найдена ли таблица

        loadedTables.forEach((table: Table) => {
            if (id != null && parseInt(id) === table.id) {
                found = true; // Устанавливаем, что таблица найдена
                const parsedContent = parseTableContent(table.content);
                setRows(parsedContent.length);
                setCols(parsedContent[0].length);
                setTableData(parsedContent);
                setRawCellValues(parsedContent);
                setTableName(table.name);
                redid = id;
                setStorageByHref(`${ip_this}?create=false&id=${redid}`);
            }
        });
        
        // Проверяем, если create=true, не устанавливаем 404
        if (!found && id != null && create !== 'true') {
            find = false;  // Устанавливаем 404, если таблица не найдена
        }
        else {
          find = true;
        }
    };

    if (!dataLoaded) { // Проверяем, загружены ли данные
        loadData();
        setDataLoaded(true); // Устанавливаем, что данные загружены
    }
  }, [dataLoaded, id, create]); // Добавляем create в зависимости

  useEffect(() => {
    if (tableData && find) {
      updateData();
    }
  }, [tableData]);

  useEffect(() => {
    const loadRecentTables = () => {
      const prev1 = localStorage.getItem("prev1");
      const prev2 = localStorage.getItem("prev2");
      const prev3 = localStorage.getItem("prev3");
      const recent = [prev1, prev2, prev3].filter((item): item is string => 
        item !== null && item !== "null"
      );
      setRecentTables(recent);
    };
    loadRecentTables();
  }, []);

  console.log(`find: ${find} create: ${(create)}`)

  if(!find)
  {
    console.log('=================')
    //window.location.href = `${ip_this}/404`
    return <div>404</div>
  }
  else{
    console.log('=================')
    return (
      <div className="app-container">
        {!tableData ? (
          <>
          <Header />
          <div className="welcome-screen">
            <h1>Welcome to Table Editor</h1>
            <p>Create and edit tables with ease</p>
            
            <div className="quick-actions">
              <button onClick={handleCreateTable} className="action-button">
                Create New Table
              </button>
            </div>
            <LastTables />
          </div>
          </>
        ) : (
          <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
            <h2>{tableName || "Untitled Table"}</h2>
            <div>
            <button style={buttonStyle} onClick={() => {
                const input = document.getElementById("import-file") as HTMLInputElement;
                input.click();
                }}>
                <input id="import-file" type="file" accept=".xlsx" onChange={(e) => {handleImport(e)}} style={{ display: 'none' }} />
                Import from Excel
              </button>
              <button style={buttonStyle} onClick={handleLink}>Copy Link</button>
              <button style={buttonStyle} onClick={handleExport}>Export to Excel</button>
              <button style={buttonStyle} onClick={handleDelete}>Delete Table</button>
            </div>
            <div>
              <button style={buttonStyle} onClick={() => {updateTableSize(rows + 1, cols); }}>+ Row</button>
              <button style={buttonStyle} onClick={() => {updateTableSize(rows > 1 ? rows - 1 : 1, cols); }}>- Row</button>
              <button style={buttonStyle} onClick={() => {updateTableSize(rows, cols + 1); }}>+ Column</button>
              <button style={buttonStyle} onClick={() => {updateTableSize(rows, cols > 1 ? cols - 1 : 1);}}>- Column</button>
            </div>
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={rowNumberCellStyle}></th>
                    {Array.from({ length: cols }, (_, i) => (
                      <th key={i} style={headerCellStyle}>
                        {getColumnLabel(i)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td style={rowNumberCellStyle}>
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} style={cellStyle}>
                          <input 
                            type="text" 
                            value={rawCellValues?.[rowIndex]?.[colIndex] ?? tableData[rowIndex][colIndex]} 
                            onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(rowIndex, colIndex, e)}
                            onBlur={() => handleBlur(rowIndex, colIndex)}
                            style={inputStyle}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showLoginModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{isRegistering ? 'Registration' : 'Login'}</h2>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              {loginError && <div className="error-message">{loginError}</div>}
              <div className="modal-buttons">
                <button onClick={isRegistering ? handleRegister : handleLogin} className="primary-button">
                  {isRegistering ? 'Register' : 'Login'}
                </button>
                <button onClick={() => setIsRegistering(!isRegistering)} className="secondary-button">
                  {isRegistering ? 'Already have an account?' : 'Create an account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              background: 'white', 
              padding: '30px', 
              borderRadius: '8px', 
              textAlign: 'center',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ marginBottom: '20px' }}>Enter Table Details</h2>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px' }}>Table Name:</label>
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)}
                  className="form-input"
                  placeholder="Enter table name"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px' }}>Rows:</label>
                <input 
                  type="number" 
                  value={tempRows} 
                  onChange={(e) => setTempRows(e.target.value)}
                  className="form-input"
                  placeholder="Enter number of rows"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px' }}>Columns:</label>
                <input 
                  type="number" 
                  value={tempCols} 
                  onChange={(e) => setTempCols(e.target.value)}
                  className="form-input"
                  placeholder="Enter number of columns"
                />
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button style={buttonStyle} onClick={confirmCreateTable}>Create</button>
                <button style={{...buttonStyle, background: '#666'}} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div style={toastWrapperStyle}>
          <div style={borderStyle}></div>
          <div style={toastStyle}>
            {toast.message}
          </div>
        </div>
      </div>
    );
  }
}

const getColumnLabel = (index: number): string => {
  let label = '';
  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
};

const buttonStyle = {
  padding: '10px 20px',
  margin: '5px',
  fontSize: '16px',
  cursor: 'pointer',
  background: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s'
};

const buttonHoverStyle: React.CSSProperties = {
  transform: 'scale(1.05)',
  boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
  background: '#45a049'
};

const tableContainerStyle: React.CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  marginTop: '10px',
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#fff',
  borderRadius: '10px',
  overflow: 'hidden',
};

const cellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'center',
  minWidth: '100px',
  width: 'auto'
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: '#f5f5f5',
  fontWeight: 'bold',
  position: 'sticky',
  top: 0,
  zIndex: 1
};

const rowNumberCellStyle: React.CSSProperties = {
  ...headerCellStyle,
  width: '40px',
  minWidth: '40px',
  position: 'sticky',
  left: 0,
  zIndex: 2
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  textAlign: 'center',
  outline: 'none'
};

const aStyle = {
  color: '#4CAF50',
  textDecoration: 'none',
  transition: 'color 0.3s'
};

const startInputStyle: React.CSSProperties = {
  border: '1px solid #4CAF50'
}

export default App;