export const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_FILE_MIME_REGEX =
  /^(image\/(jpeg|png|gif|webp|svg\+xml)|text\/(plain|csv)|application\/(pdf|msword|x-cfb|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|zip|x-zip-compressed|octet-stream))$/i;

export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',

  '.txt',
  '.csv',

  '.pdf',

  '.doc',
  '.docx',

  '.xls',
  '.xlsx',

  '.ppt',
  '.pptx',

  '.zip',

  '.fig',
];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',

  'text/plain',
  'text/csv',

  'application/pdf',

  'application/msword',
  'application/x-cfb',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  'application/zip',
  'application/x-zip-compressed',

  // Figma .fig thường có thể bị gửi là application/octet-stream
  'application/octet-stream',
];
