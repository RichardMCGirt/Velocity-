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
    "0.0": "Single Family",
    "0.5": "2 Story Townhomes",
    "1.0": "3 Story Townhomes",
    "1.5": "4 Story Townhomes"
};

// Mapping material numbers to actual names
const materialMapping = {
    "0.0": "Hard Siding",
    "1.0": "Vinyl",
    "3.0": "Labor Only"
};



function filterResults() {
    console.log("🔍 Running filterResults...");

    const selectedOffice = document.getElementById("vanirOffice").value.trim();
    const selectedSidingStyleValue = document.querySelector('#materialRadioButtons input[type="radio"]:checked')?.value?.trim() || '';
    const selectedProjectTypeValue = document.querySelector('#projectRadioButtons input[type="radio"]:checked')?.value?.trim() || '';

    // ✅ Convert numeric material and project type values back to text
    const selectedSidingStyle = materialMapping[selectedSidingStyleValue] || selectedSidingStyleValue;
    const selectedProjectType = projectTypeMapping[selectedProjectTypeValue] || selectedProjectTypeValue;

    console.log("✅ Selected Office:", selectedOffice);
    console.log("✅ Selected Siding Style (Mapped):", selectedSidingStyle);
    console.log("✅ Selected Project Type (Mapped):", selectedProjectType);

    console.log("🧐 Available Fields in a Record:", Object.keys(allRecords[0]?.fields || {}));
    console.log("🧐 Project Types in Airtable:", allRecords.map(record => `"${record.fields?.['Type']}"`));
    console.log("🧐 Materials in Airtable:", allRecords.map(record => `"${record.fields?.['Siding Style']}"`));

    const filteredRecords = allRecords.filter(record => {
        const office = record.fields?.['Vanir Offices']?.trim().toLowerCase() || '';
        const siding = record.fields?.['Siding Style']?.trim().replace(/"/g, '') || 'unknown';  // ✅ Remove quotes
        const type = record.fields?.['Type']?.trim().replace(/"/g, '') || 'unknown';  // ✅ Remove quotes

        return (!selectedOffice || office === selectedOffice.toLowerCase()) &&
               (!selectedSidingStyle || siding === selectedSidingStyle) &&
               (!selectedProjectType || type === selectedProjectType);
    });

    console.log("✅ Filtered Records Count:", filteredRecords.length, filteredRecords);
    displayResults(filteredRecords);
}





    
    
    
    
    

    /** Display filtered records in a table */
    function displayResults(records) {
        const container = document.getElementById('resultsContainer');
        console.log("✅ Updating resultsContainer", records.length);
    
        container.innerHTML = ''; // Clear previous results
    
        if (records.length === 0) {
            container.innerHTML = '<p>No matching results found.</p>';
            return;
        }
    
        let tableHTML = `
            <table>
                <tr>
                    <th>Description</th>
                    <th>Price/Rate (UOM)</th>
                </tr>
        `;
    
        records.forEach(record => {
            const priceRate = record.fields['Price/Rate'] || 'N/A';
            const uom = record.fields['UOM'] || '';
            const priceWithUOM = uom ? `${priceRate} ${uom}` : priceRate;
    
            tableHTML += `
                <tr>
                    <td>${record.fields.Description || 'N/A'}</td>
                    <td>${priceWithUOM}</td>
                </tr>
            `;
        });
    
        tableHTML += `</table>`;
        
        container.innerHTML = tableHTML;
    }
    
})();
