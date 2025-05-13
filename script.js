// Splash screen
window.onload = () => {
    setTimeout(() => {
        document.getElementById("introScreen").style.display = "none";
        document.getElementById("calculatorApp").style.display = "block";
        loadHistory();
        openDatabase();
    }, 2000);
};

// Calculator Logic
let display = document.getElementById("display");
let liveResult = document.getElementById("liveResult");

function appendValue(value) {
    if (display.innerText === "0") display.innerText = "";
    display.innerText += value;
    try {
        liveResult.innerText = eval(display.innerText);
    } catch {
        liveResult.innerText = "";
    }
}

function clearDisplay() {
    display.innerText = "0";
    liveResult.innerText = "";
}

function backspace() {
    display.innerText = display.innerText.slice(0, -1);
    if (display.innerText === "") display.innerText = "0";
    try {
        liveResult.innerText = eval(display.innerText);
    } catch {
        liveResult.innerText = "";
    }
}

function calculate() {
    try {
        const result = eval(display.innerText);
        addToHistory(display.innerText, result);
        display.innerText = result;
        liveResult.innerText = "";
    } catch {
        display.innerText = "Error";
    }
}

// History using IndexedDB
let db;

function openDatabase() {
    const request = indexedDB.open("CalculatorDB", 1);
    request.onerror = () => alert("Database error!");
    request.onsuccess = () => {
        db = request.result;
        displayFiles();
    };
    request.onupgradeneeded = (e) => {
        db = e.target.result;
        db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
        db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
    };
}

function addToHistory(expression, result) {
    const tx = db.transaction("history", "readwrite");
    tx.objectStore("history").add({ expression, result });
    tx.oncomplete = () => loadHistory();
}

function loadHistory() {
    const tx = db.transaction("history", "readonly");
    const store = tx.objectStore("history");
    const request = store.getAll();
    request.onsuccess = () => {
        const list = document.getElementById("historyList");
        list.innerHTML = "";
        request.result.reverse().forEach((item) => {
            const li = document.createElement("li");
            li.innerText = `${item.expression} = ${item.result}`;
            list.appendChild(li);
        });
    };
}

function showHistory() {
    document.getElementById("historySection").style.display = "block";
}

function hideHistory() {
    document.getElementById("historySection").style.display = "none";
}

// File Manager using IndexedDB
document.getElementById("fileInput").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function () {
            const tx = db.transaction("files", "readwrite");
            tx.objectStore("files").add({
                name: file.name,
                type: file.type,
                data: reader.result
            });
            tx.oncomplete = displayFiles;
        };
        reader.readAsDataURL(file);
    }
});

function displayFiles() {
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const request = store.getAll();
    request.onsuccess = () => {
        const fileList = document.getElementById("fileList");
        fileList.innerHTML = "";
        request.result.forEach((file) => {
            const container = document.createElement("div");
            container.className = "file-item";
            if (file.type.startsWith("image")) {
                const img = document.createElement("img");
                img.src = file.data;
                container.appendChild(img);
            } else if (file.type.startsWith("video")) {
                const video = document.createElement("video");
                video.src = file.data;
                video.controls = true;
                container.appendChild(video);
            }
            const renameBtn = document.createElement("button");
            renameBtn.className = "rename-btn";
            renameBtn.innerText = "Rename";
            renameBtn.onclick = () => {
                const newName = prompt("Enter new file name:", file.name);
                if (newName) {
                    const tx = db.transaction("files", "readwrite");
                    const store = tx.objectStore("files");
                    store.put({ ...file, name: newName });
                    tx.oncomplete = displayFiles;
                }
            };

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.innerText = "Delete";
            deleteBtn.onclick = () => {
                const tx = db.transaction("files", "readwrite");
                const store = tx.objectStore("files");
                store.delete(file.id);
                tx.oncomplete = displayFiles;
            };

            container.appendChild(renameBtn);
            container.appendChild(deleteBtn);
            fileList.appendChild(container);
        });
    };
}

function exitFileManager() {
    document.getElementById("fileManager").style.display = "none";
}

// Secret Password to Open File Manager
display.addEventListener("click", () => {
    const password = prompt("Enter Secret Password:");
    if (password === "1234") {
        document.getElementById("fileManager").style.display = "block";
        displayFiles();
    }
});
