const startBtn = document.getElementById("startBtn");
const input = document.getElementById("player");
const timeCounter = document.querySelector("#counter span");
const divCards = document.getElementById("cards");
const divResults = document.getElementById("results");
const resultButtons = document.querySelectorAll("#results button");

let totalPairs; 
let player = null; 
const table = document.createElement("table");
let clock;
let matchedImages;
let arrayCardsPermutation = [];

let cardsAddresses = []; 
for (let i = 1; i <= 50; i++) {
    cardsAddresses.push(`slike/${i}.png`);
}

let arrayPermutation = (arr) => { 
    let n = arr.length;
    for (let i = n - 1; i >= 1; i--) {
        let randomIndex = Math.floor(Math.random() * (i + 1));
        let x = arr[i];
        arr[i] = arr[randomIndex];
        arr[randomIndex] = x;
    }
    return arr;
}

let startGame = () => {
    matchedImages = [];
    const radioBtn = document.querySelector("input[name='category']:checked");
    player = { 
        name: input.value,
        level: radioBtn.value,
        time: 0
    }

    if (clock === undefined) {
        let timer = 0;
        clock = setInterval(() => {
            timer++;
            timeCounter.innerHTML = `${timer}`;
        }, 1000);
    }

    if (radioBtn.value == "easy") {
        size = 4;
        totalPairs = 8;
    } else if (radioBtn.value == "medium") {
        size = 6;
        totalPairs = 18;
    } else if (radioBtn.value == "hard") {
        size = 8;
        totalPairs = 32;
    } else {
        size = 10;
        totalPairs = 50;
    }
    displayCards(size);
    let selectedArray = arrayPermutation(cardsAddresses).slice(0, totalPairs);
    let selectesArrayCards = [...selectedArray, ...selectedArray]; 
    arrayCardsPermutation = arrayPermutation(selectesArrayCards);
}

startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (input.value !== "") {
        clearInterval(clock);
        clock = undefined;
        startGame();
    } else {
        swal("Username is requred!");
    }
});

let displayCards = (n) => {
    divCards.innerHTML = "";
    let counter = 0;
    for (let i = 0; i < n; i++) {
        const br = document.createElement("br");
        for (let j = 0; j < n; j++) {
            const img = document.createElement("img");
            img.src = "slike/closed-card.png";
            img.addEventListener("click", flipCard);
            img.setAttribute("id", counter);
            divCards.appendChild(img);
            counter++;
        }
        divCards.appendChild(br);
    }
}

let stopTimer = () => {
    player.time = timeCounter.textContent;

    db.collection("players").doc()
    .set(player)
    .then(() => {
        console.log("Successfully added player");
    })
    .catch(err => {
        console.log(`Error: ${err}`);
    });

    clearInterval(clock);
    clock = undefined;
    setTimeout(() => {
        if (confirm("Game over! Do you want to play a new game?") == true) {
            if (input.value !== "") {
                startGame();
            } else {
                swal("Username is requred!")
            }
        } else {
            console.log("Leave cards open");
        }
    }, 100);
}

let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;

function flipCard(e) {
    if (lockBoard) return; 
    if (e.target === firstCard) return; 

    const img = e.target;
    const index = img.getAttribute("id");

    if(!matchedImages.includes(img.src)) { 
        img.src = arrayCardsPermutation[index];
    }

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = img;
    } else {
        hasFlippedCard = false;
        secondCard = img;

        if (firstCard.src === secondCard.src) {
            matchedImages.push(firstCard.src);
            firstCard.removeEventListener("click", flipCard);
            secondCard.removeEventListener("click", flipCard);
            resetBoard();

            if (matchedImages.length === totalPairs) { 
                stopTimer();
            }

        } else {
            lockBoard = true;
            setTimeout(() => {
                firstCard.src = "slike/closed-card.png";
                secondCard.src = "slike/closed-card.png";
                resetBoard();
            }, 1000);
        }
    }
}

function resetBoard() {
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
}

resultButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
        showResults(e.target.dataset.name);
    })
});

async function showResults(gameLevel) {
    table.innerHTML = "";
    const th1 = document.createElement("th");
    th1.textContent = "Rank";
    const tr = document.createElement("tr");
    const th2 = document.createElement("th");
    th2.textContent = "Username";
    const th3 = document.createElement("th");
    th3.textContent = "Time";
    tr.append(th1, th2, th3);
    table.append(tr);

    let levelResults = [];
    await db.collection("players")
    .orderBy("time", "asc")
    .get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            if (doc.data().level == gameLevel) {
                console.log(doc.data());
                levelResults.push(doc.data());
            }
        });
    })
    .catch(err => {
        console.log(`Error gtting documents: ${err}`);
    });

    if (levelResults.length === 0) {
        const trNoResults = document.createElement("tr");
        const tdNoResults = document.createElement("td");
        tdNoResults.setAttribute("colspan", "3");
        tdNoResults.textContent = "There are no results for the selected level.";
        trNoResults.append(tdNoResults);
        table.append(trNoResults);
    } else {
        levelResults.slice(0, 5).forEach((player, i) => {
            const tr = document.createElement("tr");
            const td1 = document.createElement("td");
            td1.textContent = `${i + 1}.`;
            const td2 = document.createElement("td");
            td2.textContent = player.name;
            const td3 = document.createElement("td");
            td3.textContent = player.time;
            tr.append(td1, td2, td3);
            table.append(tr);
        });
    }
    divResults.append(table);
}