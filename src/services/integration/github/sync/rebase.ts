import diff3Merge from 'diff3';
import { filterMap, keyByMap } from '@/utils/mapUtils';
import { gitBlobHash } from '@/utils/gitBlobHash';
import type { InjectResult } from '@/utils/injector';
import { FileIndexModel, type File } from '@/services/model/FileIndexModel';
import { BlobModel } from '@/services/model/BlobModel';
import { RepositoryModel } from '@/services/model/RepositoryModel';

/* eslint-disable max-len */

/*
# Rebase logic

## Legend

- Undefined: -
- Added:     a+
- Removed:   a-
- Renamed:   a~b (a was renamed to b)
- Ensure path is available: E(a)
  - If path 'a' is occupied, new path becomes 'a-2'.
  - If path 'a-2' is occupied, new path becomes 'a-3'.
- Marked conflicting: C

## Rebase logic excl. local additions

|------|------|--------|--------|-------|-------|----------|----------|-----------|-----------|
| BASE | BASE | REMOTE | REMOTE | LOCAL | LOCAL | NEW_BASE | NEW_BASE |  REBASED  |  REBASED  |
| PATH | BLOB |  PATH  |  BLOB  | PATH  | BLOB  |   PATH   |   BLOB   |   PATH    |   BLOB    |
|======|======|========|========|=======|=======|==========|==========|===========|===========|
| -    | -    | a+     | 1      | -     | -     | a        | 1        | a         | 1         |
|------|------|--------|--------|-------|-------|----------|----------|-----------|-----------|
| a    | 1    | a-     | 1      | a     | 1     | -        | -        | -         | -         |
| a    | 1    | a-     | 1      | a-    | 1     | -        | -        | -         | -         |
| a    | 1    | a-     | 1      | a*    | 2     | -        | -        | a+        | 2         | Conflict: The file was deleted remotely but it also changed locally.
| a    | 1    | a-     | 1      | a~b   | 1     | -        | -        | -         | -         |
| a    | 1    | a-     | 1      | a~b-  | 1     | -        | -        | -         | -         |
| a    | 1    | a-     | 1      | a~b*  | 2     | -        | -        | E(b)+     | 2         | Conflict: The file was deleted remotely but it also changed locally. Also conflict if: The file was renamed because it's path became occupied.
|------|------|--------|--------|-------|-------|----------|----------|-----------|-----------|
| a    | 1    | a*     | 2      | a     | 1     | a        | 2        | a         | 2         |
| a    | 1    | a*     | 2      | a-    | 1     | a        | 2        | aC        | 2         | Conflict: The file was deleted locally but it also changed remotely.
| a    | 1    | a*     | 2      | a*    | 3     | a        | 2        | a*C       | M(1, 2, 3)| Modified if the contents changed. Conflict if: The file contents conflict.
| a    | 1    | a*     | 2      | a~b   | 1     | a        | 2        | a~E(b)C   | 2         | Conflict if: The file was renamed because it's path became occupied.
| a    | 1    | a*     | 2      | a~b-  | 1     | a        | 2        | a~E(b)C   | 2         | Conflict: The file was deleted locally but it also changed remotely. Conflict if: The file was renamed because it's path became occupied.
| a    | 1    | a*     | 2      | a~b*  | 3     | a        | 2        | a~E(b)*C  | M(1, 2, 3)| Modified if the contents changed. Conflict if: The file contents conflict. Also conflict if: The file was renamed because it's path became occupied.
|------|------|--------|--------|-------|-------|----------|----------|-----------|-----------|
| a    | 1    | a~b    | 1      | a     | 1     | b        | 1        | b         | 1         |
| a    | 1    | a~b    | 1      | a-    | 1     | b        | 1        | b-        | 1         |
| a    | 1    | a~b    | 1      | a*    | 2     | b        | 1        | b*        | 2         |
| a    | 1    | a~b    | 1      | a~b   | 1     | b        | 1        | b         | 1         |
| a    | 1    | a~b    | 1      | a~b-  | 1     | b        | 1        | b-        | 1         |
| a    | 1    | a~b    | 1      | a~b*  | 2     | b        | 1        | b*        | 2         |
| a    | 1    | a~b    | 1      | a~c   | 1     | b        | 1        | b~E(c)C   | 1         | Conflict if: The file was renamed because it's path became occupied.
| a    | 1    | a~b    | 1      | a~c-  | 1     | b        | 1        | b~E(c)-   | 1         |
| a    | 1    | a~b    | 1      | a~c*  | 2     | b        | 1        | b~E(c)*C  | 2         | Conflict if: The file was renamed because it's path became occupied.
|------|------|--------|--------|-------|-------|----------|----------|-----------|-----------|
| a    | 1    | a~b*   | 2      | a     | 1     | b        | 2        | b         | 2         |
| a    | 1    | a~b*   | 2      | a-    | 1     | b        | 2        | bC        | 2         | Conflict: The file was deleted locally but it also changed remotely.
| a    | 1    | a~b*   | 2      | a*    | 3     | b        | 2        | b*C       | M(1, 2, 3)| Modified if the contents changed. Conflict if: The file contents conflict.
| a    | 1    | a~b*   | 2      | a~b   | 1     | b        | 2        | b         | 2         |
| a    | 1    | a~b*   | 2      | a~b-  | 1     | b        | 2        | bC        | 2         | Conflict: The file was deleted locally but it also changed remotely.
| a    | 1    | a~b*   | 2      | a~b*  | 3     | b        | 2        | b*C       | M(1, 2, 3)| Modified if the contents changed. Conflict if: The file contents conflict.
| a    | 1    | a~b*   | 2      | a~c   | 1     | b        | 2        | b~E(c)C   | 2         | Conflict if: The file was renamed because it's path became occupied.
| a    | 1    | a~b*   | 2      | a~c-  | 1     | b        | 2        | b~E(c)C   | 2         | Conflict: The file was deleted locally but it also changed remotely. Conflict if: The file was renamed because it's path became occupied.
| a    | 1    | a~b*   | 2      | a~c*  | 3     | b        | 2        | b~E(c)*C  | M(1, 2, 3)| Modified if the contents changed. Conflict if: The file contents conflict. Also conflict if: The file was renamed because it's path became occupied.
|------|------|--------|--------|-------|-------|----------|----------|-----------|-----------|
| a    | 1    | a      | 1      | a     | 1     | a        | 1        | a         | 1         |
| a    | 1    | a      | 1      | a-    | 1     | a        | 1        | a-        | 1         |
| a    | 1    | a      | 1      | a*    | 2     | a        | 1        | a*        | 2         |
| a    | 1    | a      | 1      | a~b   | 1     | a        | 1        | a~E(b)C   | 1         | Conflict if: The file was renamed because it's path became occupied.
| a    | 1    | a      | 1      | a~b-  | 1     | a        | 1        | a~E(b)-   | 1         |
| a    | 1    | a      | 1      | a~b*  | 2     | a        | 1        | a~E(b)*C  | 2         | Conflict if: The file was renamed because it's path became occupied.
|------|------|--------|--------|-------|-------|----------|----------|-----------|-----------|

## Rebase logic of local additions

|--------|--------|-----------|-----------|
| LOCAL  | LOCAL  | REBASED   | REBASED   |
| PATH   | BLOB   | PATH      | BLOB      |
|========|========|===========|===========|
| a+     | 1+     | E(a)+C    | 1         | Conflict if: The file was renamed because it's path became occupied.
|--------|--------|-----------|-----------|

*/

