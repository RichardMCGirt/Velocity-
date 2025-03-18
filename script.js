const airtableApiKey = 'pat1Eu3iQYHDmLSWr.ecfb8470f9c2b8409a0017e65f5b8cf626208e4df1a06905a41019cb38a8534b';
const baseId = 'appTxtZtAlIdKQ7Wt';

const vanirOfficeTableId = 'tbl9hEx6uvFWK8Wd8'; // Table for Vanir Office Dropdown
const clientTableId = 'tblVpJCbIKpUqvnMg'; // Table for Client Name Dropdown
const projectSizeTableId = 'tblxiSxZuDcp8HmME'; // Table for Project Size (Stores Margin Variance)
const locationTableId = 'tblyDCOuu9IhypEW9'; // Table for Project Size (Stores Margin Variance)
const projecttypeTableId = 'tblkgM96KX0j1jnYt'; // Table for Project Size (Stores Margin Variance)
const materialTableId = 'tbllwD5cOKgjFFk3U'; // Table for Material (Stores Margin Variance)
let projectSizeData = [];

const fieldName = 'Office Name'; 
const tierFields = ['Tier 1 Base', 'Tier 2 Base', 'Tier 3 Base']; 
let allClients = []; // Global array to store client data

document.addEventListener("DOMContentLoaded", function () {
    fetchAllClientNames(); // Load all client names on page load
    fetchData(); // Fetch Vanir Offices and related data

    const vanirOfficeDropdown = document.getElementById("vanirOffice");
    const clientNameContainer = document.getElementById("clientNameContainer");

    // Hide containers initially
    if (totalMarginContainer) totalMarginContainer.style.display = "none";
    if (clientNameContainer) clientNameContainer.style.display = "none";

    // Show Client Name dropdown when Vanir Office is selected
    vanirOfficeDropdown.addEventListener("change", function () {
        if (vanirOfficeDropdown.value) {
            clientNameContainer.style.display = "block"; // Show the section
            fetchClientNames(); // Populate Client Dropdown
        } else {
            clientNameContainer.style.display = "none"; // Hide if nothing is selected
        }
    });
    const clientDropdown = document.getElementById("clientName");
    clientDropdown.addEventListener("change", updateMargin);
});

let fetchInProgress = {}; // Track ongoing fetch requests

function updateMargin() {
    const clientDropdown = document.getElementById("clientName");
    
    if (!clientDropdown) {
        console.error("❌ Error: Client Name dropdown is missing.");
        return;
    }

    const selectedOption = clientDropdown.options[clientDropdown.selectedIndex];

    if (!selectedOption || !selectedOption.value) {
        console.warn("⚠️ No client selected. Resetting values.");
        document.getElementById("accountType").textContent = "-";
        document.getElementById("margin").textContent = "-";
        document.getElementById("totalMarginVariance").value = "0";
        return;
    }

    const clientName = selectedOption.textContent.trim(); // Get client name
    const accountType = selectedOption.dataset.accountType || "Unknown";

    console.log("📌 Client Selected:");
    console.log(`   ✅ Client Name: "${clientName}"`);
    console.log(`   ✅ Account Type: "${accountType}"`);

    let margin = 0;
    let additionalMargin = 0;

    // Assign base margin based on Account Type
    switch (accountType) {
        case "National":
            margin = 10;
            break;
        case "Local Production":
            margin = 11;
            break;
        case "Custom":
            margin = 15;
            break;
        default:
            console.warn(`⚠️ Unrecognized Account Type: ${accountType}`);
    }

    // **Special Case: If "Assurance Restoration", add 15% margin**
    if (clientName === "Assurance Restoration") {
        additionalMargin = 15;
        console.log("🔹 Bonus Margin Applied: +15% for Assurance Restoration");
    }

    // Calculate total margin variance
    let totalMargin = margin + additionalMargin;

    // Update UI elements
    document.getElementById("accountType").textContent = accountType;
    document.getElementById("margin").textContent = `${margin}%`;
    document.getElementById("totalMarginVariance").value = totalMargin.toFixed(2);

    console.log(`   ✅ Total Margin Variance: ${totalMargin.toFixed(2)}%`);
}




async function getMarginVarianceFromAirtable(materialType) {
    if (!materialType || materialType.trim() === '') return null;

    // If a request for this material is already in progress, wait for it to complete
    if (fetchInProgress[materialType]) {
        console.warn(`⏳ Fetch already in progress for: ${materialType}`);
        return fetchInProgress[materialType]; 
    }

    const url = `https://api.airtable.com/v0/${baseId}/${materialTableId}`;

    try {
        fetchInProgress[materialType] = fetch(url, {
            headers: { Authorization: `Bearer ${airtableApiKey}` }
        }).then(response => {
            if (!response.ok) throw new Error('Failed to fetch material data from Airtable');
            return response.json();
        });

        const data = await fetchInProgress[materialType];

        const materialRecord = data.records.find(record => 
            record.fields['Material Type'] && record.fields['Material Type'].trim().toLowerCase() === materialType.toLowerCase()
        );

        fetchInProgress[materialType] = null; // Clear fetch tracking

        return materialRecord ? materialRecord.fields['Margin Variance'] : null;
    } catch (error) {
        console.error("❌ Error fetching Margin Variance:", error);
        fetchInProgress[materialType] = null; // Clear fetch tracking
        return null;
    }
}



