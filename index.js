const loader = document.getElementById('loader-container');
const mainFrame = document.getElementById('main-frame');
const practiceChatContainer = document.getElementById('practice-chat-container');
const practiceChatInput = document.getElementById('practice-chat-input');
const practiceChatSubmit = document.getElementById('practice-chat-submit');
const practiceRetryButton = document.getElementById('practice-retry-btn');
const ratingContainer = document.getElementById('rating-container');
const ratingExplanation = document.getElementById('rating-explanation');
let conversation = [];
let reply = '';
let practiceLang = 'en';

if (practiceRetryButton) {
    practiceRetryButton.addEventListener('click', () => {
        startPractice(practiceLang);
    }
)};

let isTokenMenuOpen = false;
let currentToken = localStorage.getItem('token') || 'null';
getUsesLeft();
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const uploadContainer = document.getElementById('upload-container');
            uploadContainer.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" id="picture"><input type="file" id="file-input" accept="image/*" onchange="handleFileUpload(event)">`;
        };

        reader.readAsDataURL(file);

        let formData = new FormData();
        formData.append('file', file);
        formData.append('token', localStorage.getItem('token'));

        try {
            startLoading();
            const response = await fetch('https://zakarias.dev.ipw.dk:5500/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.status === 401) {
                stopLoading();
                const output = document.getElementById('output');
                output.innerHTML = `<p>Invalid token</p>`;
                return;
            }

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            console.log(data);
            const output = document.getElementById('output');
            const copyButton = document.getElementById('copy-btn');

            if (data.gptFinalSuggestion) {
                output.innerHTML = `            
                <div id="copy-btn" onclick="copyOutput()">
                    <img src="copy.png" id="copy-icon">
                </div>
                <div id="output-message">${data.gptFinalSuggestion}</div>`;
                getUsesLeft();
                stopLoading();
            } else {
                output.innerHTML = `<p>Error. Response data: ${JSON.stringify(data)}</p>`;
            }
        } catch (error) {
            stopLoading();
            console.error('Error uploading file:', error);
            const output = document.getElementById('output');
            output.innerHTML = `<p>Error processing file: ${error.message}</p>`;
        }
    }
}

function copyOutput() {
    var copyText = document.getElementById("output-message");
  
    navigator.clipboard.writeText(copyText.innerText);
  
    alert("Copied to clipboard!");
}

const tokenInput = document.getElementById('token-input');
if (tokenInput) {
    tokenInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            submitToken();
        }
    });
}

const tokenSubmit = document.getElementById('token-submit');
if (tokenSubmit) {
    tokenSubmit.addEventListener("click", (event) => {
        submitToken();
    });
}


function submitToken() {
    currentToken = tokenInput.value;
    tokenInput.value = '';
    localStorage.setItem('token', currentToken);
    getUsesLeft(true);
}

function getUsesLeft(isTokenSubmit = false) {
    startLoading();
    fetch('https://zakarias.dev.ipw.dk:5500/uses', {
        method: 'POST',
        body: JSON.stringify({ token: localStorage.getItem('token') }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => {
            stopLoading();
            if (!response.ok) {
                newNotification(`Server isn't working properly`, 'bad');
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const usesLeft = document.getElementById('uses-left');
            usesLeft.innerHTML = "🪙 " + data.usesLeft;
            if (isTokenSubmit) {
                newNotification(`${localStorage.getItem('token')} has ${data.usesLeft} uses left`, 'good');
            }

        })
        .catch((error) => {
            newNotification(`Server isn't working properly`, 'bad');
            console.error('Error:', error);
        });
}

function newNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.classList.add(type);
    typeConvert = type === 'good' ? 'Succes!' : 'Error!';
    notification.innerHTML = typeConvert + '<br>' + message;
    mainFrame.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
    setTimeout(() => {
        mainFrame.removeChild(notification);
    }, 4000);
}

function startLoading() {
    mainFrame.style.filter = 'blur(2px)';
    loader.style.display = 'flex';
}

function stopLoading() {
    mainFrame.style.filter = 'none';
    loader.style.display = 'none';
}

async function startPractice(lang = 'en') {
    practiceLang = lang;
    let formData = new FormData();
    formData.append('lang', lang);
    formData.append('token', localStorage.getItem('token'));

    try {
        startLoading();
        const response = await fetch('https://zakarias.dev.ipw.dk:5500/practice', {
            method: 'POST',
            body: formData,
        });

        if (response.status === 401) {
            stopLoading();
            const output = document.getElementById('output');
            output.innerHTML = `<p>Invalid token</p>`;
            return;
        }

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        console.log(JSON.parse(data.gptFinalSuggestion));

        if (data.gptFinalSuggestion) {
            conversation = data.gptFinalSuggestion;
            const parsedResponse = JSON.parse(data.gptFinalSuggestion); // Parse JSON-responsen som et array
            const practiceChatContainer = document.getElementById('practice-chat-container');
            practiceChatContainer.innerHTML = '';
            practiceChatInput.placeholder = 'Type a reply...';
            practiceChatInput.disabled = false;
            practiceChatSubmit.disabled = false;
        
            parsedResponse.forEach((item) => {
                const alignClass = item.role === 'me' ? 'right' : 'left'; // Bestem placering
                const chatMessage = `
                    <div class="align-chat-container ${alignClass}">
                        <div class="chat-container">
                            ${item.message}
                        </div>
                    </div>
                `;
                // Indsæt beskeden forrest i containeren
                practiceChatContainer.insertAdjacentHTML("afterbegin", chatMessage);
            });
            
        
            getUsesLeft();
            stopLoading();
        } else {
            mainFrame.innerHTML = `<p>Error. Response data: ${JSON.stringify(data)}</p>`;
        }
    } catch (error) {
        stopLoading();
        newNotification(`No uses left`, 'bad');
        console.error('Error at /practice:', error);
    }
}

if (practiceChatInput) {
    practiceChatInput.disabled = true;
    practiceChatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            ratePracticeReply(practiceChatInput.value);
        }
    });
}

if (practiceChatSubmit) {
    practiceChatSubmit.disabled = true;
    practiceChatSubmit.addEventListener("click", (event) => {
        ratePracticeReply(practiceChatInput.value);
    });
}

async function ratePracticeReply(reply) {
    let formData = new FormData();
    formData.append('conversation', conversation);
    formData.append('reply', reply);
    formData.append('token', localStorage.getItem('token'));
    formData.append('lang', practiceLang);

    makeRetryButton();

    const chatMessage = `
        <div class="align-chat-container right">
            <div class="chat-container">
                ${reply}
            </div>
        </div>
    `;
    practiceChatContainer.insertAdjacentHTML("afterbegin", chatMessage);

    practiceChatInput.value = '';
    practiceChatInput.disabled = true;
    practiceChatSubmit.disabled = true;

    try {
        startLoading();
        const response = await fetch('https://zakarias.dev.ipw.dk:5500/practice-rate-reply', {
            method: 'POST',
            body: formData,
        });

        if (response.status === 401) {
            stopLoading();
            const output = document.getElementById('output');
            output.innerHTML = `<p>Invalid token</p>`;
            return;
        }

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        console.log(JSON.parse(data.gptFinalSuggestion));

        if (data.gptFinalSuggestion) {
            getUsesLeft();
            stopLoading();
            showPracticeReply(data.gptFinalSuggestion);
        } else {
            mainFrame.innerHTML = `<p>Error. Response data: ${JSON.stringify(data)}</p>`;
        }
    } catch (error) {
        stopLoading();
        newNotification(`No uses left`, 'bad');
        console.error('Error at /practice:', error);
    }
}

function showPracticeReply(reply) {
    const parsedResponse = JSON.parse(reply);
    const rating = parsedResponse[parsedResponse.length - 1].rating;
    const explanation = parsedResponse[parsedResponse.length - 1].explanation;
    ratingExplanation.textContent = explanation;
    ratingContainer.style.display = 'flex';
    ratingContainer.style.opacity = '1';
    animateCounter(rating);
    setTimeout(() => {
        ratingContainer.style.transition = 'opacity 1s';
        ratingContainer.style.opacity = '0';
        mainFrame.style.transition = 'filter 1s';
        mainFrame.style.filter = 'none';
    }, 10000);
    setTimeout(() => {
        ratingContainer.style.display = 'none';
    }, 11000);
}

function animateCounter(targetScore, duration = 3500) {
    const counterElement = document.getElementById('rating-counter');
    let currentStep = 0; // Startværdi
    const updateInterval = 20; // Basisinterval for opdateringer i ms
    const totalSteps = duration / updateInterval;

    function updateCounter() {
        if (currentStep < totalSteps) {
            // Brug en eksponentiel interpolering
            const progress = currentStep / totalSteps; // Fra 0 til 1
            const currentScore = targetScore * (1 - Math.exp(-5 * progress)); // Eksponentiel vækst
            counterElement.textContent = Math.floor(currentScore); // Opdater visningen
            currentStep++;
            setTimeout(updateCounter, updateInterval); // Fortsæt opdateringen
            mainFrame.style.filter = 'blur(2px)';
        } else {
            counterElement.textContent = targetScore; // Endelig visning
        }
    }

    updateCounter();
}

function makeRetryButton() {
    const retryBtn = document.createElement('div');
    retryBtn.id = 'practice-retry-btn';
    retryBtn.textContent = '↻';
    retryBtn.classList.add('retry-button'); // Optional: Add a class for styling
    retryBtn.addEventListener('click', () => {
        startPractice(practiceLang);
    });
    practiceChatContainer.prepend(retryBtn); // Append the button directly to the container
}
