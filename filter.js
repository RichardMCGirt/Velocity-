(() => {
    const airtableApiKey2 = 'pat1Eu3iQYHDmLSWr.ecfb8470f9c2b8409a0017e65f5b8cf626208e4df1a06905a41019cb38a8534b';
    const baseId2 = 'appTxtZtAlIdKQ7Wt';
    const tableId2 = 'tblGJfNIqlT0dCkUX'; // Table for Description & Price/Rate

    let allRecords = []; // Store all records globally for filtering

    document.addEventListener("DOMContentLoaded", async function () {
        await fetchAllData();

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
            displayResults(allRecords); // Display all records initially
        } catch (error) {
            console.error("❌ Error fetching data:", error);
            document.getElementById('resultsContainer').innerHTML = '<p>Error loading data.</p>';
        }
    }

    /** Filter and display records based on user input */
    function filterResults() {
        const searchTerm = document.getElementById("searchInput").value.toLowerCase();

        const filteredRecords = allRecords.filter(record =>
            record.fields['Description']?.toLowerCase().includes(searchTerm) ||
            String(record.fields['Price/Rate'] || '').toLowerCase().includes(searchTerm)
        );

        displayResults(filteredRecords);
    }

    /** Display records in a table */
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