let previousSelections = {};

document.body.addEventListener("change", async function (event) {
    if (event.target.type === "radio") {
        const selectedMaterial = event.target.value.trim();

        if (previousSelections[selectedMaterial]) {
            console.log(`🔄 Using stored margin variance for ${selectedMaterial}: ${previousSelections[selectedMaterial]}`);
            event.target.value = previousSelections[selectedMaterial];
            updateTotalMarginVariance();
            return;
        }

        let marginVariance = await getMarginVarianceFromAirtable(selectedMaterial);

        if (marginVariance === null) {
            console.warn(`⚠️ No valid margin variance found for ${selectedMaterial}. Keeping previous value.`);
            return;
        }

        previousSelections[selectedMaterial] = marginVariance; // Store the fetched value
        console.log(`📊 Storing Margin Variance for ${selectedMaterial}: ${marginVariance}`);

        event.target.value = marginVariance;
        updateTotalMarginVariance();
    }
});







// **Fetch Vanir Offices & Project Data**
async function fetchData() {
    const url = `https://api.airtable.com/v0/${baseId}/${vanirOfficeTableId}`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${airtableApiKey}` }
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        populateVanirOffices(data.records);
        
        // Fetch related data
        fetchProjectSizes();
        fetchLocation();
        fetchProjectType();
        fetchMaterial();
        populateVanirOffices(data.records);

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
        .filter(name => name && name !== "Test Branch") // Remove "Test Branch"
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

            if (!response.ok) throw new Error('Failed to fetch client names');

            const data = await response.json();
            allClients = [...allClients, ...data.records]; // Store in global array
            offset = data.offset || ''; // Continue fetching if offset exists
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
        .map(record => ({
            id: record.id,
            name: record.fields['Client Name'],
            accountType: record.fields['Account Type']
        }));

    populateClientDropdown(filteredClients);
}



function populateClientDropdown(clients) {
    const dropdown = document.getElementById("clientName");

    if (!dropdown) {
        console.error("❌ Client Name dropdown not found.");
        return;
    }

    dropdown.innerHTML = '<option value="">Select a client</option>'; 

    if (clients.length === 0) {
        console.warn("⚠️ No clients found for selected Vanir Office.");
        dropdown.innerHTML = '<option value="">No matching clients</option>';
        return;
    }

    clients.forEach(client => {
        const option = document.createElement("option");
        option.value = client.id; // Store record ID
        option.textContent = client.name;
        option.dataset.accountType = client.accountType || "Unknown";
        dropdown.appendChild(option);
    });

    console.log(`✅ Populated ${clients.length} clients in dropdown.`);
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
        document.getElementById('materialsRadioButtons').innerHTML = '<p>Error loading materials</p>';
    }
}
function materialRadioButtons(records) {
    const container = document.getElementById('materialRadioButtons');
    container.innerHTML = '';

    let materialData = [];

    records.forEach(record => {
        if (record.fields['Material Type'] && record.fields['Margin Variance']) {
            materialData.push({
                displayName: record.fields['Material Type'].trim(),
                value: record.fields['Margin Variance'] // ✅ Correctly store numeric Margin Variance
            });
        }
    });

    console.log("✅ Material Types After Filtering:", materialData.map(m => `${m.displayName} (Value: ${m.value})`));

    materialData.sort((a, b) => a.displayName.localeCompare(b.displayName));

    if (materialData.length === 0) {
        container.innerHTML = '<p>No materials available</p>';
        return;
    }

    const radioGroup = document.createElement('div');
    radioGroup.classList.add('radio-group');

    materialData.forEach(item => {
        console.log(`Creating radio button: ${item.displayName} (Value: ${item.value})`);

        const label = document.createElement('label');
        label.classList.add('radio-label');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value; // ✅ Now stores the numeric value (e.g., 3)
        radio.name = "materialSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`));
        radioGroup.appendChild(label);
    });

    container.appendChild(radioGroup);

    console.log("✅ Material radio buttons populated successfully.");
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

    // Sort numerically by the number before the hyphen
    projectSizeData.sort((a, b) => {
        const numA = parseInt(a.displayName.split('-')[0].trim(), 10) || 0;
        const numB = parseInt(b.displayName.split('-')[0].trim(), 10) || 0;
        return numA - numB; // Numeric comparison
    });

    if (projectSizeData.length === 0) {
        container.innerHTML = '<p>No project sizes available</p>';
        return;
    }

    // Create a flex container for alignment
    const radioGroup = document.createElement('div');
    radioGroup.classList.add('radio-group'); // Ensures proper styling

    projectSizeData.forEach(item => {
        const label = document.createElement('label');
        label.classList.add('radio-label'); // Styling class

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value; // Store Margin Variance as value
        radio.name = "projectSizeSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`)); // Show Project Size
        radioGroup.appendChild(label);
    });

    container.appendChild(radioGroup);

    console.log("Project Size radio buttons populated successfully.");
}


