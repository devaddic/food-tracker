let iconCount = 0;
const fridge2Container = document.querySelector('.fridge2-container');
const fridge3Container = document.querySelector('.fridge3-container');
const pistoContainer = document.querySelector('.pisto-container');

let dataset = []; 

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
    return data.endLife;

}

function checkFridgeState(event) {
    const rect2 = fridge2Container.getBoundingClientRect();
    const isCursorInside2 = 
        (event.clientX || event.touches[0].clientX) >= rect2.left && 
        (event.clientX || event.touches[0].clientX) <= rect2.right && 
        (event.clientY || event.touches[0].clientY) >= rect2.top && 
        (event.clientY || event.touches[0].clientY) <= rect2.bottom;
    const rect3 = fridge3Container.getBoundingClientRect();
    const isCursorInside3 = 
        (event.clientX || event.touches[0].clientX) >= rect3.left &&
        (event.clientX || event.touches[0].clientX) <= rect3.right && 
        (event.clientY || event.touches[0].clientY) >= rect3.top && 
        (event.clientY || event.touches[0].clientY) <= rect3.bottom;

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
    dataset.push({ food_ID: iconCount, food_item: foodItem, storage_type: storageType, 
        start_life: startLife, end_life: endLife });
    displayDataset();
}

// function saveDatasetToCSV() {
//     let csvContent = 'food_item,storage_type,start_life,end_life\n';
//     csvContent += dataset.map(entry => `${entry.food_ID},${entry.food_item},${entry.storage_type},${entry.start_life},${entry.end_life}`).join('\n');
//     sessionStorage.setItem('csvContent', csvContent);
// }

function displayDataset() {
    const tableBody = document.querySelector("#datasetDisplay tbody");
    tableBody.innerHTML = "";

    dataset.forEach(entry => {
        const row = document.createElement("tr");

        Object.values(entry).forEach(cellValue => {
            const cell = document.createElement("td");
            if(cellValue == entry.food_ID) {
            }
            else if(cellValue == entry.start_life) {
                cell.textContent = new Date(entry.start_life * 1000).toString().substring(4,21);
                row.appendChild(cell);
            }
            else {
                cell.textContent = cellValue;
                row.appendChild(cell);
            }
        });
        
        tableBody.appendChild(row);
    });
}

function updateEntryInDataset(food_ID, newStorageType, endLife) {
    dataset = dataset.map(entry => {
        if (entry.food_ID == food_ID) {
            entry.storage_type = newStorageType;
            entry.end_life = endLife; 
        }
        return entry;
    });
    saveDatasetToCSV();
    displayDataset();
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
    const food_ID = iconCount;
    
    const endLife = await fetchEndLife(foodItem, storageType, startLife);
    if((endLife == "invalid") || (endLife == "Invalid.")) {
        alert(foodItem + " is an invalid food item!");
    }
    else { 
        const proxyUrl = `/search?query=${query}`;

        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const iconUrl = data.icon_url;

            const iconContainer = document.getElementById('iconContainer');
            const iconElement = document.createElement('img');
            iconElement.src = iconUrl;
            iconElement.classList.add('shape');
            iconElement.id = query + iconCount; 
            iconElement.dataset.foodItem = query; 
            iconElement.dataset.food_ID = food_ID;
            iconElement.alt = foodItem;

            iconElement.style.right = `0%`;
            iconElement.style.bottom = `0%`;
            iconContainer.appendChild(iconElement);

            addEntryToDataset(foodItem, storageType, startLife, endLife);

            const piston = document.getElementById('piston');
            piston.style.transformOrigin ='top center';
            piston.style.transform = 'rotateX(180deg)';  
            piston.style.transition = 'transform 1s ease-in-out'; 

            makeDraggable(iconElement);
            iconCount++;
            
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

    function transformPiston(event) {
        const rect = shape.getBoundingClientRect();
        const containerRect = pistoContainer.getBoundingClientRect();

        if (rect.right < containerRect.left || rect.left > containerRect.right || rect.bottom < containerRect.top || rect.top > containerRect.bottom) {
            piston.style.transition = 'transform 1s ease-in-out';
            piston.style.transformOrigin = 'center top';
            piston.style.transform = 'rotateX(0deg)';
        }
    }
    document.addEventListener('mousedown', transformPiston);
    document.addEventListener('touchdown', transformPiston);

    function startDragShape(event) {
        isDragging = true;
        initialX = (event.clientX || event.touches[0].clientX);
        initialY = (event.clientY || event.touches[0].clientY);
        offsetX = shape.offsetLeft;
        offsetY = shape.offsetTop;
        shape.style.zIndex = '9999'; //arbitary value chosen
        event.preventDefault();
    }
    shape.addEventListener('mousedown', startDragShape);
    shape.addEventListener('touchstart', startDragShape);

    function dragShape(event) {
        if (isDragging) {
            shape.style.left = (offsetX + (event.clientX || event.touches[0].clientX) - initialX) + 'px';
            shape.style.top = (offsetY + (event.clientY || event.touches[0].clientY) - initialY) + 'px';
            checkFridgeState(event);
        }
    }
    document.addEventListener('mousemove', dragShape);
    document.addEventListener('touchmove', dragShape);

    function endDragShape(event) {
        if (isDragging) {
            const storageType = getStorageType(shape); 
            const foodItem = shape.dataset.foodItem;
            const food_ID = shape.dataset.food_ID;
            const startLife = getStartLife(foodItem); 
            
            fetchEndLife(foodItem, storageType, startLife)
                .then(endLife => {
                    updateEntryInDataset(food_ID, storageType, endLife);
                });
        
            isDragging = false;
            shape.style.zIndex = '2'; 
        }
    }
    document.addEventListener('mouseup', endDragShape);
    document.addEventListener('touchend', endDragShape);
}

function getStartLife(foodItem) {
    const entry = dataset.find(item => item.food_item === foodItem);
    if (entry) {
        return entry.start_life;
    } else {
        return null;
    }
}

document.addEventListener('mousemove', checkFridgeState);
document.addEventListener('touchmove', checkFridgeState);