let display = document.getElementById("display");
let liveResult = document.getElementById("liveResult");
let history = [];

function appendValue(val) {
  if (display.innerText === "0") display.innerText = val;
  else display.innerText += val;
  updateLiveResult();
}

function clearDisplay() {
  display.innerText = "0";
  liveResult.innerText = "";
}

function backspace() {
  let text = display.innerText;
  display.innerText = text.length > 1 ? text.slice(0, -1) : "0";
  updateLiveResult();
}

function calculate() {
  try {
    let result = eval(display.innerText);
    liveResult.innerText = "= " + result;
    history.push(display.innerText + " = " + result);
  } catch {
    liveResult.innerText = "Error";
  }
}

function updateLiveResult() {
  try {
    let result = eval(display.innerText);
    liveResult.innerText = "= " + result;
  } catch {
    liveResult.innerText = "";
  }
}

function showHistory() {
  document.getElementById("buttons").style.display = "none";
  document.getElementById("historySection").style.display = "block";
  let list = document.getElementById("historyList");
  list.innerHTML = "";
  history.slice().reverse().forEach(entry => {
    let li = document.createElement("li");
    li.innerText = entry;
    list.appendChild(li);
  });
}

function hideHistory() {
  document.getElementById("buttons").style.display = "grid";
  document.getElementById("historySection").style.display = "none";
}
