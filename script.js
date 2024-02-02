// Pozivam elemente iz DOM-a
const startBtn = document.getElementById("startBtn");
const input = document.getElementById("player");
const timeCounter = document.querySelector("#counter span");
const divCards = document.getElementById("cards");
const divResults = document.getElementById("results");
const resultButtons = document.querySelectorAll("#results button");

// Pomocne promenjive 
let totalPairs; 
let player = null; 
let players = []; // niz igraca koji se cuva u localStorage -> napraviti i verziju sa Firebase
const table = document.createElement("table");
let clock;
let matchedImages;
let arrayCardsPermutation = [];

// Prikaz rezultata iz localStorag-a
if (localStorage.getItem("results") == null) { 
    localStorage.setItem("results", JSON.stringify(players));
} else {
    resultButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            showResults(e.target.dataset.name);
        })
    });
}

// Pocetak igre, tj. dohvatanje slika sa kojima cu dalje manipulisati u igrici
let cardsAddresses = []; 
for (let i = 1; i <= 50; i++) {
    cardsAddresses.push(`slike/${i}.png`);
}

// Funkcija za permutaciji, tj. generisanje slika
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

// Sa ovom funkcijom pocinjemo igru
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

// Event listener, koji trigeruje dugme START
startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (input.value !== "") {
        clearInterval(clock);
        clock = undefined;
        startGame();
    } else {
        // alert("Prvo moras upisati ime, pa tek onda zapoceti igru!");
        swal("Username is requred!")
    }
});

// Funkcija koja prikazuje slicice (kartice) na ekranu
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

// Funkcija koja zaustavlja vreme, tj. kraj igrice
let stopTimer = () => {
    player.time = timeCounter.textContent;
    // Ovdje napravi niz objekata koji ce se kada se zavrsi igra upisati u localStorage
    players.push(player);
    localStorage.setItem("results", JSON.stringify(players));
    
    clearInterval(clock);
    clock = undefined;
    // swal({
    //     title: "Do you want to play a new game?", 
    //     nuttons: true,
    //     // icon: "warning",
    //     buttons: true,
    //     // dangerMode: true,
    // })
    // .then((ok) => {
    //     if (ok) {
    //         swal("zapocinjes novu igru!");
    //         startGame(); 
    //         matchedCards = 0
    //     } else {
    //         swal("ne nastavljas dalje sa igrom");
    //         matchedCards = 0; 
    //     }
    // });
    
    if (confirm("Do you want to play a new game?") == true) {
        if (input.value !== "") {
            startGame();
        } else {
            // alert("Prvo moras upisati ime, pa tek onda zapoceti igru!");
            swal("Username is requred!")
        }
    } else {
        console.log("ostavi kartice otvorene");
    }
}


let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;

function flipCard(e) {
    if (lockBoard) return; // ako je zakljucana tabla onda ne mogu otvarati kartice
    if (this === firstCard) return; // ne ako je ponov oklinkuto na prvi karticu, ne dozvoljava mu da joj ponovo dodeljuje vrednosti firstCard i secondCard

    this.classList.add("flip"); // dodati neku tranziciju i animaciju u css
    const img = e.target;
    const index = img.getAttribute("id");

    if(!matchedImages.includes(img.src)) { // provjera da li je vec slika u matchovanom nizu kartica
        img.src = arrayCardsPermutation[index];
    }

    if (!hasFlippedCard) {
        // first click
        hasFlippedCard = true;
        // firstCard = this;
        firstCard = img;
        console.log("firstCard", firstCard);
    } else {
        // second click
        hasFlippedCard = false;
        // secondCard = this;
        secondCard = img;
        console.log("secondCard", secondCard);

        // do cards match?
        if (firstCard.src === secondCard.src) {
            matchedImages.push(firstCard.src);
            // it's a match!!
            firstCard.removeEventListener("click", flipCard); // ovo znaci da kada su otovrene ne mogu se ponovo otvorititi, ali ja zelim da se firstCard kada posotji ne mozemo ponovo da se klikne na njega
            secondCard.removeEventListener("click", flipCard);
            resetBoard();

            if (matchedImages.length === totalPairs) { // provera da li je igrica zavrsena
                stopTimer();
                console.log(matchedImages);
            }
        } else {
            // not a match
            lockBoard = true;
            setTimeout(() => {
                // firstCard.classList.remove("flip"); // obrisisati animaciju kartice kada se zatvori
                // secondCard.classList.remove("flip");
                firstCard.src = "slike/closed-card.png";
                secondCard.src = "slike/closed-card.png";

                // lockBoard = false;
                resetBoard();
            }, 1000);
        }
    }

    function resetBoard() {
        hasFlippedCard = false;
        lockBoard = false;
        firstCard = null;
        secondCard = null;
        // [hasFlippedCard, lockBoard] = [false, false]; // es6 - destucturing assingment
    }
}

// Prikazivanje rezultata u tabeli u zavisnoti od kliknutog nivoa
function showResults(gameLevel) {
    table.innerHTML = "";
    const th1 = document.createElement("th");
    th1.textContent = "Mesto";
    const tr = document.createElement("tr");
    const th2 = document.createElement("th");
    th2.textContent = "Korisnicko ime";
    const th3 = document.createElement("th");
    th3.textContent = "Vreme";
    tr.append(th1, th2, th3);
    table.append(tr);
    
    players = JSON.parse(localStorage.getItem("results")); // niz objekata
    let levelResults = [];
    players.forEach(player => {
        if (player.level == gameLevel) {
            levelResults.push(player);
        }
    });
    levelResults.sort((a, b) => {
        return a.time - b.time 
    }).slice(0, 5).forEach((player, i) => {
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
    divResults.append(table);
}