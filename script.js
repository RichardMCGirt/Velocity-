const airtableApiKey = 'pat1Eu3iQYHDmLSWr.ecfb8470f9c2b8409a0017e65f5b8cf626208e4df1a06905a41019cb38a8534b';
const baseId = 'appTxtZtAlIdKQ7Wt';

const vanirOfficeTableId = 'tbl9hEx6uvFWK8Wd8'; // Table for Vanir Office Dropdown
const clientTableId = 'tblVpJCbIKpUqvnMg'; // Table for Client Name Dropdown
const projectSizeTableId = 'tblxiSxZuDcp8HmME'; // Table for Project Size (Stores Margin Variance)
const locationTableId = 'tblyDCOuu9IhypEW9'; // Table for Project Size (Stores Margin Variance)
const projecttypeTableId = 'tblkgM96KX0j1jnYt'; // Table for Project Size (Stores Margin Variance)
const materialTableId = 'tbllwD5cOKgjFFk3U'; // Table for Material (Stores Margin Variance)
let projectSizeData = [];
const totalMarginContainer = document.getElementById("totalMarginVariance");

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

    // Calculate total margin variance
    let totalMargin = margin + additionalMargin;

    // Update UI elements
    document.getElementById("accountType").textContent = accountType;
    document.getElementById("margin").textContent = `${margin}%`;
    document.getElementById("totalMarginVariance").value = `Recommended Margin: ${totalMargin.toFixed(2)}%`;

    updateTotalMarginVariance(); // ← Add this!

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
            event.target.value = previousSelections[selectedMaterial];
            updateTotalMarginVariance();
            return;
        }

        let marginVariance = await getMarginVarianceFromAirtable(selectedMaterial);

        if (marginVariance === null) {
            return;
        }

        previousSelections[selectedMaterial] = marginVariance; // Store the fetched value

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
    allClients = []; // ✅ Clear before refetching

    let offset = '';
    try {
        console.log("🔄 Starting to fetch client names from Airtable...");
        do {
            const url = `https://api.airtable.com/v0/${baseId}/${clientTableId}?offset=${offset}`;
            
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${airtableApiKey}` }
            });

            if (!response.ok) throw new Error(`Failed to fetch client names. Status: ${response.status}`);

            const data = await response.json();

            // ✅ Filter out records with Account Type = "Commercial"
            const filtered = data.records.filter(record => record.fields['Account Type'] !== 'Commercial');

            console.log(`🧹 Filtered to ${filtered.length} non-commercial records`);

            allClients = [...allClients, ...filtered];
            offset = data.offset || '';
        } while (offset);

        console.log(`✅ Finished loading. Total non-commercial clients fetched: ${allClients.length}`);
    } catch (error) {
        console.error("❌ Error fetching clients:", error);
    }
}

function fetchClientNames() {
    const selectedOffice = document.getElementById('vanirOffice').value;

    if (!selectedOffice) {
        console.warn("⚠️ No office selected. Aborting client filtering.");
        populateClientDropdown([]); // ← Clear dropdown
        return;
    }

    const filteredClients = allClients
        .filter(record => {
            const division = record.fields.Division || '';
            return division.toLowerCase().includes(selectedOffice.toLowerCase());
        })
        .map(record => ({
            id: record.id,
            name: record.fields['Client Name'],
            accountType: record.fields['Account Type']
        }));

    populateClientDropdown(filteredClients); // ✅ Always repopulate
}



function populateClientDropdown(clients) {
    const dropdown = document.getElementById("clientName");

    if (!dropdown) {
        console.error("❌ Client Name dropdown not found.");
        return;
    }

    dropdown.innerHTML = '<option value="">Select a client</option>';

    if (clients.length === 0) {
        dropdown.innerHTML = '<option value="">No matching clients</option>';
        return;
    }

    // ✅ Sort clients alphabetically
    clients.sort((a, b) => a.name.localeCompare(b.name));

    clients.forEach(client => {
        const option = document.createElement("option");
        option.value = client.id;
        option.textContent = client.name;
        option.dataset.accountType = client.accountType || "Unknown";
        dropdown.appendChild(option);
    });

    console.log(`✅ Populated ${clients.length} clients in dropdown (sorted).`);

    // ✅ Re-initialize Tom Select after populating options
    if (dropdown.tomselect) {
        dropdown.tomselect.destroy(); // Remove old instance if it exists
    }

    new TomSelect("#clientName", {
        create: false,
        sortField: {
            field: "text",
            direction: "asc"
        },
        placeholder: "Select or search for a client"
    });
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

        console.log(`📦 Raw Project Size Records Fetched: ${data.records.length}`);
        data.records.forEach((record, idx) => {
            console.log(`➡️ Record ${idx + 1}:`, {
                'Project Size': record.fields['Project Size'],
                'Margin Variance': record.fields['Margin Variance']
            });
        });

        populateProjectSizeRadioButtons(data.records);

    } catch (error) {
        console.error("❌ Error fetching project sizes:", error);
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
    const keyContainer = document.getElementById('materialKey');
    container.innerHTML = '';
    keyContainer.innerHTML = '<strong>Material Types:</strong><ul>';

    let materialData = [];

    records.forEach(record => {
        if (record.fields['Material Type'] && record.fields['Margin Variance']) {
            materialData.push({
                displayName: record.fields['Material Type'].trim(),
                value: record.fields['Margin Variance']
            });
        }
    });

    materialData.sort((a, b) => a.displayName.localeCompare(b.displayName));

    const radioGroup = document.createElement('div');
    radioGroup.classList.add('radio-group');

    materialData.forEach(item => {
        const label = document.createElement('label');
        label.classList.add('radio-label');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value;
        radio.name = "materialSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`));
        radioGroup.appendChild(label);

        // Add to key
        keyContainer.innerHTML += `<li>${item.displayName}: <strong>${item.value}%</strong></li>`;
    });

    container.appendChild(radioGroup);
    keyContainer.innerHTML += '</ul>';
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
    const keyContainer = document.getElementById('locationKey');
    container.innerHTML = '';
    keyContainer.innerHTML = '<strong>Locations:</strong><ul>';

    projectSizeData = [];

    records.forEach(record => {
        const distance = record.fields['Distance'];
        const variance = record.fields['Margin Variance'];

        if (distance !== undefined && variance !== undefined) {
            projectSizeData.push({
                displayName: distance,
                value: variance
            });
        }
    });

    console.log('Total matching records:', projectSizeData.length);

    // Remove duplicates by Distance (optional)
    projectSizeData = [...new Map(projectSizeData.map(item => [item.displayName, item])).values()];
    console.log('After deduplication:', projectSizeData.length);

    projectSizeData.sort((a, b) => a.displayName.localeCompare(b.displayName));

    if (projectSizeData.length === 0) {
        container.innerHTML = '<p>No location available</p>';
        keyContainer.innerHTML += '<li>No locations found.</li></ul>';
        return;
    }

    projectSizeData.forEach(item => {
        const label = document.createElement('label');
        label.style.display = 'block'; // ensures they stack visibly
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = String(item.value); // Ensures even 0 becomes "0"
        radio.name = "locationSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`));
        container.appendChild(label);

        keyContainer.innerHTML += `<li>${item.displayName}: <strong>${item.value}%</strong></li>`;
    });

    keyContainer.innerHTML += '</ul>';
}