// Attach event listeners to all radio buttons
document.addEventListener('change', event => {
    if (event.target.type === 'radio') {
        updateTotalMarginVariance();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const totalMarginContainer = document.querySelector("totalMarginVariance");
    
    // Initially hide the container
    if (totalMarginContainer) {
        totalMarginContainer.style.display = "none";
        console.log("✅ Total Margin Container is hidden initially.");
    } else {
        console.error("❌ Error: Total Margin Container not found!");
    }

    
    
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 DOM fully loaded.");

    const clientNameContainer = document.getElementById("clientNameContainer");
    const vanirOfficeDropdown = document.getElementById("vanirOffice");
    const clientDropdown = document.getElementById("clientName");

    // **Check if elements exist before proceeding**
    if (!vanirOfficeDropdown) {
        console.error("❌ Error: Vanir Office dropdown not found!");
        return;
    }

    if (!clientNameContainer) {
        console.error("❌ Error: Client Name container not found!");
        return;
    }

    if (!clientDropdown) {
        console.error("❌ Error: Client Name dropdown not found!");
        return;
    }

    // **Initially hide the Client Name container**
    clientNameContainer.style.display = "none";
    console.log("✅ Client Name dropdown is initially hidden.");

    // **Show Client Name dropdown & Fetch Clients when Vanir Office is selected**
    vanirOfficeDropdown.addEventListener("change", function () {
        if (vanirOfficeDropdown.value) {
            clientNameContainer.style.display = "block"; // Show the section
            console.log("✅ Client Name dropdown is now visible.");
            fetchClientNames(); // ✅ Fetch Client Names based on selected office
        } else {
            clientNameContainer.style.display = "none"; // Hide if no office is selected
        }
    });

    // **Attach Event Listener to Client Name Dropdown**
    console.log("✅ Client Name dropdown found. Adding event listener.");
    clientDropdown.addEventListener("change", updateMargin);
});


// **Calculate & Update Total Margin Variance**
function updateTotalMarginVariance() {
    let total = 0;
    console.log("🔍 Updating Total Margin Variance...");

    // Sum up selected radio button values
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        const value = parseFloat(radio.value);
        if (!isNaN(value)) {
            console.log(`✅ Selected: ${radio.name} -> Value: ${value}`);
            total += value;
        } else {
            console.warn(`⚠️ Invalid value detected for ${radio.name}: ${radio.value}`);
        }
    });

    console.log(`📊 Total Margin before tier adjustment: ${total.toFixed(2)}%`);

    const selectedTier = document.querySelector('input[name="tierSelection"]:checked');
    let minMargin = total, maxMargin = total;

    if (selectedTier) {
        const tierLabel = selectedTier.nextSibling ? selectedTier.nextSibling.textContent.trim() : "Unknown";
        console.log(`🎯 Selected Tier: ${tierLabel}`);

        switch (tierLabel) {
            case "Tier 1 Base":
                minMargin = total - 2;
                maxMargin = total + 2;
                break;
            case "Tier 2 Base":
                minMargin = total - 1;
                maxMargin = total + 1;
                break;
            case "Tier 3 Base":
                minMargin = Math.max(0, total - 1);
                maxMargin = total + 2;
                break;
            default:
                console.warn(`⚠️ Unknown tier label: ${tierLabel}`);
        }
    } else {
        console.log("ℹ️ No Tier selected, using default values.");
    }

    console.log(`📏 Calculated Margin Range: Min=${minMargin.toFixed(2)}%, Max=${maxMargin.toFixed(2)}%`);

    const marginInput = document.getElementById('totalMarginVariance');

    if (marginInput) {
        marginInput.value = `Recommended Margin: ${total.toFixed(2)}% (Range: ${minMargin.toFixed(2)}% - ${maxMargin.toFixed(2)}%)`;
        console.log(`✅ Updated totalMarginVariance input: ${marginInput.value}`);
    } else {
        console.error("❌ Error: Element with ID 'totalMarginVariance' not found.");
    }
}





// Attach event listeners to all radio buttons including tiers
document.addEventListener('change', event => {
    if (event.target.type === 'radio') {
        updateTotalMarginVariance();
    }
});



fetchData();