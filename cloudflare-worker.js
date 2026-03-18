// Cloudflare Worker — Contentful Management API Proxy
// Bu faylı Cloudflare Workers-ə deploy etməlisiniz.
// Environment variable olaraq CMA_TOKEN əlavə edin.

const SPACE_ID = 'q3fe87ca4p3k';
const ENVIRONMENT = 'master';
const CMA_BASE = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT}`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const token = env.CMA_TOKEN;

    // Debug endpoint - GET /test-token
    if (path === '/test-token') {
      try {
        const testRes = await fetch(`${CMA_BASE}/entries?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const testData = await testRes.json();
        return jsonResponse({
          tokenSet: !!token,
          tokenPrefix: token ? token.substring(0, 8) + '...' : 'not set',
          apiStatus: testRes.status,
          apiResponse: testData.message || `Found ${testData.total} entries`,
        });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // Return visitor IP address
    if (path === '/get-ip') {
      const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
      return jsonResponse({ ip });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Only POST allowed' }, 405);
    }

    try {
      if (path === '/upload-asset') {
        return await handleUploadAsset(request, token);
      } else if (path === '/create-entry') {
        return await handleCreateEntry(request, token);
      } else if (path === '/update-entry') {
        return await handleUpdateEntry(request, token);
      } else if (path === '/delete-entry') {
        return await handleDeleteEntry(request, token);
      } else {
        return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
};

// Upload image → create asset → process → publish → return asset ID
async function handleUploadAsset(request, token) {
  if (!token) {
    return jsonResponse({ error: 'CMA_TOKEN environment variable is not set' }, 500);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) {
    return jsonResponse({ error: 'No file provided in form data' }, 400);
  }
  const fileName = formData.get('fileName') || 'image.jpg';
  const contentType = file.type || 'image/jpeg';

  // Step 1: Upload file to Contentful
  const uploadRes = await fetch(`https://upload.contentful.com/spaces/${SPACE_ID}/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: file,
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.sys || !uploadData.sys.id) {
    return jsonResponse({ error: 'Upload failed', details: uploadData }, 400);
  }
  const uploadId = uploadData.sys.id;

  // Step 2: Create asset linked to upload
  const assetRes = await fetch(`${CMA_BASE}/assets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
    },
    body: JSON.stringify({
      fields: {
        title: { az: fileName },
        file: {
          az: {
            contentType: contentType,
            fileName: fileName,
            uploadFrom: {
              sys: { type: 'Link', linkType: 'Upload', id: uploadId }
            }
          }
        }
      }
    }),
  });
  const assetData = await assetRes.json();
  if (!assetData.sys || !assetData.sys.id) {
    return jsonResponse({ error: 'Asset creation failed', details: assetData }, 400);
  }
  const assetId = assetData.sys.id;

  // Step 3: Process the asset
  await fetch(`${CMA_BASE}/assets/${assetId}/files/az/process`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Contentful-Version': assetData.sys.version,
    },
  });

  // Step 4: Wait for processing, then publish
  let processed = false;
  let assetVersion = assetData.sys.version + 1;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const checkRes = await fetch(`${CMA_BASE}/assets/${assetId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const checkData = await checkRes.json();
    if (checkData.fields && checkData.fields.file && checkData.fields.file.az && checkData.fields.file.az.url) {
      assetVersion = checkData.sys.version;
      processed = true;
      break;
    }
  }

  if (!processed) {
    return jsonResponse({ error: 'Asset processing timeout' }, 500);
  }

  // Step 5: Publish asset
  await fetch(`${CMA_BASE}/assets/${assetId}/published`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Contentful-Version': assetVersion,
    },
  });

  return jsonResponse({ assetId });
}

// Create blog post entry → publish
async function handleCreateEntry(request, token) {
  if (!token) {
    return jsonResponse({ error: 'CMA_TOKEN environment variable is not set' }, 500);
  }

  const body = await request.json();
  const { title, date, content, assetId, titleRu, dateRu, contentRu } = body;

  const fields = {
    title: { az: title },
    date: { az: date },
    content: { az: content },
  };

  // Add Russian locale if provided
  if (titleRu) fields.title.ru = titleRu;
  if (dateRu) fields.date.ru = dateRu;
  if (contentRu) fields.content.ru = contentRu;

  if (assetId) {
    fields.image = {
      az: { sys: { type: 'Link', linkType: 'Asset', id: assetId } }
    };
  }

  // Step 1: Create entry
  const entryRes = await fetch(`${CMA_BASE}/entries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'X-Contentful-Content-Type': 'blogPost',
    },
    body: JSON.stringify({ fields }),
  });
  const entryData = await entryRes.json();

  // Check if create actually succeeded (error responses also have sys.id)
  if (entryData.message || !entryData.sys || entryData.sys.type === 'Error') {
    return jsonResponse({ error: 'Failed to create entry: ' + (entryData.message || JSON.stringify(entryData)) }, 400);
  }

  // Step 2: Publish entry
  const publishRes = await fetch(`${CMA_BASE}/entries/${entryData.sys.id}/published`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Contentful-Version': entryData.sys.version,
    },
  });
  const publishData = await publishRes.json();

  if (publishData.sys && publishData.sys.publishedVersion) {
    return jsonResponse({ entryId: entryData.sys.id });
  } else {
    const errMsg = publishData.message || publishData.details?.errors?.map(e => `${e.name}: ${e.details}`).join('; ') || JSON.stringify(publishData);
    return jsonResponse({ error: 'Publish failed: ' + errMsg, entryId: entryData.sys.id }, 400);
  }
}

