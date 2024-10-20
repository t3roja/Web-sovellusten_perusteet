const baseUrl = "https://tie.digitraffic.fi/api/weathercam/v1/stations";
const stationList = document.getElementById("stationList");
const imageContainer = document.getElementById("imageContainer");
const stationData = [];
const selectedStations = document.getElementById("selectedStations");
let sortDirection = true;

updateClock();
updateDate();
setInterval(updateClock, 1000);

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

document.getElementById("addStation").addEventListener("click", addSelectedStation);
document.getElementById("removeStation").addEventListener("click", removeSelectedStation);

function addSelectedStation() {
    const selectedOptions = Array.from(stationList.selectedOptions);
    selectedOptions.forEach(option => {
        const newOption = document.createElement("option");
        newOption.value = option.value;
        newOption.text = option.text;
        selectedStations.appendChild(newOption);
        option.remove();
    });
}

function removeSelectedStation() {
    const selectedOptions = Array.from(selectedStations.selectedOptions);
    selectedOptions.forEach(option => {
        const newOption = document.createElement("option");
        newOption.value = option.value;
        newOption.text = option.text;
        stationList.appendChild(newOption);
        option.remove();
    });
}


async function showImages() {
    const selectedStationsList = Array.from(document.getElementById("selectedStations").options)
        .map(option => option.text);
    const thumbnailTableBody = document.querySelector("#thumbnailTable tbody");
    thumbnailTableBody.innerHTML = "";

    console.log("Selected Stations List:", selectedStationsList);

    for (let location of selectedStationsList) {
        for (let item of stationData) {
            if (location === item[1]) {

                const imageDetails = await getImages(item[0]);

                for (let { imageUrl, presentationName } of imageDetails) {

                    const isValidImage = await checkImage(imageUrl);
                    if (isValidImage) {
                        displayThumbnail(item[1], imageUrl, presentationName);
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
    try {
        const response = await fetch(url);
        const data = await response.json();

        const images = data.properties.presets.map(preset => ({
            imageUrl: preset.imageUrl,
            presentationName: preset.presentationName
        }));

        return images;
    } catch (error) {
        console.error("Error fetching images for station:", stationId, error);
        return [];
    }
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
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");

    nameCell.textContent = stationName;

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = presentationName;

    const thumbnailCell = document.createElement("td");

    const thumb = document.createElement("img");
    thumb.src = imageUrl;
    thumb.classList.add("thumbnail");
    thumb.alt = "Weather Camera View";
    thumb.style.cursor = "pointer";

    thumb.addEventListener("click", () => {
        enlargeImage(imageUrl);
    });

    thumbnailCell.appendChild(thumb);
    row.appendChild(nameCell);
    row.appendChild(descriptionCell);
    row.appendChild(thumbnailCell);

    thumbnailTableBody.appendChild(row);
}

function enlargeImage(imageUrl) {
    const modal = document.createElement("div");
    modal.classList.add("modal");

    const fullImage = document.createElement("img");
    fullImage.src = imageUrl;
    fullImage.classList.add("full-size-image");

    modal.appendChild(fullImage);

    modal.addEventListener("click", () => {
        document.body.removeChild(modal);
    });

    document.body.appendChild(modal);
}

function updateClock() {
    const timeElement = document.getElementById("time");
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    timeElement.textContent = `${hours}:${minutes}:${seconds}`;
}

function updateDate() {
    const dateElement = document.getElementById("date");
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    dateElement.textContent = now.toLocaleDateString('en-US', options);

}

function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("thumbnailTable");
    switching = true;

    while (switching) {
        switching = false;
        rows = table.rows;

        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;

            x = rows[i].getElementsByTagName("TD")[1];
            y = rows[i + 1].getElementsByTagName("TD")[1];

            if (sortDirection) {

                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            } else {

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

    sortDirection = !sortDirection;
}
