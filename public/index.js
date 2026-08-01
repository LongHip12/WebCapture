<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Preview API</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Web Preview Generator</h1>
      <p>Capture screenshots of HTML or webpages</p>
    </div>

    <div class="content">
      <div class="form-section">
        <div class="form-group">
          <label>Preview Type</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="type" value="html" checked>
              <span>HTML Code</span>
            </label>
            <label class="radio-label">
              <input type="radio" name="type" value="url">
              <span>URL</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>Source</label>
          <textarea id="source" placeholder="Paste HTML code or enter URL" rows="8"></textarea>
        </div>

        <div class="size-group">
          <div class="form-group">
            <label>Width (px)</label>
            <input type="number" id="sizeX" value="1280" min="100" max="3840">
          </div>
          <div class="form-group">
            <label>Height (px)</label>
            <input type="number" id="sizeY" value="720" min="100" max="3840">
          </div>
        </div>

        <button id="generateBtn" class="btn-primary">Generate Preview</button>
      </div>

      <div class="preview-section">
        <div id="loading" class="loading hidden">
          <div class="spinner"></div>
          <p>Generating preview...</p>
        </div>
        <div id="previewContainer" class="preview-container hidden">
          <img id="previewImage" src="" alt="Preview">
          <button id="downloadBtn" class="btn-secondary">Download</button>
        </div>
        <div id="errorContainer" class="error-container hidden">
          <p id="errorMessage"></p>
        </div>
      </div>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>
  
