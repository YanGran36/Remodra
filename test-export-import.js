// Simple test script to verify export/import functionality
const testExportImport = async () => {
  try {
    // Test export
    console.log('Testing export...');
    const exportResponse = await fetch('/api/protected/clients/export', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!exportResponse.ok) {
      throw new Error(`Export failed: ${exportResponse.status} ${exportResponse.statusText}`);
    }
    
    const exportData = await exportResponse.json();
    console.log('Export successful. Data:', exportData);
    
    // Test import with the same data
    console.log('Testing import...');
    const importResponse = await fetch('/api/protected/clients/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        clientsData: exportData
      })
    });
    
    if (!importResponse.ok) {
      throw new Error(`Import failed: ${importResponse.status} ${importResponse.statusText}`);
    }
    
    const importResult = await importResponse.json();
    console.log('Import successful. Result:', importResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run test
testExportImport();