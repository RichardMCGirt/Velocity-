(() => {
    const airtableApiKey2 = 'pat1Eu3iQYHDmLSWr.ecfb8470f9c2b8409a0017e65f5b8cf626208e4df1a06905a41019cb38a8534b';
    const baseId2 = 'appTxtZtAlIdKQ7Wt';
    const tableId2 = 'tblGJfNIqlT0dCkUX'; // Table for Description & Price/Rate

    let allRecords = []; // Store all records globally for filtering

    document.addEventListener("DOMContentLoaded", async function () {
        await fetchAllData(); // Fetch Airtable data on page load

        document.getElementById("vanirOffice").addEventListener("change", filterResults);
        document.getElementById("projectRadioButtons").addEventListener("change", filterResults);
        document.getElementById("materialRadioButtons").addEventListener("change", filterResults);
    });

    async function fetchAllData() {
        if (allRecords.length > 0) {
            console.log("🚀 Data already fetched. Skipping new fetch.");
            return;
        }
    
        let url = `https://api.airtable.com/v0/${baseId2}/${tableId2}`;
        let offset = '';
        allRecords = []; // Reset records
    
        try {
            do {
                const response = await fetch(`${url}?offset=${offset}`, {
                    headers: {
                        Authorization: `Bearer ${airtableApiKey2}`
                    }
                });
    
                if (!response.ok) throw new Error('Failed to fetch data');
    
                const data = await response.json();
                allRecords = [...allRecords, ...data.records]; // Append new records
    
                offset = data.offset || ''; // Get next offset if available
            } while (offset); // Continue if there's more data
    
            console.log("✅ Total Records Fetched:", allRecords.length);
    
            // Ensure we only populate project types ONCE
            if (!document.getElementById('projectRadioButtons').innerHTML) {
                populateProjectTypes(allRecords);
            }
    
            populateVanirOffices(allRecords);
            populateSidingStyle(allRecords);
    
            displayResults(allRecords);
        } catch (error) {
            console.error("❌ Error fetching data:", error);
            document.getElementById('resultsContainer').innerHTML = '<p>Error loading data.</p>';
        }
    }
    
    


    /** Populate Vanir Office Dropdown */
    function populateVanirOffices(records) {
        const dropdown = document.getElementById('vanirOffice');
        dropdown.innerHTML = '<option value="">Select an Office</option>'; // Default option

        let officeNames = [...new Set(records.map(record => record.fields['Vanir Offices']).filter(Boolean))];
        officeNames.sort();

        officeNames.forEach(name => {
            const option = document.createElement('option');
            option.textContent = name;
            option.value = name;
            dropdown.appendChild(option);
        });

        console.log("✅ Vanir Offices Populated:", officeNames);
    }

    function populateSidingStyle(records) {
        const container = document.getElementById('materialRadioButtons');
        container.innerHTML = '';
    
        let sidingStyles = [...new Set(
            records.map(record => record.fields['Siding Style']?.trim()).filter(Boolean)
        )];
    
        // ❌ Remove "Universal" from the list
        sidingStyles = sidingStyles.filter(style => style !== "Universal");
    
        // Sort alphabetically
        sidingStyles.sort();
    
        sidingStyles.forEach(style => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.value = style;
            radio.name = "sidingStyle"; // Ensure all have the same name
    
            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${style}`));
            container.appendChild(label);
        });
    
        console.log("✅ Siding Styles Populated (excluding Universal):", sidingStyles);
    }
    
    

    function populateSidingStyle(records) {
        const container = document.getElementById('materialRadioButtons');
        container.innerHTML = '';
    
        let sidingStyles = [...new Set(
            records
                .map(record => record.fields['Siding Style']?.trim().replace(/"/g, ''))
                .filter(Boolean) // Remove null/empty values
        )];
    
        // ✅ Debug before filtering
        console.log("🧐 All Siding Styles Before Filtering:", sidingStyles);
    
        // ❌ Remove "Universal", but DO NOT remove "Labor Only"
        sidingStyles = sidingStyles.filter(style => style.toLowerCase() !== "universal");
    
        // ✅ Ensure "Labor Only" is included
        if (!sidingStyles.includes("Labor Only")) {
            sidingStyles.push("Labor Only");
            console.log("🚀 'Labor Only' was missing and has been added.");
        }
    
        // Sort alphabetically
        sidingStyles.sort();
    
        sidingStyles.forEach(style => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.value = style.trim();  // ✅ Store Material Name
            radio.name = "sidingStyle"; // Ensure all have the same name
    
            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${style}`));
            container.appendChild(label);
        });
    
        console.log("✅ Final Siding Styles (excluding Universal, including Labor Only):", sidingStyles);
    }
    

  // Mapping project type numbers to actual names