function populateProjecttypeRadioButtons(records) {
    const container = document.getElementById('projectRadioButtons');
    const keyContainer = document.getElementById('projectTypeKey');
    container.innerHTML = '';
    keyContainer.innerHTML = '<strong>Project Types:</strong><ul>';

    let projectTypeData = [];

    records.forEach((record, index) => {
        const projectType = record.fields['Project Type'];
        const marginVariance = record.fields['Margin Variance'];


        // Include zero values, exclude only null or undefined
        if (projectType !== undefined && projectType !== null &&
            marginVariance !== undefined && marginVariance !== null) {
            projectTypeData.push({
                displayName: projectType,
                value: marginVariance
            });
        } else {
            console.warn(`⚠️ Skipped record ${index} due to missing Project Type or Margin Variance.`);
        }
    });

    // Sort with "Single Family" always on top
    projectTypeData.sort((a, b) => {
        if (a.displayName === "Single Family") return -1;
        if (b.displayName === "Single Family") return 1;
        return a.displayName.localeCompare(b.displayName);
    });

    if (projectTypeData.length === 0) {
        container.innerHTML = '<p>No Project Types available</p>';
        keyContainer.innerHTML += '<li>No project types found.</li></ul>';
        console.warn("⚠️ No valid Project Types found to display.");
        return;
    }

    projectTypeData.forEach((item, idx) => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value;
        radio.name = "projectTypeSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`));
        container.appendChild(label);

        keyContainer.innerHTML += `<li>${item.displayName}: <strong>${item.value}%</strong></li>`;
    });

    keyContainer.innerHTML += '</ul>';
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

