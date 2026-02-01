export async function uploadLenses(data: string, domain: string): Promise<Response> {
    const baseUrl = `${domain}/Library`;

    const dataJson = JSON.parse(data);

    const response = await fetch(`${baseUrl}?name=${encodeURIComponent(dataJson.name)}`, {
        method: 'GET'
    })

    if (!response.ok) {
        console.warn(`Warning: GET request failed with status ${response.status}`);
        const errorText = await response.text();
        console.warn(`GET error: ${errorText}`);
    }

    const responseBody = response.ok ? await response.json() : { total: 0 };

    if (response.status === 200 && responseBody.total > 0) {
        const existingId = responseBody.entry[0].resource.id;
        console.log(`Updating existing lens: ${dataJson.name} (ID: ${existingId})`);

        // Ensure the id in the data matches the existing resource ID for PUT
        const updateData = JSON.parse(data);
        updateData.id = existingId;

        const options = {
            body: JSON.stringify(updateData),
            headers: {
                'Content-Type': 'application/fhir+json',
            },
            method: 'PUT',
        };

        const putResponse = await fetch(`${baseUrl}/${existingId}`, options);
        
        if (!putResponse.ok) {
            const errorText = await putResponse.text();
            console.error(`PUT failed (${putResponse.status}): ${errorText}`);
        }
        
        return putResponse;

    }

    console.log(`Creating new lens: ${dataJson.name}`);

    // Remove id field for POST - FHIR servers generate IDs for new resources
    const postData = JSON.parse(data);
    delete postData.id;

    const options = {
        body: JSON.stringify(postData),
        headers: {
            'Content-Type': 'application/fhir+json',
        },
        method: 'POST',
    };

    const postResponse = await fetch(baseUrl, options);
    
    if (!postResponse.ok) {
        const errorText = await postResponse.text();
        console.error(`POST failed (${postResponse.status}): ${errorText}`);
    }
    
    return postResponse;

}
