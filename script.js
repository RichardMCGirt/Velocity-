const airtableApiKey = 'pat1Eu3iQYHDmLSWr.ecfb8470f9c2b8409a0017e65f5b8cf626208e4df1a06905a41019cb38a8534b';
const baseId = 'appTxtZtAlIdKQ7Wt';

const vanirOfficeTableId = 'tbl9hEx6uvFWK8Wd8'; // Table for Vanir Office Dropdown
const clientTableId = 'tblVpJCbIKpUqvnMg'; // Table for Client Name Dropdown
const projectSizeTableId = 'tblxiSxZuDcp8HmME'; // Table for Project Size (Stores Margin Variance)
const locationTableId = 'tblyDCOuu9IhypEW9'; // Table for Project Size (Stores Margin Variance)
const projecttypeTableId = 'tblkgM96KX0j1jnYt'; // Table for Project Size (Stores Margin Variance)
const materialTableId = 'tbllwD5cOKgjFFk3U'; // Table for Material (Stores Margin Variance)

const fieldName = 'Office Name'; 
const tierFields = ['Tier 1 Base', 'Tier 2 Base', 'Tier 3 Base']; 
let allClients = []; // Global array to store client data

document.addEventListener("DOMContentLoaded", function () {
    fetchAllClientNames(); // Load all client names on page load

    const vanirOfficeDropdown = document.getElementById("vanirOffice");
    vanirOfficeDropdown.addEventListener("change", fetchClientNames); // Fetch clients locally on selection
});


async function fetchData() {
    const url = `https://api.airtable.com/v0/${baseId}/${vanirOfficeTableId}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${airtableApiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        populateVanirOffices(data.records);
        populateTierCheckboxes(data.records);
        fetchProjectSizes(); // Fetch Project Sizes when page loads
        fetchLocation(); // Fetch Project Sizes when page loads
        fetchProjectType(); // Fetch Project Type when page loads
        fetchMaterial(); // Fetch Material

        document.getElementById('status').textContent = '';

    } catch (error) {
        console.error(error);
        document.getElementById('status').textContent = 'Error fetching data';
    }
}

function populateVanirOffices(records) {
    const dropdown = document.getElementById('vanirOffice');
    dropdown.innerHTML = ''; 

    let officeNames = records
        .map(record => record.fields[fieldName])
        .filter(name => name) 
        .sort((a, b) => a.localeCompare(b)); 

    if (officeNames.length === 0) {
        dropdown.innerHTML = '<option>No offices available</option>';
    } else {
        officeNames.forEach(name => {
            const option = document.createElement('option');
            option.textContent = name;
            option.value = name;
            dropdown.appendChild(option);
        });
    }
}


async function fetchAllClientNames() {
    let offset = '';
    try {
        do {
            const url = `https://api.airtable.com/v0/${baseId}/${clientTableId}?offset=${offset}`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch client names');
            }

            const data = await response.json();
            allClients = [...allClients, ...data.records]; // Store in global array

            offset = data.offset || ''; // Continue fetching if there is an offset
        } while (offset);

        console.log(`✅ Loaded ${allClients.length} client names into memory.`);
    } catch (error) {
        console.error("❌ Error fetching clients:", error);
    }
}


function fetchClientNames() {
    const selectedOffice = document.getElementById('vanirOffice').value;
    
    if (!selectedOffice) {
        document.getElementById('clientName').innerHTML = '<option>No office selected</option>';
        return;
    }

    // Filter clients based on selected Vanir Office
    const filteredClients = allClients
        .filter(record => record.fields.Division === selectedOffice)
        .map(record => record.fields['Client Name']);

    populateClientDropdown(filteredClients);
} 



function populateClientDropdown(clientNames) {
    const dropdown = document.getElementById('clientName');
    dropdown.innerHTML = '';

    if (clientNames.length === 0) {
        dropdown.innerHTML = '<option>No matching clients</option>';
    } else {
        // Sort client names alphabetically (A-Z)
        clientNames.sort((a, b) => a.localeCompare(b));

        clientNames.forEach(client => {
            const option = document.createElement('option');
            option.textContent = client;
            option.value = client;
            dropdown.appendChild(option);
        });
    }
}


async function fetchProjectSizes() {
    const url = `https://api.airtable.com/v0/${baseId}/${projectSizeTableId}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${airtableApiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch project sizes');
        }

        const data = await response.json();
        populateProjectSizeRadioButtons(data.records);

    } catch (error) {
        console.error(error);
        document.getElementById('projectSizeRadioButtons').innerHTML = '<p>Error loading project sizes</p>';
    }
}

async function fetchMaterial() {
    const url = `https://api.airtable.com/v0/${baseId}/${materialTableId}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${airtableApiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch project sizes');
        }

        const data = await response.json();
        materialRadioButtons(data.records);

    } catch (error) {
        console.error(error);
        document.getElementById('projectSizeRadioButtons').innerHTML = '<p>Error loading project sizes</p>';
    }
}

