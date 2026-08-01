const typeRadios = document.querySelectorAll('input[name="type"]');
const sourceTextarea = document.getElementById('source');
const sizeXInput = document.getElementById('sizeX');
const sizeYInput = document.getElementById('sizeY');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');

const loadingDiv = document.getElementById('loading');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');

let currentImageBlob = null;

generateBtn.addEventListener('click', async () => {
  const type = document.querySelector('input[name="type"]:checked').value;
  const source = sourceTextarea.value.trim();
  const sizeX = parseInt(sizeXInput.value);
  const sizeY = parseInt(sizeYInput.value);

  if (!source) {
    showError('Please enter HTML code or URL');
    return;
  }

  if (isNaN(sizeX) || isNaN(sizeY) || sizeX <= 0 || sizeY <= 0) {
    showError('Please enter valid size values');
    return;
  }

  generatePreview(type, source, sizeX, sizeY);
});

async function generatePreview(type, source, sizeX, sizeY) {
  hideAll();
  showLoading();
  generateBtn.disabled = true;

  try {
    const response = await fetch('/api/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Type: type,
        Source: source,
        size: {
          x: sizeX,
          y: sizeY
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to generate preview');
    }

    const blob = await response.blob();
    currentImageBlob = blob;

    const url = URL.createObjectURL(blob);
    previewImage.src = url;

    hideLoading();
    showPreview();

  } catch (error) {
    hideLoading();
    showError(error.message);
  } finally {
    generateBtn.disabled = false;
  }
}

downloadBtn.addEventListener('click', () => {
  if (!currentImageBlob) return;

  const url = URL.createObjectURL(currentImageBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `preview-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

function hideAll() {
  loadingDiv.classList.add('hidden');
  previewContainer.classList.add('hidden');
  errorContainer.classList.add('hidden');
}

function showLoading() {
  loadingDiv.classList.remove('hidden');
}

function showPreview() {
  previewContainer.classList.remove('hidden');
}

function showError(message) {
  errorMessage.textContent = message;
  errorContainer.classList.remove('hidden');
}

typeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'url') {
      sourceTextarea.placeholder = 'Enter URL (e.g., https://example.com)';
    } else {
      sourceTextarea.placeholder = 'Paste HTML code here';
    }
    sourceTextarea.value = '';
  });
});
  
