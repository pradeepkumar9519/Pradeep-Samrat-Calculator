let currentInput = "";
let history = [];
let hiddenFiles = [];
let currentFolder = "root";
let password = null;
let welcomeSaid = false;

const display = document.getElementById("display");
const result = document.getElementById("result");
const historyList = document.getElementById("historyList");
const hiddenSection = document.getElementById("hiddenSection");
const folderList = document.getElementById("folderList");
const fileList = document.getElementById("fileList");
const introScreen = document.getElementById("introScreen");

// Splash screen + welcome
function loadPassword() {
    getPasswordFromDB(() => {
        setTimeout(() => {
            introScreen.style.display = "none";
            document.getElementById("calculatorApp").style.display = "block";
            speakWelcome(); // Call welcome voice here
        }, 2000);
    });
}

function speakWelcome() {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        speechSynthesis.onvoiceschanged = () => {
            speakWelcome(); // Retry after voices load
        };
        return;
    }
    if (!welcomeSaid) {
        const welcome = new SpeechSynthesisUtterance(
            "Welcome to Pradeep Samrat Calculator, Aapka swagat hai Pradeep Samrat Calculator mein."
        );
        welcome.voice = voices.find(voice => voice.lang.startsWith('hi')) || voices[0];
        speechSynthesis.speak(welcome);
        welcomeSaid = true;
    }
}

// Calculator functionality
function appendToDisplay(value) {
    currentInput += value;
    display.textContent = currentInput;
}

function clearDisplay() {
    currentInput = "";
    display.textContent = "";
    result.textContent = "";
}

function backspace() {
    currentInput = currentInput.slice(0, -1);
    display.textContent = currentInput;
}

function calculate() {
    try {
        let res = eval(currentInput);
        result.textContent = "= " + res;
        history.push(currentInput + " = " + res);
        updateHistory();
        currentInput = res.toString();
    } catch {
        result.textContent = "Error";
    }
}

function updateHistory() {
    historyList.innerHTML = "";
    history.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        historyList.appendChild(li);
    });
    saveHistoryToDB();
}

// File manager functionality using IndexedDB
function getDB(callback) {
    const request = indexedDB.open("CalculatorDB", 1);
    request.onerror = () => console.error("DB error");
    request.onsuccess = () => callback(request.result);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
        db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
        db.createObjectStore("password", { keyPath: "id" });
    };
}

function savePasswordToDB(pwd) {
    getDB(db => {
        const tx = db.transaction("password", "readwrite");
        tx.objectStore("password").put({ id: "userPassword", value: pwd });
        tx.oncomplete = () => console.log("Password saved");
    });
}

function getPasswordFromDB(callback) {
    getDB(db => {
        const tx = db.transaction("password", "readonly");
        const req = tx.objectStore("password").get("userPassword");
        req.onsuccess = () => {
            password = req.result ? req.result.value : null;
            callback();
        };
    });
}

function saveHistoryToDB() {
    getDB(db => {
        const tx = db.transaction("history", "readwrite");
        const store = tx.objectStore("history");
        store.clear().onsuccess = () => {
            history.forEach(item => store.add({ value: item }));
        };
    });
}

function loadHistoryFromDB() {
    getDB(db => {
        const tx = db.transaction("history", "readonly");
        const store = tx.objectStore("history");
        const req = store.getAll();
        req.onsuccess = () => {
            history = req.result.map(r => r.value);
            updateHistory();
        };
    });
}

function showHiddenSection() {
    document.getElementById("calculatorApp").style.display = "none";
    hiddenSection.style.display = "block";
    displayFiles();
}

function hideHiddenSection() {
    document.getElementById("calculatorApp").style.display = "block";
    hiddenSection.style.display = "none";
}

function checkPassword() {
    const inputPwd = prompt("Enter password:");
    if (inputPwd === password) {
        showHiddenSection();
    } else {
        alert("Wrong password");
    }
}

function setNewPassword() {
    const newPwd = prompt("Set a new password:");
    if (newPwd) {
        password = newPwd;
        savePasswordToDB(password);
        alert("Password set successfully!");
    }
}

function uploadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const fileData = {
            name: file.name,
            type: file.type,
            data: reader.result,
            folder: currentFolder
        };
        saveFileToDB(fileData, displayFiles);
    };
    reader.readAsDataURL(file);
}

function saveFileToDB(fileData, callback) {
    getDB(db => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").add(fileData);
        tx.oncomplete = () => {
            console.log("File saved");
            if (callback) callback();
        };
    });
}

function displayFiles() {
    fileList.innerHTML = "";
    getDB(db => {
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const req = store.getAll();
        req.onsuccess = () => {
            req.result.forEach(file => {
                if (file.folder === currentFolder) {
                    const li = document.createElement("li");
                    if (file.type.startsWith("image/")) {
                        li.innerHTML = `<img src="${file.data}" width="100"><br>${file.name}`;
                    } else if (file.type.startsWith("video/")) {
                        li.innerHTML = `<video width="150" controls><source src="${file.data}" type="${file.type}"></video><br>${file.name}`;
                    } else {
                        li.textContent = file.name;
                    }
                    fileList.appendChild(li);
                }
            });
        };
    });
}

function createFolder() {
    const folderName = prompt("Folder name:");
    if (folderName) {
        const option = document.createElement("option");
        option.value = folderName;
        option.textContent = folderName;
        folderList.appendChild(option);
    }
}

function changeFolder() {
    currentFolder = folderList.value;
    displayFiles();
}
