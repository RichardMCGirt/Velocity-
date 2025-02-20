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

    /** Fetch all records from Airtable and store them globally */
    async function fetchAllData() {
        const url = `https://api.airtable.com/v0/${baseId2}/${tableId2}`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${airtableApiKey2}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            allRecords = data.records; // Store records globally

            populateVanirOffices(allRecords);
            populateSidingStyle(allRecords);
            populateProjectTypes(allRecords);
            displayResults(allRecords); // Display all records initially
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

    /** Populate Material Used (Mapped to "Siding Style") */
    function populateSidingStyle(records) {
        const container = document.getElementById('materialRadioButtons');
        container.innerHTML = '';

        let sidingStyles = [...new Set(records.map(record => record.fields['Siding Style']).filter(Boolean))];
        sidingStyles.sort();

        sidingStyles.forEach(style => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = style;
            checkbox.name = "sidingStyle";

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${style}`));
            container.appendChild(label);
        });

        console.log("✅ Siding Styles Populated:", sidingStyles);
    }

    /** Populate Project Type (Mapped to "Type") */
    function populateProjectTypes(records) {
        const container = document.getElementById('projectRadioButtons');
        container.innerHTML = '';

        let projectTypes = [...new Set(records.map(record => record.fields['Type']).filter(Boolean))];
        projectTypes.sort();

        projectTypes.forEach(type => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = type;
            checkbox.name = "projectType";

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${type}`));
            container.appendChild(label);
        });

        console.log("✅ Project Types Populated:", projectTypes);
    }

    /** Filter and display records based on selected filters */
    function filterResults() {
        const selectedOffice = document.getElementById("vanirOffice").value;
        const selectedSidingStyles = Array.from(document.querySelectorAll('#materialRadioButtons input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        const selectedProjectTypes = Array.from(document.querySelectorAll('#projectRadioButtons input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        console.log("✅ Selected Office:", selectedOffice);
        console.log("✅ Selected Siding Styles:", selectedSidingStyles.length > 0 ? selectedSidingStyles : "None Selected");
        console.log("✅ Selected Project Types:", selectedProjectTypes.length > 0 ? selectedProjectTypes : "None Selected");

        // Filter records
        const filteredRecords = allRecords.filter(record =>
            (!selectedOffice || record.fields['Vanir Offices'] === selectedOffice) &&
            (selectedSidingStyles.length === 0 || selectedSidingStyles.includes(record.fields['Siding Style'])) &&
            (selectedProjectTypes.length === 0 || selectedProjectTypes.includes(record.fields['Type']))
        );

        console.log("✅ Filtered Records:", filteredRecords);
        displayResults(filteredRecords);
    }

    /** Display filtered records in a table */
    function displayResults(records) {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = '';

        if (records.length === 0) {
            container.innerHTML = '<p>No matching results found.</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>Description</th>
                <th>Price/Rate</th>
            </tr>
        `;

        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.fields.Description || 'N/A'}</td>
                <td>${record.fields['Price/Rate'] || 'N/A'}</td>
            `;
            table.appendChild(row);
        });

        container.appendChild(table);
    }
})();
