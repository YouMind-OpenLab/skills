#!/usr/bin/env node
/**
 * Extract image URLs from YouMind listMessages API response (stdin).
 * Outputs JSON with image URLs and metadata.
 */
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const response = JSON.parse(data);
    const items = Array.isArray(response) ? response : (response.items || response.messages || []);

    let imageUrls = [];
    let errors = [];

    for (const msg of items) {
      for (const block of (msg.blocks || [])) {
        if (block.toolName === 'image_generate') {
          if (block.status === 'success' && block.toolResult && block.toolResult.image_urls) {
            imageUrls.push(...block.toolResult.image_urls);
          } else if (block.status === 'errored') {
            errors.push(block.toolResult?.message || block.extra?.error?.message || 'Image generation failed');
          }
        }
      }
    }

    // Fallback: check assistant message content for image URLs
    if (imageUrls.length === 0) {
      for (const msg of items) {
        if (msg.role === 'assistant' || (msg['$class'] || '').includes('Assistant')) {
          const content = msg.content || '';
          const matches = content.match(/https?:\/\/[^\s)"]+\.(?:png|jpg|jpeg|webp|gif)[^\s)"]*/gi) || [];
          imageUrls.push(...matches);
        }
      }
    }

    imageUrls = [...new Set(imageUrls)];

    if (imageUrls.length > 0) {
      console.log(JSON.stringify({ success: true, imageUrls, count: imageUrls.length }));
    } else if (errors.length > 0) {
      console.log(JSON.stringify({ success: false, errors }));
    } else {
      console.log(JSON.stringify({ success: false, errors: ['No images found in response'] }));
    }
  } catch (e) {
    console.log(JSON.stringify({ success: false, errors: ['Failed to parse response: ' + e.message] }));
  }
});
