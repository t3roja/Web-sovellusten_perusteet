const baseUrl = "https://tie.digitraffic.fi/api/weathercam/v1/stations";
const stationList = document.getElementById("stationList");
const imageContainer = document.getElementById("imageContainer");
const stationData = [];
let sortDirection = true; // true for ascending, false for descending

document.addEventListener("DOMContentLoaded", function () {
    findStations();

    document.getElementById("roadCamForm").addEventListener("submit", function (event) {
        event.preventDefault();
        const location = document.getElementById("location").value.trim();
        if (location.length >= 3) {
            filterNames(location);
        } else {
            alert("Please enter at least 3 characters");
        }
    });

    document.getElementById("loadImages").addEventListener("click", showImages);
});

async function findStations() {
    try {
        const response = await fetch(baseUrl);
        const data = await response.json();

        data.features.forEach((feature) => {
            const station_id = feature.properties.id;
            let station_name = feature.properties.name.split('_').slice(1).join(' ').replace(/_/g, ' ');
            stationData.push([station_id, station_name]);
        });

        stationData.forEach(station => {
            const option = document.createElement("option");
            option.textContent = station[1];
            stationList.appendChild(option);
        });

    } catch (error) {
        console.error("Error finding station data:", error);
    }
}

function filterNames(location) {
    const filterText = location.toUpperCase();
    stationList.innerHTML = "";

    stationData.forEach(station => {
        const [id, name] = station;
        if (name.toUpperCase().includes(filterText)) {
            const option = document.createElement("option");
            option.value = id;
            option.text = name;
            stationList.appendChild(option);
        }
    });
}

async function showImages() {
    const selectedStations = Array.from(document.getElementById("stationList").selectedOptions)
                                    .map(option => option.text);

    const thumbnailTableBody = document.querySelector("#thumbnailTable tbody");
    thumbnailTableBody.innerHTML = "";  // Clear previous entries

    for (let location of selectedStations) {
        for (let item of stationData) {
            if (location === item[1]) {
                const imageDetails = await getImages(item[0]);  // Fetch all image URLs and presentation names for the station

                // Display each image and its corresponding description in the table
                for (let { imageUrl, presentationName } of imageDetails) {
                    const isValidImage = await checkImage(imageUrl);
                    if (isValidImage) {
                        displayThumbnail(item[1], imageUrl, presentationName);  // Pass station name, image URL, and description to displayThumbnail
                    } else {
                        console.warn(`Invalid image URL: ${imageUrl}`);
                    }
                }
            }
        }
    }
}


async function getImages(stationId) {
    const url = baseUrl + "/" + stationId;
    const response = await fetch(url);
    const data = await response.json();

    // Extract all image URLs and their corresponding presentation names
    const images = data.properties.presets.map(preset => ({
        imageUrl: preset.imageUrl,
        presentationName: preset.presentationName
    }));

    return images;  // Return an array of objects containing imageUrl and presentationName
}


function checkImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

function displayThumbnail(stationName, imageUrl, presentationName) {
    const thumbnailTableBody = document.querySelector("#thumbnailTable tbody");

    // Create a new row
    const row = document.createElement("tr");

    // Create a cell for the station name
    const nameCell = document.createElement("td");
    nameCell.textContent = stationName;

    // Create a cell for the presentation name (camera description)
    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = presentationName;

    // Create a cell for the thumbnail
    const thumbnailCell = document.createElement("td");

    // Create the thumbnail image
    const thumb = document.createElement("img");
    thumb.src = imageUrl;
    thumb.classList.add("thumbnail");  // Add CSS class for styling
    thumb.alt = "Weather Camera View";
    thumb.style.cursor = "pointer";  // Make it look clickable

    // Add an event listener to enlarge the image on click
    thumb.addEventListener("click", () => {
        enlargeImage(imageUrl);  // Enlarge image when clicked
    });

    // Append the thumbnail to its cell and the cell to the row
    thumbnailCell.appendChild(thumb);
    row.appendChild(nameCell);
    row.appendChild(descriptionCell);  // Append the description cell to the row
    row.appendChild(thumbnailCell);

    // Append the row to the table body
    thumbnailTableBody.appendChild(row);
}

function enlargeImage(imageUrl) {
    const modal = document.createElement("div");
    modal.classList.add("modal");

    const fullImage = document.createElement("img");
    fullImage.src = imageUrl;
    fullImage.classList.add("full-size-image");

    modal.appendChild(fullImage);

    // Close the modal when clicked
    modal.addEventListener("click", () => {
        document.body.removeChild(modal);
    });

    document.body.appendChild(modal);
}

// Function to update the time every second
function updateClock() {
    const timeElement = document.getElementById("time");
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    // Format the time
    timeElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Function to update the date
function updateDate() {
    const dateElement = document.getElementById("date");
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    // Format the date (e.g., "Monday, October 15, 2024")
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Initial update of the clock and date
updateClock();
updateDate();

// Set interval for the clock to update every second
setInterval(updateClock, 1000);

// Function to sort the table
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("thumbnailTable");
    switching = true;

    while (switching) {
        switching = false;
        rows = table.rows;

        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;

            x = rows[i].getElementsByTagName("TD")[1]; // Change index to 1 for Camera Description
            y = rows[i + 1].getElementsByTagName("TD")[1]; // Same here

            // Determine the comparison based on the sort direction
            if (sortDirection) {
                // Ascending order
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            } else {
                // Descending order
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }

    // Toggle sort direction for the next click
    sortDirection = !sortDirection;
}
