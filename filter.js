(() => {
    const airtableApiKey2 = 'pat1Eu3iQYHDmLSWr.ecfb8470f9c2b8409a0017e65f5b8cf626208e4df1a06905a41019cb38a8534b';
    const baseId2 = 'appTxtZtAlIdKQ7Wt';
    const tableId2 = 'tblGJfNIqlT0dCkUX'; // Table for Description & Price/Rate

    let allRecords = []; // Store all records globally for filtering

    document.addEventListener("DOMContentLoaded", async function () {
        const resultsContainer = document.getElementById("resultsContainer");
        const sortingControls = document.getElementById("sortingControlsContainer");
        const materialRadioButtons = document.getElementById("materialRadioButtons");
    
        // Ensure both elements are hidden on page load
        if (resultsContainer) {
            resultsContainer.style.display = "none";
            resultsContainer.style.visibility = "hidden";
        }
        if (sortingControls) {
            sortingControls.style.display = "none";
            sortingControls.style.visibility = "hidden";
        }
    
        console.log("✅ Page loaded: resultsContainer & sortingControls are hidden");
    
        await fetchAllData(); // Fetch Airtable data on page load
    
        document.getElementById("vanirOffice").addEventListener("change", filterResults);
        document.getElementById("projectRadioButtons").addEventListener("change", filterResults);
    
        // Listen for radio button selection
        materialRadioButtons.addEventListener("change", function (event) {
            if (event.target.type === "radio") {
                console.log("🎯 Selected material:", event.target.value);
    
                resultsContainer.style.display = "block"; // Show results
                resultsContainer.style.visibility = "visible";
                sortingControls.style.display = "flex";  // Show sorting buttons
                sortingControls.style.visibility = "visible";
    
                console.log("📌 resultsContainer & sortingControls are now visible");
                filterResults();
            }
        });
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
                    headers: { Authorization: `Bearer ${airtableApiKey2}` }
                });

                if (!response.ok) throw new Error('Failed to fetch data');

                const data = await response.json();
                allRecords = [...allRecords, ...data.records]; // Append new records

                offset = data.offset || ''; // Get next offset if available
            } while (offset); // Continue if there's more data

            console.log("✅ Total Records Fetched:", allRecords.length);

            populateVanirOffices(allRecords);
            populateSidingStyle(allRecords);
            displayResults(allRecords);
        } catch (error) {
            console.error("❌ Error fetching data:", error);
            document.getElementById('resultsContainer').innerHTML = '<p>Error loading data.</p>';
        }
    }

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
            records.map(record => record.fields['Siding Style']?.trim().replace(/"/g, ''))
            .filter(Boolean)
        )];

        // ❌ Remove "Universal", but ensure "Labor Only" exists
        sidingStyles = sidingStyles.filter(style => style.toLowerCase() !== "universal");
        if (!sidingStyles.includes("Labor Only")) sidingStyles.push("Labor Only");

        // Sort alphabetically
        sidingStyles.sort();

        sidingStyles.forEach(style => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.value = style.trim();
            radio.name = "sidingStyle"; // Ensure all have the same name

            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${style}`));
            container.appendChild(label);
        });

        console.log("✅ Siding Styles Populated:", sidingStyles);
    }

    const projectTypeMapping = {
        "0": "Single Family",
        "0.5": "2 Story Townhomes",
        "1": "3 Story Townhomes",
        "1.5": "4 Story Townhomes"
    };

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

        const selectedSidingStyle = materialMapping[selectedSidingStyleValue] || selectedSidingStyleValue;
        const selectedProjectType = projectTypeMapping[selectedProjectTypeValue] || selectedProjectTypeValue;

        const filteredRecords = allRecords.filter(record => {
            const office = (record.fields?.['Vanir Offices'] || '').trim().toLowerCase();
            const siding = (record.fields?.['Siding Style'] || '').trim().replace(/"/g, '');
            const type = (record.fields?.['Type'] || '').trim().replace(/"/g, '');

            return (!selectedOffice || office === selectedOffice.toLowerCase()) &&
                   (!selectedSidingStyle || siding.toLowerCase() === selectedSidingStyle.toLowerCase()) &&
                   (!selectedProjectType || type.toLowerCase() === selectedProjectType.toLowerCase());
        });

        console.log("✅ Filtered Records Count:", filteredRecords.length);
        displayResults(filteredRecords);
    }

    function displayResults(records) {
        const container = document.getElementById('resultsContainer');
        const sortingControls = document.getElementById('sortingControlsContainer');
        
        console.log("✅ Updating resultsContainer with", records.length, "records.");
        container.innerHTML = '';

        if (!records || records.length === 0) {
            container.innerHTML = '<p>No matching results found.</p>';
            if (sortingControls) sortingControls.style.display = 'none';
            container.style.display = 'block';
            return;
        }

        if (sortingControls) sortingControls.style.display = 'flex';

        let tableHTML = `
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
        container.style.display = 'block';
        window.currentRecords = records;
    }

    function generateTableRows(records) {
        return records.map(record => {
            const priceRate = record.fields['Price/Rate'] || 'N/A';
            const uom = record.fields['UOM'] || '';
            const priceWithUOM = uom ? `${priceRate} ${uom}` : priceRate;

            return `<tr><td>${record.fields.Description || 'N/A'}</td><td>${priceWithUOM}</td></tr>`;
        }).join('');
    }

    window.sortResults = function (criteria) {
        let displayedRows = Array.from(document.querySelectorAll("#tableBody tr"));
        console.log(`🔄 Sorting visible results by: ${criteria}`);

        let sortedRows = displayedRows.sort((rowA, rowB) => {
            return criteria === "alphabetical" ? rowA.cells[0].textContent.localeCompare(rowB.cells[0].textContent) :
                   criteria === "priceAsc" ? parseFloat(rowA.cells[1].textContent) - parseFloat(rowB.cells[1].textContent) :
                   parseFloat(rowB.cells[1].textContent) - parseFloat(rowA.cells[1].textContent);
        });

        const tableBody = document.getElementById("tableBody");
        tableBody.innerHTML = "";
        sortedRows.forEach(row => tableBody.appendChild(row));
    };
})();
