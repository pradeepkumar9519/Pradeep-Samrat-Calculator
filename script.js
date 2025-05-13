const display = document.getElementById('display');
const liveResult = document.getElementById('liveResult');
const buttonsDiv = document.getElementById('buttons');
const fileManager = document.getElementById('fileManager');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const introScreen = document.getElementById('introScreen');

let db;
const dbName = 'CalculatorAppDB';
const passwordStore = 'passwords';
const historyStore = 'calculationHistory';
const filesStore = 'hiddenFiles';

let storedPassword = null;
let settingNewPass = false;
let welcomeSaid = false; // Add this line

// Initialize IndexedDB
const request = indexedDB.open(dbName, 1);

request.onerror = function(event) {
    console.error("Database error: " + event.target.errorCode);
};

request.onsuccess = function(event) {
    db = event.target.result;
    loadPassword();
};

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(passwordStore)) {
        db.createObjectStore(passwordStore);
    }
    if (!db.objectStoreNames.contains(historyStore)) {
        db.createObjectStore(historyStore, { autoIncrement: true });
    }
    if (!db.objectStoreNames.contains(filesStore)) {
        db.createObjectStore(filesStore, { autoIncrement: true });
    }
};

function savePasswordToDB(password) {
    const transaction = db.transaction([passwordStore], 'readwrite');
    const store = transaction.objectStore(passwordStore);
    store.clear();
    store.add(password, 'hiddenPass');
    transaction.oncomplete = () => {
        loadPassword();
    };
}

function getPasswordFromDB(callback) {
    const transaction = db.transaction([passwordStore], 'readonly');
    const store = transaction.objectStore(passwordStore);
    const request = store.get('hiddenPass');
    request.onsuccess = function() {
        storedPassword = request.result;
        callback();
    };
    request.onerror = function() {
        storedPassword = null;
        callback();
    };
}


function loadPassword() {
    getPasswordFromDB(() => {
        setTimeout(() => {
            introScreen.style.display = "none";
            document.getElementById("calculatorApp").style.display = "block";
             if (!welcomeSaid) {
                const welcome = new SpeechSynthesisUtterance(
                    "Welcome to Pradeep Samrat Calculator, Aapka swagat hai Pradeep Samrat Calculator mein."
                );
                speechSynthesis.speak(welcome);
                welcomeSaid = true;
            }
        }, 2000);
    });
}

function appendValue(val) {
    if (display.textContent === '0') display.textContent = val;
    else display.textContent += val;
    updateLiveResult();
}

function clearDisplay() {
    display.textContent = '0';
    liveResult.textContent = '';
}

function backspace() {
    if (display.textContent.length > 1)
        display.textContent = display.textContent.slice(0, -1);
    else display.textContent = '0';
    updateLiveResult();
}

function updateLiveResult() {
    try {
        const input = display.textContent;
        if (input.trim() === '' || input === '0') {
            liveResult.textContent = '';
            return;
        }
        const percentageHandled = input.replace(/(\d+(?:\.\d+)?)\s*%\s*(\d+(?:\.\d+)?)/g, '($1*$2/100)');
        const result = eval(percentageHandled);
        liveResult.textContent = isNaN(result) ? '' : `= ${result}`;
    } catch {
        liveResult.textContent = '';
    }
}

function saveToHistory(entry) {
    const transaction = db.transaction([historyStore], 'readwrite');
    const store = transaction.objectStore(historyStore);
    store.add(entry);
}

function loadHistory() {
    historyList.innerHTML = '';
    const transaction = db.transaction([historyStore], 'readonly');
    const store = transaction.objectStore(historyStore);
    const request = store.openCursor(null, 'prev');
    let count = 0;
    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor && count < 10) {
            const li = document.createElement('li');
            li.textContent = cursor.value;
            historyList.appendChild(li);
            cursor.continue();
            count++;
        }
    };
}

function showHistory() {
    buttonsDiv.style.display = 'none';
    historySection.style.display = 'block';
    loadHistory();
}

function hideHistory() {
    historySection.style.display = 'none';
    buttonsDiv.style.display = 'grid';
    display.textContent = '0';
    liveResult.textContent = '';
}

