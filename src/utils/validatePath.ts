/**
 * Validates a path for use in a git repository.
 */
export function validatePath(path: string) {
  if (!path) return 'Path cannot be empty.';
  if (path.endsWith('/')) return 'Path must not end with a slash';
  if (path.startsWith('/')) return 'Path must not start with a slash';
  if (!path.endsWith('.md')) {
    path += '.md';
  }

  // http://www.mtu.edu/umc/services/digital/writing/characters-avoid/
  // https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
  const restricted = /[\\[\]#%&{}<>*?\s\b\0$!':@|‘`“”"+^,]/;
  const doubleSlash = /\/\//;
  const parent = /\.\./;
  const currentDir = /^\.\/|\/\.\//;
  if (path.match(restricted)) {
    return 'Path contains invalid characters';
  }
  if (path.match(doubleSlash)) {
    return 'Path should not contain double slashes';
  }
  if (path.match(parent)) {
    return 'Path should not contain parent directory references';
  }
  if (path.match(currentDir)) {
    return 'Path should not contain current directory references';
  }

  // Check file/folder name lengths
  //
  // Max file/folder name length on various systems:
  // - Windows: 255 characters encoded in UTF-16
  // - macOS: 255 UTF-8 bytes
  // - Linux: 255 bytes encoded in UTF-8
  // - Git: 255 bytes encoded in UTF-8
  const parts = path.split('/');
  const encoder = new TextEncoder();
  for (const part of parts) {
    const partLengthInBytes = encoder.encode(part).length;
    if (partLengthInBytes > 255) {
      return 'Path contains a file or folder name that is too long';
    }
  }

  // Check path length
  //
  // Maximum file path length in various systems:
  // - Windows: 260 characters encoded in UTF-16, 32767 characters if long paths are enabled
  // - macOS: 1024 UTF-8 bytes
  // - Linux: 4096 bytes encoded in UTF-8
  // - Git: 4096 bytes encoded in UTF-8
  //
  // Our limit should be half the allowed amount on the most restrictive system.
  // The other half is reserved for the git repository path.
  // Windows users should enable long paths if they want to use longer paths in their repos.
  // So we'll use macOS's limit of 1024 bytes halved to 512 bytes.
  const pathLengthInBytes = encoder.encode(path).length;
  if (pathLengthInBytes > 512) {
    return 'Path is too long';
  }
}
