export const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024 * 1024;

export const ALLOWED_FILE_MIME_REGEX =
  /^(image\/(jpeg|png|gif|webp|svg\+xml)|video\/(mp4|webm|ogg)|audio\/(mpeg|mp3|mp4|x-m4a|wav|x-wav|wave|vnd\.wave|ogg|webm)|text\/(plain|csv)|application\/(pdf|msword|x-cfb|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|zip|x-zip-compressed|octet-stream))$/i;

export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.mp4',
  '.webm',
  '.ogg',
  '.mp3',
  '.m4a',
  '.wav',
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

  'video/mp4',
  'video/webm',
  'video/ogg',

  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/ogg',
  'audio/ogg; codecs=opus',
  'audio/webm',

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
  'application/octet-stream',
];
