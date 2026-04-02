-- One-time migration: Move image upload configuration from existing tenant to platform config
-- This should only run once to migrate from tenant-specific to platform-wide configuration

-- Move ImgBB API Key if it exists
INSERT INTO "platform_config" ("id", "key", "value", "description", "isEncrypted", "updatedAt", "updatedBy")
SELECT 
  gen_random_uuid(),
  'imgbb_api_key',
  ss.value,
  'ImgBB API key for image uploads',
  true,
  NOW(),
  NULL
FROM "system_settings" ss
WHERE ss.key = 'imgbb_api_key' 
  AND ss.value IS NOT NULL 
  AND ss.value != ''
ON CONFLICT ("key") DO NOTHING;

-- Move image upload service setting if it exists
INSERT INTO "platform_config" ("id", "key", "value", "description", "isEncrypted", "updatedAt", "updatedBy")
SELECT 
  gen_random_uuid(),
  'image_upload_service',
  ss.value,
  'Platform image upload service',
  false,
  NOW(),
  NULL
FROM "system_settings" ss
WHERE ss.key = 'image_upload_service' 
  AND ss.value IS NOT NULL 
  AND ss.value != ''
ON CONFLICT ("key") DO NOTHING;

-- Move Cloudinary config if it exists
INSERT INTO "platform_config" ("id", "key", "value", "description", "isEncrypted", "updatedAt", "updatedBy")
SELECT 
  gen_random_uuid(),
  'cloudinary_config',
  ss.value,
  'Cloudinary configuration for image uploads',
  true,
  NOW(),
  NULL
FROM "system_settings" ss
WHERE ss.key = 'cloudinary_config' 
  AND ss.value IS NOT NULL 
  AND ss.value != ''
ON CONFLICT ("key") DO NOTHING;

-- Note: We're not deleting the tenant settings yet to allow for verification
-- After confirming the migration worked successfully, you can run:
-- DELETE FROM "system_settings" WHERE key IN ('imgbb_api_key', 'image_upload_service', 'cloudinary_config');