// Update existing blog post entry → republish
async function handleUpdateEntry(request, token) {
  if (!token) {
    return jsonResponse({ error: 'CMA_TOKEN environment variable is not set' }, 500);
  }

  const body = await request.json();
  const { entryId, title, date, content, assetId, titleRu, dateRu, contentRu } = body;

  if (!entryId) {
    return jsonResponse({ error: 'entryId is required' }, 400);
  }

  // Step 1: Get current entry to find version
  const getRes = await fetch(`${CMA_BASE}/entries/${entryId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (getRes.status === 404) {
    return jsonResponse({ error: 'Entry not found' }, 404);
  }
  const currentEntry = await getRes.json();
  let version = currentEntry.sys.version;

  // Step 2: Unpublish if currently published
  if (currentEntry.sys.publishedVersion) {
    const unpubRes = await fetch(`${CMA_BASE}/entries/${entryId}/published`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Contentful-Version': version,
      },
    });
    if (unpubRes.ok) {
      const unpubData = await unpubRes.json();
      version = unpubData.sys.version;
    }
  }

  // Step 3: Build updated fields
  const fields = {
    title: { az: title },
    date: { az: date },
    content: { az: content },
  };

  if (titleRu) fields.title.ru = titleRu;
  if (dateRu) fields.date.ru = dateRu;
  if (contentRu) fields.content.ru = contentRu;

  if (assetId) {
    fields.image = {
      az: { sys: { type: 'Link', linkType: 'Asset', id: assetId } }
    };
  } else if (currentEntry.fields.image) {
    // Keep existing image if no new one provided
    fields.image = currentEntry.fields.image;
  }

  // Step 4: Update entry
  const updateRes = await fetch(`${CMA_BASE}/entries/${entryId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'X-Contentful-Version': version,
    },
    body: JSON.stringify({ fields }),
  });
  const updateData = await updateRes.json();

  if (updateData.message || !updateData.sys || updateData.sys.type === 'Error') {
    return jsonResponse({ error: 'Failed to update entry: ' + (updateData.message || JSON.stringify(updateData)) }, 400);
  }

  // Step 5: Republish
  const publishRes = await fetch(`${CMA_BASE}/entries/${updateData.sys.id}/published`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Contentful-Version': updateData.sys.version,
    },
  });
  const publishData = await publishRes.json();

  if (publishData.sys && publishData.sys.publishedVersion) {
    return jsonResponse({ entryId: updateData.sys.id });
  } else {
    const errMsg = publishData.message || publishData.details?.errors?.map(e => `${e.name}: ${e.details}`).join('; ') || JSON.stringify(publishData);
    return jsonResponse({ error: 'Publish failed: ' + errMsg, entryId: updateData.sys.id }, 400);
  }
}

// Unpublish → delete entry (and its linked asset if any)
async function handleDeleteEntry(request, token) {
  if (!token) {
    return jsonResponse({ error: 'CMA_TOKEN environment variable is not set' }, 500);
  }

  const body = await request.json();
  const { entryId } = body;
  if (!entryId) {
    return jsonResponse({ error: 'entryId is required' }, 400);
  }

  // Get entry to find version and linked asset
  const getRes = await fetch(`${CMA_BASE}/entries/${entryId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (getRes.status === 404) {
    return jsonResponse({ error: 'Entry not found' }, 404);
  }
  const entryData = await getRes.json();
  let version = entryData.sys.version;

  // Find linked asset ID (if image exists)
  let linkedAssetId = null;
  if (entryData.fields && entryData.fields.image) {
    const imgField = entryData.fields.image.az || entryData.fields.image['en-US'];
    if (imgField && imgField.sys) {
      linkedAssetId = imgField.sys.id;
    }
  }

  // Unpublish entry first (if published)
  if (entryData.sys.publishedVersion) {
    const unpubRes = await fetch(`${CMA_BASE}/entries/${entryId}/published`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Contentful-Version': version,
      },
    });
    if (unpubRes.ok) {
      const unpubData = await unpubRes.json();
      version = unpubData.sys.version;
    }
  }

  // Delete entry
  const delRes = await fetch(`${CMA_BASE}/entries/${entryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Contentful-Version': version,
    },
  });
  if (!delRes.ok && delRes.status !== 204) {
    const errData = await delRes.json().catch(() => ({}));
    return jsonResponse({ error: 'Failed to delete entry: ' + (errData.message || delRes.status) }, 400);
  }

  // Also delete linked asset if exists
  if (linkedAssetId) {
    try {
      const assetRes = await fetch(`${CMA_BASE}/assets/${linkedAssetId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (assetRes.ok) {
        const assetData = await assetRes.json();
        let assetVersion = assetData.sys.version;
        // Unpublish asset
        if (assetData.sys.publishedVersion) {
          const unpubAsset = await fetch(`${CMA_BASE}/assets/${linkedAssetId}/published`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Contentful-Version': assetVersion,
            },
          });
          if (unpubAsset.ok) {
            const unpubData = await unpubAsset.json();
            assetVersion = unpubData.sys.version;
          }
        }
        // Delete asset
        await fetch(`${CMA_BASE}/assets/${linkedAssetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Contentful-Version': assetVersion,
          },
        });
      }
    } catch (e) {
      // Asset deletion is best-effort
    }
  }

  return jsonResponse({ success: true });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