/* eslint-enable max-len */

const dependencies = [FileIndexModel, BlobModel, RepositoryModel];
useRebase.dependencies = dependencies;

const LINEBREAKS = /^.*(\r?\n|$)/gm;

export function useRebase({
  fileIndexModel,
  blobModel,
  repositoryModel
}: InjectResult<typeof dependencies>) {

  /**
   * Rebases the **local** changes on top of the **remote** fileIndex.
   * Creates a **rebase** fileIndex.
   */
  return async function rebase(repositoryId: string) {
    const remoteIndex = await fileIndexModel.getFileIndex(repositoryId, 'remote');
    if (!remoteIndex) {
      throw new Error(`Missing fileIndex: "${repositoryId}/remote"`);
    }
    const localIndex = await fileIndexModel.getFileIndex(repositoryId, 'local');
    if (!localIndex) {
      throw new Error(`Missing fileIndex: "${repositoryId}/local"`);
    }
    const existingRebaseIndex = await fileIndexModel.getFileIndex(repositoryId, 'rebase');
    if (existingRebaseIndex) {
      throw new Error(`Rebase fileIndex should not exist for repository "${repositoryId}"`);
    }

    const remoteFiles = filterMap(remoteIndex.index, (node): node is File => {
      return node.type === 'file';
    });
    const localChangedFiles = filterMap(localIndex.index, (node): node is File => {
      return node.type === 'file' && (node.deleted || node.modified || node.renamed);
    });
    const localChangedFilesByPathInBase = keyByMap(localChangedFiles.values(), (file) => {
      return file.pathInBase;
    });
    const rebasedFiles: Map<string, File> = new Map();

    // Merge files except for local additions
    for (const remoteFile of remoteFiles.values()) {
      const localChangedFile = remoteFile.pathInBase
        ? localChangedFilesByPathInBase.get(remoteFile.pathInBase)
        : undefined;
      let rebasedFile: File | undefined;

      if (remoteFile.added || remoteFile.ignored) {
        //
        // ======== REMOTE ADDED/IGNORED ========
        //
        rebasedFile = fileIndexModel.createFile({
          path: remoteFile.path,
          pathInBase: remoteFile.path,
          blobId: remoteFile.blobId,
          blobHash: remoteFile.blobHash,
          blobIdInBase: remoteFile.blobId,
          ignored: remoteFile.ignored
        });
      } else if (remoteFile.deleted) {
        //
        // ======== REMOTE DELETED ========
        //
        if (!localChangedFile || localChangedFile.deleted
          || (localChangedFile.renamed && !localChangedFile.modified)
        ) {
          rebasedFile = undefined;
        } else if (!localChangedFile.renamed && localChangedFile.modified) {
          // Restore remotely deleted file because it changed locally.
          rebasedFile = fileIndexModel.createFile({
            path: localChangedFile.path,
            pathInBase: undefined,
            blobId: localChangedFile.blobId,
            blobHash: localChangedFile.blobHash,
            blobIdInBase: undefined,
            conflicting: true,
            conflictReason: 'The file was deleted remotely but it also changed locally.'
            // added: true
          });
        } else if (localChangedFile.renamed && localChangedFile.modified) {
          // Restore remotely deleted file because it changed locally.
          const pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: undefined,
            blobId: localChangedFile.blobId,
            blobHash: localChangedFile.blobHash,
            blobIdInBase: undefined,
            conflicting: true,
            conflictReason: 'The file was deleted remotely but it also changed locally.'
              + (pathResult.conflicting
                ? ' The file was also renamed because it\'s path became occupied.'
                : '')
            // added: true
          });
        }
      } else if (!remoteFile.renamed && remoteFile.modified) {
        //
        // ======== REMOTE MODIFIED ========
        //
        if (!localChangedFile) {
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId
          });
        } else if (!localChangedFile.renamed && localChangedFile.deleted) {
          // Restore locally deleted file, because it changed remotely.
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: true,
            conflictReason: 'The file was deleted locally but it also changed remotely.'
          });
        } else if (!localChangedFile.renamed && localChangedFile.modified) {
          const mergeResult = await mergeBlobs(
            // The diffing wouldn't have found the remote modification if blobIdInBase didn't exist.
            remoteFile.blobIdInBase!,
            remoteFile.blobId,
            localChangedFile.blobId,
            remoteIndex.commitSha!
          );
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: mergeResult.blobId,
            blobHash: mergeResult.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: mergeResult.conflicting,
            conflictReason: mergeResult.conflicting
              ? 'Automatic merging failed.'
              : undefined
            // modified: mergeResult.modified
          });
        } else if (localChangedFile.renamed && !localChangedFile.modified
          && !localChangedFile.deleted
        ) {
          const pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: pathResult.conflicting,
            conflictReason: pathResult.conflicting
              ? 'The file was renamed because it\'s path became occupied.'
              : undefined
            // renamed: true
          });
        } else if (localChangedFile.renamed && localChangedFile.deleted) {
          // Restore locally deleted file, because it changed remotely.
          const pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: true,
            conflictReason: 'The file was deleted locally but it also changed remotely.'
              + (pathResult.conflicting
                ? ' The file was also renamed because it\'s path became occupied.'
                : '')
            // renamed: true
          });
        } else if (localChangedFile.renamed && localChangedFile.modified) {
          const pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          const mergeResult = await mergeBlobs(
            // The diffing wouldn't have found the remote modification if blobIdInBase didn't exist
            remoteFile.blobIdInBase!,
            remoteFile.blobId,
            localChangedFile.blobId,
            remoteIndex.commitSha!
          );
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: mergeResult.blobId,
            blobHash: mergeResult.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: pathResult.conflicting || mergeResult.conflicting,
            conflictReason: [
              pathResult.conflicting
                && 'The file was renamed because it\'s path became occupied.',
              mergeResult.conflicting
                && 'Automatic merging failed.'
            ].filter((str) => !!str).join(' ') || undefined
            // modified: mergeResult.blobId !== remoteFile.blobId
          });
        }
      } else if (remoteFile.renamed && !remoteFile.modified) {
        //
        // ======== REMOTE RENAMED ========
        //
        if (!localChangedFile) {
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId
          });
        } else if (!localChangedFile.renamed && localChangedFile.deleted) {
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            deleted: true
          });
        } else if (!localChangedFile.renamed && localChangedFile.modified) {
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: localChangedFile.blobId,
            blobHash: localChangedFile.blobHash,
            blobIdInBase: remoteFile.blobId
            // modified: true
          });
        } else if (localChangedFile.renamed && !localChangedFile.modified
          && !localChangedFile.deleted
        ) {
          let pathResult;
          if (remoteFile.path === localChangedFile.path) {
            pathResult = {
              path: remoteFile.path,
              conflicting: false
            };
          } else {
            pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          }
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: pathResult.conflicting,
            conflictReason: pathResult.conflicting
              ? 'The file was renamed because it\'s path became occupied.'
              : undefined
            // renamed: true
          });
        } else if (localChangedFile.renamed && localChangedFile.deleted) {
          let pathResult;
          if (remoteFile.path === localChangedFile.path) {
            pathResult = {
              path: remoteFile.path,
              conflicting: false
            };
          } else {
            pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          }
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            deleted: true
            // renamed: true
            // conflict does not matter, because we're deleting and contents did not change
          });
        } else if (localChangedFile.renamed && localChangedFile.modified) {
          let pathResult;
          if (remoteFile.path === localChangedFile.path) {
            pathResult = {
              path: remoteFile.path,
              conflicting: false
            };
          } else {
            pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          }
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: localChangedFile.blobId,
            blobHash: localChangedFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: pathResult.conflicting,
            conflictReason: pathResult.conflicting
              ? 'The file was renamed because it\'s path became occupied.'
              : undefined
            // modified: true
            // renamed: pathResult.path !== remoteFile.path
          });
        }
      } else if (remoteFile.renamed && remoteFile.modified) {
        //
        // ======== REMOTE RENAMED & MODIFIED ========
        //
        if (!localChangedFile) {
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId
          });
        } else if (!localChangedFile.renamed && localChangedFile.deleted) {
          // Restore locally deleted file, because it changed remotely.
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: true,
            conflictReason: 'The file was deleted locally but it also changed remotely.'
          });
        } else if (!localChangedFile.renamed && localChangedFile.modified) {
          const mergeResult = await mergeBlobs(
            // The diffing wouldn't have found the remote modification if blobIdInBase didn't exist.
            remoteFile.blobIdInBase!,
            remoteFile.blobId,
            localChangedFile.blobId,
            remoteIndex.commitSha!
          );
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: mergeResult.blobId,
            blobHash: mergeResult.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: mergeResult.conflicting,
            conflictReason: mergeResult.conflicting
              ? 'Automatic merging failed.'
              : undefined
            // modified: mergeResult.blobId !== remoteFile.blobId
          });
        } else if (localChangedFile.renamed && !localChangedFile.modified
          && !localChangedFile.deleted
        ) {
          if (remoteFile.path === localChangedFile.path) {
            rebasedFile = fileIndexModel.createFile({
              path: remoteFile.path,
              pathInBase: remoteFile.path,
              blobId: remoteFile.blobId,
              blobHash: remoteFile.blobHash,
              blobIdInBase: remoteFile.blobId
            });
          } else {
            const pathResult = ensureAvailablePath(localChangedFile.path,remoteFiles,
              rebasedFiles);
            rebasedFile = fileIndexModel.createFile({
              path: pathResult.path,
              pathInBase: remoteFile.path,
              blobId: remoteFile.blobId,
              blobHash: remoteFile.blobHash,
              blobIdInBase: remoteFile.blobId,
              conflicting: pathResult.conflicting,
              conflictReason: pathResult.conflicting
                ? 'The file was renamed because it\'s path became occupied.'
                : undefined
              // renamed: true
            });
          }
        } else if (localChangedFile.renamed && localChangedFile.deleted) {
          if (remoteFile.path === localChangedFile.path) {
            rebasedFile = fileIndexModel.createFile({
              path: remoteFile.path,
              pathInBase: remoteFile.path,
              blobId: remoteFile.blobId,
              blobHash: remoteFile.blobHash,
              blobIdInBase: remoteFile.blobId,
              conflicting: true,
              conflictReason: 'The file was deleted locally but it also changed remotely.'
            });
          } else {
            const pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles,
              rebasedFiles);
            rebasedFile = fileIndexModel.createFile({
              path: pathResult.path,
              pathInBase: remoteFile.path,
              blobId: remoteFile.blobId,
              blobHash: remoteFile.blobHash,
              blobIdInBase: remoteFile.blobId,
              conflicting:true,
              conflictReason: 'The file was deleted locally but it also changed remotely.'
                + (pathResult.conflicting
                  ? ' The file was also renamed because it\'s path became occupied.'
                  : '')
              // renamed: true
            });
          }
        } else if (localChangedFile.renamed && localChangedFile.modified) {
          let pathResult;
          if (remoteFile.path === localChangedFile.path) {
            pathResult = {
              path: remoteFile.path,
              conflicting: false
            };
          } else {
            pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          }
          const mergeResult = await mergeBlobs(
            // The diffing wouldn't have found the remote modification if blobIdInBase didn't exist
            remoteFile.blobIdInBase!,
            remoteFile.blobId,
            localChangedFile.blobId,
            remoteIndex.commitSha!
          );
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: mergeResult.blobId,
            blobHash: mergeResult.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: pathResult.conflicting || mergeResult.conflicting,
            conflictReason: [
              pathResult.conflicting
                && 'The file was renamed because it\'s path became occupied.',
              mergeResult.conflicting
                && 'Automatic merging failed.'
            ].filter((str) => !!str).join(' ') || undefined
            // modified: mergeResult.blobId !== remoteFile.blobId
            // renamed: pathResult.path !== remoteFile.path
          });
        }
      } else {
        //
        // ======== REMOTE NOT CHANGED ========
        //
        if (!localChangedFile) {
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId
          });
        } else if (!localChangedFile.renamed && localChangedFile.deleted) {
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            deleted: true
          });
        } else if (!localChangedFile.renamed && localChangedFile.modified) {
          rebasedFile = fileIndexModel.createFile({
            path: remoteFile.path,
            pathInBase: remoteFile.path,
            blobId: localChangedFile.blobId,
            blobHash: localChangedFile.blobHash,
            blobIdInBase: remoteFile.blobId
            // modified: true
          });
        } else if (localChangedFile.renamed && !localChangedFile.modified
          && !localChangedFile.deleted
        ) {
          const pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: pathResult.conflicting,
            conflictReason: pathResult.conflicting
              ? 'The file was renamed because it\'s path became occupied.'
              : undefined
            // renamed: true
          });
        } else if (localChangedFile.renamed && localChangedFile.deleted) {
          const pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: remoteFile.blobId,
            blobHash: remoteFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            deleted: true
            // renamed: true
            // conflict does not matter, because we're deleting and contents did not change
          });
        } else if (localChangedFile.renamed && localChangedFile.modified) {
          const pathResult = ensureAvailablePath(localChangedFile.path, remoteFiles, rebasedFiles);
          rebasedFile = fileIndexModel.createFile({
            path: pathResult.path,
            pathInBase: remoteFile.path,
            blobId: localChangedFile.blobId,
            blobHash: localChangedFile.blobHash,
            blobIdInBase: remoteFile.blobId,
            conflicting: pathResult.conflicting,
            conflictReason: pathResult.conflicting
              ? 'The file was renamed because it\'s path became occupied.'
              : undefined
            // modified: true
            // renamed: true
          });
          rebasedFile.path = pathResult.path;
          rebasedFile.pathInBase = remoteFile.path;
          rebasedFile.blobId = localChangedFile.blobId;
          rebasedFile.blobHash = localChangedFile.blobHash;
          rebasedFile.modified = true;
          if (pathResult.conflicting) {
            rebasedFile.conflicting = true;
            rebasedFile.conflictReason
              = 'The file was renamed because it\'s path became occupied.';
          }
        }
      }

      if (rebasedFile !== undefined) {
        rebasedFiles.set(rebasedFile.path, rebasedFile);
      }
    }

    // Handle locally added files
    const localAddedFiles = filterMap(localIndex.index, (node): node is File => {
      return node.type === 'file' && node.added;
    });
    for (const localAddedFile of localAddedFiles.values()) {
      const pathResult = ensureAvailablePath(localAddedFile.path, new Map(), rebasedFiles);
      const rebasedFile = fileIndexModel.createFile({
        path: pathResult.path,
        blobId: localAddedFile.blobId,
        blobHash: localAddedFile.blobHash,
        conflicting: pathResult.conflicting,
        conflictReason: pathResult.conflicting
          ? 'The file was renamed because it\'s path became occupied.'
          : undefined
        // added: true
      });
      rebasedFiles.set(rebasedFile.path, rebasedFile);
    }

    // Assemble the rebase fileIndex
    const rebaseIndex = fileIndexModel.createFileIndex({
      repositoryId,
      indexId: 'rebase'
    });
    for (const file of rebasedFiles.values()) {
      fileIndexModel.putFileInIndex(rebaseIndex, file);
    }
    await fileIndexModel.addFileIndex(rebaseIndex);

    // Add manual rebasing state to repository if there are conflicts
    if (fileIndexModel.getRootTreeNode(rebaseIndex).fileStats.conflicting > 0) {
      await repositoryModel.update(repositoryId, (repository) => {
        repository.manualRebaseInProgress = true;
        return repository;
      });
    }
  };

  function ensureAvailablePath(
    path: string,
    remoteFiles: Map<string, File>,
    rebasedFiles: Map<string, File>
  ) {
    let resultPath = path;
    let pathOccupied = remoteFiles.has(resultPath) || rebasedFiles.has(resultPath);
    while (pathOccupied) {
      const match = resultPath.match(/(-\d+)?(\.[^.]+)?$/);
      if (!match) throw new Error('Suffix matching must always work.');
      const [fullSuffix, numberPart, extensionPart] = match;
      const basePart = resultPath.slice(0, -fullSuffix.length);
      const parsedNumber = numberPart ? Number(numberPart.slice(1)) : undefined;
      const newNumberPart = Number.isNaN(parsedNumber) || parsedNumber === undefined
        ? '-2'
        : `-${parsedNumber + 1}`;
      resultPath = `${basePart}${newNumberPart}${extensionPart || ''}`;
      pathOccupied = remoteFiles.has(resultPath) || rebasedFiles.has(resultPath);
    }
    return {
      path: resultPath,
      conflicting: path !== resultPath
    };
  }

  async function mergeBlobs(
    baseBlobId: string,
    remoteBlobId: string,
    localBlobId: string,
    remoteCommitSha: string
  ) {
    const baseBlob = await blobModel.get(baseBlobId);
    if (baseBlob === undefined) {
      throw new Error('Missing base blob');
    }
    const remoteBlob = await blobModel.get(remoteBlobId);
    if (remoteBlob === undefined) {
      throw new Error('Missing remote blob');
    }
    const localBlob = await blobModel.get(localBlobId);
    if (localBlob === undefined) {
      throw new Error('Missing local blob');
    }
    const mergeResult = diff3Merge(
      ensureNewlineEnding(localBlob).match(LINEBREAKS)!,
      ensureNewlineEnding(baseBlob).match(LINEBREAKS)!,
      ensureNewlineEnding(remoteBlob).match(LINEBREAKS)!
    );

    let mergedText = '';
    let conflicting = false;

    for (const item of mergeResult) {
      if (item.ok) {
        mergedText += item.ok.join('');
      }
      if (item.conflict) {
        conflicting = true;
        mergedText += `${'<'.repeat(7)} Local changes\n`;
        mergedText += item.conflict.a.join('');

        if (item.conflict.o.length > 0) {
          mergedText += `${'|'.repeat(7)} Base\n`;
          mergedText += item.conflict.o.join('');
        }

        mergedText += `${'='.repeat(7)}\n`;
        mergedText += item.conflict.b.join('');
        mergedText += `${'>'.repeat(7)} Remote changes (${remoteCommitSha.slice(0, 7)})\n`;
      }
    }

    const mergedBlobHash = await gitBlobHash(mergedText);
    const modified = mergedBlobHash !== remoteBlobId;
    let mergedBlobId = remoteBlobId;
    if (modified) {
      mergedBlobId = Math.random().toString().slice(2);
      await blobModel.put(mergedBlobId, mergedText);
    }
    return {
      blobId: mergedBlobId,
      blobHash: mergedBlobHash,
      conflicting
    };
  }

  function ensureNewlineEnding(str: string) {
    return str.endsWith('\n') ? str : str + '\n';
  }
}
