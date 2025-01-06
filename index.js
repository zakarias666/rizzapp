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
            const response = await fetch('http://hetzner-dev-ws.ipwsystems.dk/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.status === 401) {
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

const tokenButton = document.getElementById('token-btn');
tokenButton.addEventListener('click', () => {
    openTokenInput();
});

const closeButton = document.getElementById('close-btn');
closeButton.addEventListener('click', () => {
    closeTokenInput();
});

function openTokenInput() {
    isTokenMenuOpen = true;
    const mainFrame = document.getElementById('main-frame');
    const showToken = document.getElementById('current-token');
    const tokenInput = document.getElementById('token-input-container');
    showToken.innerHTML = currentToken;
    tokenInput.style.display = 'block';
    mainFrame.style.filter = 'blur(5px)';
}

function closeTokenInput() {
    isTokenMenuOpen = false;
    const mainFrame = document.getElementById('main-frame');
    const tokenInput = document.getElementById('token-input-container');
    tokenInput.style.display = 'none';
    mainFrame.style.filter = 'none';
    getUsesLeft();
}

function copyOutput() {
    var copyText = document.getElementById("output-message");
  
    navigator.clipboard.writeText(copyText.innerText);
  
    alert("Copied to clipboard!");
}

const tokenInput = document.getElementById('token-input');
tokenInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        currentToken = tokenInput.value;
        tokenInput.value = '';
        localStorage.setItem('token', currentToken);
        closeTokenInput();
    }
});

function getUsesLeft() {
    fetch('http://hetzner-dev-ws.ipwsystems.dk/uses', {
        method: 'POST',
        body: JSON.stringify({ token: localStorage.getItem('token') }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            const usesLeft = document.getElementById('uses-left');
            usesLeft.innerHTML = "🪙 " + data.usesLeft;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function startLoading() {
    const loader = document.getElementById('loader-container');
    const mainFrame = document.getElementById('main-frame');
    mainFrame.style.filter = 'blur(2px)';
    loader.style.display = 'flex';
}

function stopLoading() {
    const loader = document.getElementById('loader-container');
    const mainFrame = document.getElementById('main-frame');
    mainFrame.style.filter = 'none';
    loader.style.display = 'none';
}