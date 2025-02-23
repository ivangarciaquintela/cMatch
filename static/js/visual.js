document.getElementById('searchTypeToggle').addEventListener('change', (event) => {
    const dragAndDropArea = document.getElementById('dragAndDropArea');
    const urlInputArea = document.getElementById('urlInputArea');
    const searchByImageButton = document.getElementById('searchByImageButton');

    if (event.target.checked) {
        dragAndDropArea.classList.add('hidden');
        urlInputArea.classList.remove('hidden');
         clearImagePreview(); // Clear preview when s// Hide button in URL mode.
    } else {
        dragAndDropArea.classList.remove('hidden');
        urlInputArea.classList.add('hidden');
          // Don't immediately show button here.  Only show on image add.
    }
});

// --- Drag and drop, image preview, and search button ---
   function handleFileSelect(files) {
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const searchByImageButton = document.getElementById('searchByImageButton');
    imagePreview.innerHTML = ''; // Clear previous previews
    let hasImages = false; // Flag to track if any valid images were processed

    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            continue;
        }
        hasImages = true; // Set the flag to true if at least one valid image is found
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-image';
            imagePreview.appendChild(img);


        };
        reader.readAsDataURL(file);
    }

}

// No need for addSearchButton or removeSearchButton  functions anymore

 function clearImagePreview() {
    const imagePreview = document.getElementById('imagePreview');
     const searchByImageButton = document.getElementById('searchByImageButton');
    imagePreview.innerHTML = ''; // Clear the preview
}

// Event listeners
document.getElementById('dropzone-file').addEventListener('change', (event) => {
    handleFileSelect(event.target.files);
});

const dropArea = document.getElementById('dragAndDropArea');
dropArea.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  dropArea.classList.add('bg-gray-200');
});
dropArea.addEventListener('dragleave', (event) => {
    event.stopPropagation();
    event.preventDefault();
    dropArea.classList.remove('bg-gray-200');
});
dropArea.addEventListener('drop', (event) => {
  event.stopPropagation();
  event.preventDefault();
  dropArea.classList.remove('bg-gray-200');
  const files = event.dataTransfer.files;
  handleFileSelect(files);
});