let iconCount = 0;
const fridge2Container = document.querySelector('.fridge2-container');
const fridge3Container = document.querySelector('.fridge3-container');
const pistoContainer = document.querySelector('.pisto-container');

let dataset = []; // Initialize dataset as an array

//request server for EndLife
async function fetchEndLife(foodItem, storageType, startLife) {

    const response = await fetch('/fetchEndLife', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          foodItem: foodItem,
          storageType: storageType,
          startLife: startLife
        })
      });
    const data = await response.json();
    console.log(data.endLife);
    return data.endLife;

}

function checkFridgeState(event) {
    const rect2 = fridge2Container.getBoundingClientRect();
    const isCursorInside2 = event.clientX >= rect2.left && event.clientX <= rect2.right && event.clientY >= rect2.top && event.clientY <= rect2.bottom;
    const rect3 = fridge3Container.getBoundingClientRect();
    const isCursorInside3 = event.clientX >= rect3.left && event.clientX <= rect3.right && event.clientY >= rect3.top && event.clientY <= rect3.bottom;

    if (isCursorInside2) {
        fridge2.style.transform = 'rotateY(-120deg)';
    } else {
        fridge2.style.transform = 'rotateY(0deg)';
    }
    if (isCursorInside3) {
        fridge3.style.transform = 'rotateY(-120deg)';
    } else {
        fridge3.style.transform = 'rotateY(0deg)';
    }
}

function getCurrentUnixTime() {
    return Math.floor(Date.now() / 1000);
}

function getStorageType(shape) {
    const rect2 = fridge2Container.getBoundingClientRect();
    const rect3 = fridge3Container.getBoundingClientRect();
    const shapeRect = shape.getBoundingClientRect();

    const isShapeInside2 = (
        shapeRect.left >= rect2.left &&
        shapeRect.right <= rect2.right &&
        shapeRect.top >= rect2.top &&
        shapeRect.bottom <= rect2.bottom
    );

    const isShapeInside3 = (
        shapeRect.left >= rect3.left &&
        shapeRect.right <= rect3.right &&
        shapeRect.top >= rect3.top &&
        shapeRect.bottom <= rect3.bottom
    );

    if (isShapeInside2) {
        return 'freezer';
    } else if (isShapeInside3) {
        return 'refrigerator';
    } else {
        return 'pantry';
    }
}
    function addEntryToDataset(foodItem, storageType, startLife, endLife) {
    dataset.push({ food_item: foodItem, storage_type: storageType, start_life: startLife, end_life: endLife });
    displayDataset();
}

function saveDatasetToCSV() {
    let csvContent = 'food_item,storage_type,start_life,end_life\n';
    csvContent += dataset.map(entry => `${entry.food_item},${entry.storage_type},${entry.start_life},${entry.end_life}`).join('\n');
    localStorage.setItem('csvContent', csvContent);
}

function displayDataset() {
    const tableBody = document.querySelector("#datasetDisplay tbody");
    tableBody.innerHTML = "";

    dataset.forEach(entry => {
        const row = document.createElement("tr");

        Object.values(entry).forEach(cellValue => {
            const cell = document.createElement("td");
             
            if(cellValue == entry.start_life) {
                cell.textContent = new Date(entry.start_life * 1000).toString().substring(4,21);
            }
            else {
                cell.textContent = cellValue;
            }
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
}

async function fetchIcon() {
    if (iconCount >= 30) {
        alert('Maximum number of icons reached (30).');
        return;
    }

    const query = document.getElementById('searchInput').value;

    const startLife = getCurrentUnixTime();
    const storageType = 'pantry';
    const foodItem = query;
    
    

    // Call fetchEndLife when the shape is created
    const endLife = await fetchEndLife(foodItem, storageType, startLife);
    console.log('endLife: ' + endLife);

    if((endLife == "invalid") || (endLife == "Invalid.")) {
        alert(foodItem + " is an invalid food item!");

    }

    else { 
        const proxyUrl = `/search?query=${query}`;

        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const iconUrl = data.icon_url;

            if (iconUrl !== "No icon found.") {
                const iconContainer = document.getElementById('iconContainer');
                const iconElement = document.createElement('img');
                iconElement.src = iconUrl;
                iconElement.classList.add('shape');
                iconElement.id = query; // Use the food item as the ID
                iconElement.dataset.foodItem = query; // Save food item to dataset attribute
                

                iconElement.style.right = `0%`;
                iconElement.style.bottom = `0%`;
                iconContainer.appendChild(iconElement);

                addEntryToDataset(foodItem, storageType, startLife, endLife);

                // Trigger piston transformation on X-axis (automatic animation)
                const piston = document.getElementById('piston');
                piston.style.transformOrigin ='top center';
                piston.style.transform = 'rotateX(180deg)';  // Apply X-axis scaling transformation
                piston.style.transition = 'transform 1s ease-in-out'; // Smooth transition for animation

                makeDraggable(iconElement);
                iconCount++;
            } else {
                alert('No icon found.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

async function inputEntered(event) {
    if (event.key === 'Enter') {
        await fetchIcon();
    }
}

function makeDraggable(shape) {
let isDragging = false;
let initialX, initialY, offsetX, offsetY;

document.addEventListener('mousedown', function() {

const rect = shape.getBoundingClientRect();
const containerRect = pistoContainer.getBoundingClientRect();

if (rect.right < containerRect.left || rect.left > containerRect.right || rect.bottom < containerRect.top || rect.top > containerRect.bottom) {
// Apply transformation to piston when icon is dragged outside
piston.style.transition = 'transform 1s ease-in-out';
piston.style.transformOrigin = 'center top';
piston.style.transform = 'rotateX(0deg)';


}
});

shape.addEventListener('mousedown', function(event) {
isDragging = true;
initialX = event.clientX;
initialY = event.clientY;
offsetX = shape.offsetLeft;
offsetY = shape.offsetTop;
shape.style.zIndex = '9999'; // Bring the shape to the top while dragging
event.preventDefault();
});

document.addEventListener('mousemove', function(event) {
if (isDragging) {
    shape.style.left = (offsetX + event.clientX - initialX) + 'px';
    shape.style.top = (offsetY + event.clientY - initialY) + 'px';
    checkFridgeState(event);
}
});

document.addEventListener('mouseup', function() {
if (isDragging) {
    const storageType = getStorageType(shape); // Pass the shape element
    const foodItem = shape.dataset.foodItem;
    const startLife = getStartLife(foodItem); // Fetch the start life value
    
    // Call fetchEndLife when the storage type changes
    fetchEndLife(foodItem, storageType, startLife)
        .then(endLife => {
            updateEntryInDataset(foodItem, storageType, endLife);
        });

    

    isDragging = false;
    shape.style.zIndex = '2'; // Reset the shape's z-index after dragging
}
});



}

function getStartLife(foodItem) {
    const entry = dataset.find(item => item.food_item === foodItem);
    if (entry) {
        return entry.start_life;
    } else {
        return null; // Return null or a default value if the entry is not found
    }
}

function updateEntryInDataset(foodItem, newStorageType, endLife) {
    dataset = dataset.map(entry => {
        if (entry.food_item === foodItem) {
            entry.storage_type = newStorageType;
            entry.end_life = endLife; // Update the end life
        }
        return entry;
    });
    saveDatasetToCSV();
    displayDataset();
}

document.addEventListener('mousemove', checkFridgeState);