function materialRadioButtons(records) {
    const container = document.getElementById('materialRadioButtons');
    container.innerHTML = '';

    let materialData = [];

    records.forEach(record => {
        // Ensure Material Type exists & Allow Margin Variance even if it's 0
        if (record.fields['Material Type'] !== undefined && record.fields['Margin Variance'] !== undefined) {
            materialData.push({
                displayName: record.fields['Material Type'], 
                value: record.fields['Margin Variance']
            });
        }
    });

    // Sort alphabetically
    materialData.sort((a, b) => a.displayName.localeCompare(b.displayName));

    if (materialData.length === 0) {
        container.innerHTML = '<p>No materials available</p>';
        return;
    }

    materialData.forEach(item => {
        console.log(`Creating radio button: ${item.displayName} (Value: ${item.value})`);
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value; // Store Margin Variance as value
        radio.name = "materialSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`)); // Show Material Type
        container.appendChild(label);
    });

    console.log("Material radio buttons populated successfully.");
}


async function fetchProjectType() {
    const url = `https://api.airtable.com/v0/${baseId}/${projecttypeTableId}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${airtableApiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch project type');
        }

        const data = await response.json();
        populateProjecttypeRadioButtons(data.records);

    } catch (error) {
        console.error(error);
        document.getElementById('projectTypeRadioButtons').innerHTML = '<p>Error loading project types</p>';
    }
}

async function fetchLocation() {
const url = `https://api.airtable.com/v0/${baseId}/${locationTableId}`;
console.log(`Fetching locations from: ${url}`); // Log API URL

try {
const response = await fetch(url, {
    headers: {
        Authorization: `Bearer ${airtableApiKey}`
    }
});

if (!response.ok) {
    throw new Error('Failed to fetch location');
}

const data = await response.json();

if (data.records.length === 0) {
    console.log("No locations found in Airtable.");
} else {
    console.log(`Total locations retrieved: ${data.records.length}`);
}

populateLocationRadioButtons(data.records);

} catch (error) {
console.error("Error fetching locations:", error);
document.getElementById('locationRadioButtons').innerHTML = '<p>Error loading locations</p>';
}
}


function populateLocationRadioButtons(records) {
    const container = document.getElementById('locationRadioButtons'); 
    container.innerHTML = '';

    let projectSizeData = [];

    records.forEach(record => {
        if (record.fields['Distance'] !== undefined && record.fields['Margin Variance'] !== undefined) {
            projectSizeData.push({
                displayName: record.fields['Distance'], 
                value: record.fields['Margin Variance']
            });
        }
    });

    projectSizeData.sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort alphabetically

    if (projectSizeData.length === 0) {
        container.innerHTML = '<p>No location available</p>';
        return;
    }

    projectSizeData.forEach(item => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value; // Store Margin Variance as value
        radio.name = "locationSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`)); // Show Location
        container.appendChild(label);
    });

    console.log("Location radio buttons populated successfully.");
}

function populateProjecttypeRadioButtons(records) {
    const container = document.getElementById('projectRadioButtons'); 
    container.innerHTML = '';

    let projectSizeData = [];

    records.forEach(record => {
        if (record.fields['Project Type'] !== undefined && record.fields['Margin Variance'] !== undefined) {
            projectSizeData.push({
                displayName: record.fields['Project Type'], 
                value: record.fields['Margin Variance']
            });
        }
    });

    // Sort with "Single Family" always on top
    projectSizeData.sort((a, b) => {
        if (a.displayName === "Single Family") return -1; // Move "Single Family" to top
        if (b.displayName === "Single Family") return 1;
        return a.displayName.localeCompare(b.displayName); // Sort alphabetically
    });

    if (projectSizeData.length === 0) {
        container.innerHTML = '<p>No Project Types available</p>';
        return;
    }

    projectSizeData.forEach(item => {
        console.log(`Creating radio button: ${item.displayName} (Value: ${item.value})`);
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value; // Store Margin Variance as value
        radio.name = "projectTypeSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`)); // Show Project Type
        container.appendChild(label);
    });

    console.log("Project Type radio buttons populated successfully.");
}




