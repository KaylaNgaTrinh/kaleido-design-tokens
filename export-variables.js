#!/usr/bin/env node

/**
 * Figma Kaleido Design System Variables Exporter (LOCAL ONLY)
 * Fetches only LOCAL variables (excludes linked library collections)
 * Exports to JSON
 *
 * Usage:
 *   export FIGMA_TOKEN="your-token"
 *   node export-variables.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const FILE_KEY = 'X0woErS5JGnv0zDLNhjKkg'; // Kaleido Design System
const TOKEN = process.env.FIGMA_TOKEN || process.argv[2];
const OUTPUT_FILE = path.join(__dirname, 'variables.json');

if (!TOKEN) {
  console.error('❌ Error: FIGMA_TOKEN not found');
  console.error('   Set FIGMA_TOKEN environment variable or pass as argument');
  process.exit(1);
}

async function fetchFromFigma(endpoint) {
  const url = `${FIGMA_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-FIGMA-TOKEN': TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ API call failed: ${error.message}`);
    throw error;
  }
}

async function exportVariables() {
  console.log('🚀 Starting Figma variables export (local collections only)...\n');

  try {
    // Fetch all variables and collections
    console.log('📥 Fetching Figma variables and collections...');
    const response = await fetchFromFigma(`/files/${FILE_KEY}/variables/local`);

    // Extract from meta object
    const variablesObj = response.meta?.variables || {};
    const collectionsObj = response.meta?.variableCollections || {};

    // Convert to arrays
    const variablesArray = Object.values(variablesObj);
    const collectionsArray = Object.values(collectionsObj);

    if (variablesArray.length === 0) {
      throw new Error('No variables found in response');
    }

    console.log(`📊 Found ${variablesArray.length} total variables across ${collectionsArray.length} collections\n`);

    // Filter to ONLY local collections (IDs without external file key hash)
    // Local collection IDs format: VariableCollectionId:123:456
    // External collection IDs format: VariableCollectionId:hash/123:456
    const localCollections = collectionsArray.filter(coll => !coll.id.includes('/'));
    const externalCollections = collectionsArray.filter(coll => coll.id.includes('/'));

    console.log(`✅ Local collections: ${localCollections.length}`);
    console.log(`⚠️  External/linked collections: ${externalCollections.length}`);
    console.log(`   (External collections will be excluded)\n`);

    // Get local collection IDs for filtering
    const localCollectionIds = new Set(localCollections.map(c => c.id));

    // Filter variables to only those in local collections
    const localVariables = variablesArray.filter(v =>
      localCollectionIds.has(v.variableCollectionId)
    );

    console.log(`📋 Local variables to export: ${localVariables.length}\n`);

    if (localVariables.length === 0) {
      console.warn('⚠️  Warning: No variables found in local collections');
    }

    // Organize variables by collection
    const organized = organizeVariables(localVariables, localCollections);

    // Write to file
    console.log(`📝 Writing to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(organized, null, 2));

    // Log summary
    const stats = {
      totalVariables: localVariables.length,
      collections: Object.keys(organized.collections).length,
      exportedAt: new Date().toISOString(),
    };

    console.log('✅ Export completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Total variables exported: ${stats.totalVariables}`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Exported at: ${stats.exportedAt}`);
    console.log(`   Output file: ${OUTPUT_FILE}\n`);

    // List exported collections
    if (Object.keys(organized.collections).length > 0) {
      console.log('📦 Exported collections:');
      Object.entries(organized.collections).forEach(([name, data]) => {
        console.log(`   • ${name} (${data.variables.length} variables)`);
      });
    }
    console.log('');

    return true;
  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }
}

function organizeVariables(variables, collections) {
  const result = {
    collections: {},
  };

  // Create collection map for easy lookup
  const collectionMap = {};
  if (collections) {
    collections.forEach(collection => {
      collectionMap[collection.id] = collection;
    });
  }

  // Organize variables by collection
  variables.forEach(variable => {
    const collectionId = variable.variableCollectionId;
    const collection = collectionMap[collectionId];
    const collectionName = collection ? collection.name : 'Unknown';

    if (!result.collections[collectionName]) {
      result.collections[collectionName] = {
        id: collectionId,
        variables: [],
      };
    }

    // Format variable with all mode values
    const varEntry = {
      id: variable.id,
      name: variable.name,
      type: variable.resolvedType,
      values: variable.valuesByMode || {},
    };

    // Add description if available
    if (variable.description) {
      varEntry.description = variable.description;
    }

    result.collections[collectionName].variables.push(varEntry);
  });

  // Sort variables within each collection by name
  Object.keys(result.collections).forEach(collectionName => {
    result.collections[collectionName].variables.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  });

  // Add metadata
  return {
    metadata: {
      fileKey: FILE_KEY,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Figma Variables Exporter (Local Only)',
      filterNote: 'Only local collections are exported; linked library collections are excluded',
    },
    ...result,
  };
}

exportVariables();