const projectTypeMapping = {
    "0": "Single Family",
    "0.5": "2 Story Townhomes",
    "1": "3 Story Townhomes",
    "1.5": "4 Story Townhomes"
};

// Mapping material numbers to actual names
const materialMapping = {
    "0": "Hard Siding",
    "1": "Vinyl",
    "3.0": "Labor Only"
};



function filterResults() {
    console.log("🔍 Running filterResults...");

    const selectedOffice = document.getElementById("vanirOffice").value.trim();
    const selectedSidingStyleValue = document.querySelector('#materialRadioButtons input[type="radio"]:checked')?.value?.trim() || '';
    const selectedProjectTypeValue = document.querySelector('#projectRadioButtons input[type="radio"]:checked')?.value?.trim() || '';

    // Convert numeric material and project type values back to text
    const selectedSidingStyle = materialMapping[selectedSidingStyleValue] || selectedSidingStyleValue;
    const selectedProjectType = projectTypeMapping[selectedProjectTypeValue] || selectedProjectTypeValue;

    // 🧐 Debug logs to track what is being selected
    console.log("✅ Selected Office:", selectedOffice);
    console.log("🔍 Raw Selected Project Type Value:", selectedProjectTypeValue);
    console.log("🔍 Mapped Project Type:", selectedProjectType);
    console.log("🔍 Raw Selected Siding Style Value:", selectedSidingStyleValue);
    console.log("🔍 Mapped Siding Style:", selectedSidingStyle);

    console.log("🧐 Available Fields in a Record:", Object.keys(allRecords[0]?.fields || {}));
    console.log("🧐 Project Types in Airtable:", allRecords.map(record => `"${record.fields?.['Type']}"`));
    console.log("🧐 Materials in Airtable:", allRecords.map(record => `"${record.fields?.['Siding Style']}"`));

    const filteredRecords = allRecords.filter(record => {
        const office = (record.fields?.['Vanir Offices'] || '').trim().toLowerCase();
        const siding = (record.fields?.['Siding Style'] || '').trim().replace(/"/g, '');
        const type = (record.fields?.['Type'] || '').trim().replace(/"/g, '');

        return (!selectedOffice || office === selectedOffice.toLowerCase()) &&
               (!selectedSidingStyle || siding.toLowerCase() === selectedSidingStyle.toLowerCase()) &&
               (!selectedProjectType || type.toLowerCase() === selectedProjectType.toLowerCase());
    });

    console.log("✅ Filtered Records Count:", filteredRecords.length, filteredRecords);
    displayResults(filteredRecords);
}


/** Display filtered records in a table with sorting options */
function displayResults(records) {
    const container = document.getElementById('resultsContainer');
    console.log("✅ Updating resultsContainer", records.length);

    container.innerHTML = ''; // Clear previous results

    if (records.length === 0) {
        container.innerHTML = '<p>No matching results found.</p>';
        return;
    }

    // Sorting Controls
    let sortingControls = `
        <div class="sorting-buttons">
            <button onclick="sortResults('alphabetical')">Sort A-Z</button>
            <button onclick="sortResults('priceAsc')">Sort by Price ↑</button>
            <button onclick="sortResults('priceDesc')">Sort by Price ↓</button>
        </div>
    `;

    let tableHTML = `
        ${sortingControls}
        <table class="styled-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Price/Rate (UOM)</th>
                </tr>
            </thead>
            <tbody id="tableBody">
                ${generateTableRows(records)}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
    window.currentRecords = records; // Store for sorting
}


/** Generate table rows based on records */
function generateTableRows(records) {
    return records.map(record => {
        const priceRate = record.fields['Price/Rate'] || 'N/A';
        const uom = record.fields['UOM'] || '';
        const priceWithUOM = uom ? `${priceRate} ${uom}` : priceRate;

        return `
            <tr>
                <td>${record.fields.Description || 'N/A'}</td>
                <td>${priceWithUOM}</td>
            </tr>
        `;
    }).join('');
}

/** Sort only the currently displayed results */
window.sortResults = function (criteria) {
    let displayedRows = Array.from(document.querySelectorAll("#tableBody tr")); // Get only displayed rows
    console.log(`🔄 Sorting visible results by: ${criteria}`);

    let sortedRows = displayedRows.sort((rowA, rowB) => {
        let descA = rowA.cells[0].textContent.trim().toLowerCase();
        let descB = rowB.cells[0].textContent.trim().toLowerCase();

        let priceA = parseFloat(rowA.cells[1].textContent.trim()) || 0;
        let priceB = parseFloat(rowB.cells[1].textContent.trim()) || 0;

        return criteria === "alphabetical" ? descA.localeCompare(descB) :
               criteria === "priceAsc" ? priceA - priceB :
               priceB - priceA;
    });

    // Update the table with sorted rows
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";
    sortedRows.forEach(row => tableBody.appendChild(row));
};

    
})();