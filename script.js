// Splash screen
window.onload = () => {
  setTimeout(() => {
    document.getElementById("splash").classList.add("hidden");
    document.getElementById("mainApp").classList.remove("hidden");
    initDB();
  }, 2500);
};

// Calculator logic
let display = document.getElementById("display");
let history = document.getElementById("history");

function append(value) {
  display.value += value;
}

function clearDisplay() {
  history.innerText = display.value;
  display.value = "";
}

function backspace() {
  display.value = display.value.slice(0, -1);
}

function calculate() {
  try {
    history.innerText = display.value;
    display.value = eval(display.value);
  } catch {
    display.value = "Error";
  }
}

// Password access
function checkPassword() {
  const password = prompt("Enter password:");
  if (password === "1234") {
    document.getElementById("mainApp").classList.add("hidden");
    document.getElementById("fileManager").classList.remove("hidden");
    loadFolders();
  } else {
    alert("Incorrect Password");
  }
}

function logout() {
  document.getElementById("fileManager").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");
}

// File Manager with IndexedDB
let db;

function initDB() {
  const request = indexedDB.open("HiddenFilesDB", 1);
  request.onupgradeneeded = function (e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains("files")) {
      const store = db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
      store.createIndex("folder", "folder", { unique: false });
    }
  };
  request.onsuccess = function (e) {
    db = e.target.result;
    loadFolders();
  };
}

function createFolder() {
  const name = prompt("Folder name:");
  if (name) {
    localStorage.setItem("folder_" + name, name);
    loadFolders();
  }
}

function loadFolders() {
  const folderDiv = document.getElementById("folders");
  folderDiv.innerHTML = "";
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    if (key.startsWith("folder_")) {
      const folderName = localStorage.getItem(key);
      const btn = document.createElement("button");
      btn.textContent = folderName;
      btn.onclick = () => loadFiles(folderName);
      folderDiv.appendChild(btn);
    }
  }
}

function handleFiles(event) {
  const files = event.target.files;
  const folder = prompt("Save in folder:");
  if (!folder) return;

  const tx = db.transaction("files", "readwrite");
  const store = tx.objectStore("files");

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const fileData = {
        name: file.name,
        type: file.type,
        content: e.target.result,
        folder: folder
      };
      store.add(fileData);
    };
    reader.readAsDataURL(file);
  });

  tx.oncomplete = () => {
    alert("Files saved!");
    loadFiles(folder);
  };
}

function loadFiles(folder) {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = `<h3>${folder}</h3>`;
  const tx = db.transaction("files", "readonly");
  const store = tx.objectStore("files");
  const index = store.index("folder");
  const request = index.getAll(IDBKeyRange.only(folder));
  
  request.onsuccess = () => {
    request.result.forEach(file => {
      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = file.content;
        img.width = 200;
        fileList.appendChild(img);
      } else if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = file.content;
        video.controls = true;
        video.width = 250;
        fileList.appendChild(video);
      }
    });
  };
}