document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("toggleMarginKey");
    const marginKey = document.getElementById("marginKey");

    if (toggleButton && marginKey) {
        toggleButton.addEventListener("click", () => {
            if (marginKey.style.display === "none") {
                marginKey.style.display = "block";
                toggleButton.textContent = "📘 Hide Margin Key";
            } else {
                marginKey.style.display = "none";
                toggleButton.textContent = "📘 Show Margin Key";
            }
        });
    } else {
        console.error("❌ Margin key toggle elements not found.");
    }
});

function populateProjectSizeRadioButtons(records) {
    const container = document.getElementById('projectSizeRadioButtons');
    const keyContainer = document.getElementById('projectSizeKey');
    container.innerHTML = '';
    keyContainer.innerHTML = '<strong>Project Sizes:</strong><ul>';

    let projectSizeData = [];

    records.forEach(record => {
        const size = record.fields['Project Size'];
        const variance = record.fields['Margin Variance'];

        if (
            size !== undefined && size !== null && size !== '' &&
            variance !== undefined && variance !== null
        ) {
            projectSizeData.push({
                displayName: size,
                value: variance
            });
        } else {
            console.warn('⚠️ Skipped record:', { size, variance });
        }
    });

    // ✅ Sort by number at beginning of range or "Over" as high number
    const getNumericValue = label => {
        if (label.toLowerCase().includes("over")) return 10000; // puts "Over 200" last
        const firstPart = label.split('-')[0].trim();
        const num = parseInt(firstPart, 10);
        return isNaN(num) ? 0 : num;
    };

    projectSizeData.sort((a, b) => getNumericValue(a.displayName) - getNumericValue(b.displayName));

    if (projectSizeData.length === 0) {
        container.innerHTML = '<p>No project sizes available</p>';
        keyContainer.innerHTML += '<li>No project sizes found.</li></ul>';
        return;
    }

    const radioGroup = document.createElement('div');
    radioGroup.classList.add('radio-group');

    projectSizeData.forEach(item => {
        const label = document.createElement('label');
        label.classList.add('radio-label');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = item.value;
        radio.name = "projectSizeSelection";

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.displayName}`));
        radioGroup.appendChild(label);

        // Add to key
        keyContainer.innerHTML += `<li>${item.displayName}: <strong>${item.value}%</strong></li>`;
    });

    container.appendChild(radioGroup);
    keyContainer.innerHTML += '</ul>';
}



// Attach event listeners to all radio buttons
document.addEventListener('change', event => {
    if (event.target.type === 'radio') {
        updateTotalMarginVariance();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const totalMarginContainer = document.getElementById("totalMarginVariance");
    if (totalMarginContainer) {
        totalMarginContainer.style.display = "block";
    }
    if (totalMarginContainer) {
        totalMarginContainer.style.display = "none";
    } else {
        console.error("❌ Error: Total Margin Container not found!");
    } 
});

document.addEventListener("DOMContentLoaded", function () {

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

    // **Show Client Name dropdown & Fetch Clients when Vanir Office is selected**
    vanirOfficeDropdown.addEventListener("change", function () {
        const clientDropdown = document.getElementById("clientName");
    
        if (vanirOfficeDropdown.value) {
            clientNameContainer.style.display = "block";
    
            // Clear existing Tom Select instance before re-fetching
            if (clientDropdown.tomselect) {
                clientDropdown.tomselect.destroy();
            }
    
            clientDropdown.innerHTML = '<option value="">Loading...</option>'; // Temporary loading state
    
            fetchClientNames(); // ✅ Repopulate based on selected office
        } else {
            clientNameContainer.style.display = "none";
            
            // Clear options if no office is selected
            if (clientDropdown.tomselect) {
                clientDropdown.tomselect.destroy();
            }
            clientDropdown.innerHTML = '<option value="">Select a client</option>';
        }
    });
    

    // **Attach Event Listener to Client Name Dropdown**
    clientDropdown.addEventListener("change", updateMargin);
});

function updateTotalMarginVariance() {
    let total = 0;

    // Sum up selected radio button values
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        const value = parseFloat(radio.value);
        if (!isNaN(value)) {
            total += value;
        } else {
        }
        
    });

    // Fetch required elements
    const clientDropdown = document.getElementById("clientName");
    const totalMarginInput = document.getElementById("totalMarginVariance");

    const totalMarginContainer = document.getElementById("totalMarginVariance");
    if (totalMarginContainer) {
        totalMarginContainer.style.display = "block";
    }

    if (!clientDropdown || !totalMarginInput) {
        console.error("❌ Missing required elements.");
        return;
    }

    if (!clientDropdown) {
        console.error("❌ Error: Client Name dropdown is missing.");
        return;
    }
    if (!totalMarginInput) {
        console.error("❌ Error: Element with ID 'totalMarginVariance' not found in the DOM.");
        return;
    }

    const selectedOption = clientDropdown.options[clientDropdown.selectedIndex];

    let clientName = "No Client Selected";
    let accountType = "Unknown";
    let clientMargin = 0;

    // **Check if a valid client is selected**
    if (selectedOption && selectedOption.value) {
        clientName = selectedOption.textContent.trim();
        accountType = (selectedOption.dataset.accountType || "Unknown").trim();

        // Assign base margin based on Account Type
        switch (accountType) {
            case "National":
                clientMargin = 10;
                break;
            case "Local Production":
                clientMargin = 11;
                break;
            case "Custom":
                clientMargin = 15;  
                console.log("✅ Custom Account Type detected: +15% Base Margin Applied.");
                break;
            default:
                console.warn(`⚠️ Unrecognized Account Type: ${accountType}`);
        }
    } else {
    }

    // **Apply tier-based margin adjustment**
    let minMargin = total + clientMargin;
    let maxMargin = total + clientMargin;

    switch (accountType) {
        case "National":
            minMargin = total + clientMargin - 2;
            maxMargin = total + clientMargin + 2;
            break;
        case "Local Production":
            minMargin = total + clientMargin - 1;
            maxMargin = total + clientMargin + 1;
            break;
        case "Custom":
            minMargin = Math.max(0, total + clientMargin - 1);
            maxMargin = total + clientMargin + 2;
            break;
        default:
            minMargin = total + clientMargin;
            maxMargin = total + clientMargin;
    }
    
    
    



    // **Final total margin calculation**
    let totalMargin = total + clientMargin;

    // **Update UI Elements**
    document.getElementById("accountType").textContent = accountType;
    document.getElementById("margin").textContent = `${clientMargin}%`;

    // **Set the input field value**
    totalMarginInput.value = `Recommended Margin: ${totalMargin.toFixed(2)}% (Range: ${minMargin.toFixed(2)}% - ${maxMargin.toFixed(2)}%)`;
}

// Attach event listeners to all radio buttons including tiers
document.addEventListener('change', event => {
    if (event.target.type === 'radio') {
        updateTotalMarginVariance();
    }
});

fetchData();