function calculate() {
    const input = display.textContent.trim();

    if (/^[+\-*/%()√]+$/.test(input) || input.includes('**')) {
        const msg = new SpeechSynthesisUtterance(
            "Welcome to Pradeep Samrat Calculator, Aapka swagat hai Pradeep Samrat Calculator mein."
        );
        speechSynthesis.speak(msg);
        return;
    }

    if (input === '1234' && !storedPassword) {
        settingNewPass = true;
        display.textContent = 'Set New Pass';
        liveResult.textContent = '';
        return;
    }

    if (settingNewPass) {
        if (input.length === 4) {
            savePasswordToDB(input);
            settingNewPass = false;
            alert('New password set successfully!');
            display.textContent = '0';
        } else {
            alert('Enter 4-digit password only.');
        }
        return;
    }

    if (storedPassword && input === storedPassword) {
        openFileManager();
        display.textContent = '0';
        liveResult.textContent = '';
        return;
    }

    try {
        const percentageHandled = input.replace(/(\d+(?:\.\d+)?)\s*%\s*(\d+(?:\.\d+)?)/g, '($1*$2/100)');
        const result = eval(percentageHandled);
        saveToHistory(`${input} = ${result}`);
        display.textContent = result;
        liveResult.textContent = '';
    } catch (error) {
        display.textContent = 'Error';
        liveResult.textContent = '';
        console.error("Calculation error:", error);
    }
}

function openFileManager() {
    buttonsDiv.style.display = 'none';
    historySection.style.display = 'none';
    fileManager.style.display = 'block';
    loadFiles();
}

function exitFileManager() {
    fileManager.style.display = 'none';
    buttonsDiv.style.display = 'grid';
    display.textContent = '0';
    liveResult.textContent = '';
}

fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            saveFileToDB({ name: file.name, data: reader.result, type: file.type });
        };
        reader.onerror = (error) => {
            console.error("FileReader Error:", error);
            alert("Error reading file.  See console for details.");
        }
        reader.readAsDataURL(file);
    });
});

function saveFileToDB(fileData) {
    const transaction = db.transaction([filesStore], 'readwrite');
    const store = transaction.objectStore(filesStore);
    const addRequest = store.add(fileData);
    addRequest.onsuccess = () => {
        loadFiles();
    };
    transaction.onerror = (error) => {
        console.error("Transaction Error (saveFileToDB):", error);
        alert("Error saving file. See console for details.");
    };
}

function loadFiles() {
    fileList.innerHTML = '';
    const transaction = db.transaction([filesStore], 'readonly');
    const store = transaction.objectStore(filesStore);
    const request = store.openCursor();
    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const file = cursor.value;
            const fileDiv = document.createElement('div');
            fileDiv.classList.add('file-item');
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = file.data;
                fileDiv.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = file.data;
                video.controls = true;
                video.volume = 1.0;
                fileDiv.appendChild(video);
            } else {
                const p = document.createElement('p');
                p.textContent = `File: ${file.name}`;
                fileDiv.appendChild(p);
            }
            const renameBtn = document.createElement('button');
            renameBtn.classList.add('rename-btn');
            renameBtn.textContent = 'Rename';
            renameBtn.onclick = () => renameFile(cursor.key, file.name);
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteFile(cursor.key);
            fileDiv.appendChild(renameBtn);
            fileDiv.appendChild(deleteBtn);
            fileList.appendChild(fileDiv);
            cursor.continue();
        }
    };
    request.onerror = (error) => {
        console.error("Error loading files:", error);
        alert("Error loading files. See console for details.");
    };
}

function renameFile(key, oldName) {
    const newName = prompt('Enter new file name:', oldName);
    if (newName) {
        const transaction = db.transaction([filesStore], 'readwrite');
        const store = transaction.objectStore(filesStore);
        const getRequest = store.get(key);
        getRequest.onsuccess = function() {
            const file = getRequest.result;
            file.name = newName;
            const updateRequest = store.put(file, key);
            updateRequest.onsuccess = () => {
                loadFiles();
            };
            updateRequest.onerror = (error) => {
                console.error("Error renaming file:", error);
                alert("Error renaming file. See console for details.");
            };
        };
        getRequest.onerror = (error) => {
            console.error("Error getting file for rename:", error);
            alert("Error accessing file. See console for details.");
        };
    }
}

function deleteFile(key) {
    const transaction = db.transaction([filesStore], 'readwrite');
    const store = transaction.objectStore(filesStore);
    const request = store.delete(key);
    request.onsuccess = () => {
        loadFiles();
    };
    request.onerror = (error) => {
        console.error("Error deleting file:", error);
        alert("Error deleting file. See console for details.");
    };
}

// Splash screen + Welcome voice
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        introScreen.style.display = "none";
        document.getElementById("calculatorApp").style.display = "block";
        if (!welcomeSaid) {
            const welcome = new SpeechSynthesisUtterance(
                "Welcome to Pradeep Samrat Calculator, Aapka swagat hai Pradeep Samrat Calculator mein."
            );
            speechSynthesis.speak(welcome);
            welcomeSaid = true;
        }
    }, 2000);
});