function populateTierCheckboxes(records) {
    const checkboxContainer = document.getElementById('tierCheckboxes');
    checkboxContainer.innerHTML = '';

    let tierData = [];

    records.forEach(record => {
        tierFields.forEach(tier => {
            if (record.fields[tier] !== undefined && record.fields[tier] !== null) {
                tierData.push({ fieldName: tier, value: record.fields[tier] });
            }
        });
    });

    let uniqueTierData = [];
    let seenValues = new Set();

    tierData.forEach(item => {
        if (!seenValues.has(item.value)) {
            seenValues.add(item.value);
            uniqueTierData.push(item);
        }
    });

    uniqueTierData.sort((a, b) => a.value - b.value);

    if (uniqueTierData.length === 0) {
        checkboxContainer.innerHTML = '<p>No tiers available</p>';
        return;
    }

    uniqueTierData.forEach(item => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio'; // Radio buttons so only one can be selected
        radio.value = item.value;
        radio.name = "tierSelection"; 

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.fieldName}`)); 
        checkboxContainer.appendChild(label);
    });
}

function populateProjectSizeRadioButtons(records) {
    const container = document.getElementById('projectSizeRadioButtons');
    container.innerHTML = '';

    let projectSizeData = [];

    records.forEach(record => {
        if (record.fields['Project Size'] && record.fields['Margin Variance']) {
            projectSizeData.push({
                displayName: record.fields['Project Size'], 
                value: record.fields['Margin Variance']
            });
        }
    });

    projectSizeData.sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort alphabetically

    if (projectSizeData.length === 0) {
        container.innerHTML = '<p>No project sizes available</p>';
        return;
    }

    projectSizeData.forEach(item => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value; // Store Margin Variance as value
        radio.name = "projectSizeSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`)); // Show Project Size
        container.appendChild(label);
    });

    console.log("Project Size radio buttons populated successfully.");
}

function updateTotalMarginVariance() {
    let total = 0;

    // Get all selected radio buttons in each group
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        total += parseFloat(radio.value) || 0; // Convert value to number & sum up
    });

    // Update the total input field with % symbol
    document.getElementById('totalMarginVariance').value = "Recommended Margin: " + total.toFixed(2) + "%"; // Keep 2 decimal places
}



// Attach event listeners to all radio buttons
document.addEventListener('change', event => {
    if (event.target.type === 'radio') {
        updateTotalMarginVariance();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const totalMarginContainer = document.querySelector(".total-margin-container");
    
    // Initially hide the container
    if (totalMarginContainer) {
        totalMarginContainer.style.display = "none";
        console.log("✅ Total Margin Container is hidden initially.");
    } else {
        console.error("❌ Error: Total Margin Container not found!");
    }

    // Use event delegation to detect dynamically added radio buttons
    document.body.addEventListener("change", function (event) {
        if (event.target.type === "radio") {
            console.log(`🔘 Radio button selected: ${event.target.value}`);

            // Ensure the container is available before showing
            if (totalMarginContainer) {
                totalMarginContainer.style.display = "flex"; 
            } else {
                console.error("❌ Error: Total Margin Container not found when trying to show.");
            }
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const clientNameContainer = document.getElementById("clientNameContainer");
    const vanirOfficeDropdown = document.getElementById("vanirOffice");

    // Initially hide the Client Name section
    if (clientNameContainer) {
        clientNameContainer.style.display = "none";
        console.log("✅ Client Name dropdown is initially hidden.");
    } else {
        console.error("❌ Error: Client Name container not found!");
    }

    // Show Client Name dropdown & Fetch Client Names when Vanir Office is selected
    vanirOfficeDropdown.addEventListener("change", function () {
        if (vanirOfficeDropdown.value) {
            clientNameContainer.style.display = "block"; // Show the section
            console.log("✅ Client Name dropdown is now visible.");
            fetchClientNames(); // ✅ Call fetchClientNames() to populate the dropdown
        } else {
            clientNameContainer.style.display = "none"; // Hide dropdown if nothing is selected
        }
    });
});

function updateTotalMarginVariance() {
    let total = 0;

    // Get all selected radio buttons in each group
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        total += parseFloat(radio.value) || 0; // Convert value to number & sum up
    });

    // Get selected tier
    const selectedTier = document.querySelector('input[name="tierSelection"]:checked');

    let minMargin, maxMargin;

    if (selectedTier) {
        // Get the label text for the selected tier
        const tierLabel = selectedTier.nextSibling.textContent.trim(); 

        if (tierLabel === "Tier 1 Base") {
            minMargin = total - 2;
            maxMargin = total + 2;
        } else if (tierLabel === "Tier 2 Base") {
            minMargin = total - 1;
            maxMargin = total + 1;
        } else if (tierLabel === "Tier 3 Base") {
            minMargin = Math.max(0, total - 1); // Prevent negative margin
            maxMargin = total + 2;
        } else {
            minMargin = total;
            maxMargin = total;
        }
    } else {
        minMargin = total;
        maxMargin = total;
    }

    // Update the total input field with % symbol
    document.getElementById('totalMarginVariance').value =
        `Recommended Margin: ${total.toFixed(2)}% (Range: ${minMargin.toFixed(2)}% - ${maxMargin.toFixed(2)}%)`;
}

// Attach event listeners to all radio buttons including tiers
document.addEventListener('change', event => {
    if (event.target.type === 'radio') {
        updateTotalMarginVariance();
    }
});



fetchData();