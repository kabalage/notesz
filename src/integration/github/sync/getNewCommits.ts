import { request as octokitRequest } from '@octokit/request';
import userModel from '@/model/userModel';
import fileIndexModel from '@/model/fileIndexModel';
import NoteszError from '@/utils/NoteszError';
import trial from '@/utils/trial';

/**
 * Determines the new commits that need to be fetched from GitHub.
 *
 * - If the repository has no commits yet, it returns an empty array.
 * - If the repository is not initialized on the client, only the latest commit is returned.
 * - If the commit referenced in base is missing, only the latest commit is returned.
 */
export default async function getNewCommits(repositoryId: string) {
  const user = await userModel.get();
  if (!user) {
    throw new NoteszError('Unauthorized user', {
      code: 'unauthorized'
    });
  }
  const authHeader = `Bearer ${user.token}`;
  const commonRequestParams = {
    headers: {
      authorization: authHeader
    },
    owner: repositoryId.split('/')[0],
    repo: repositoryId.split('/')[1]
  };
  const baseFileIndex = await fileIndexModel.getFileIndex(repositoryId, 'base');
  if (!baseFileIndex) {
    throw new Error('Base fileIndex not found');
  }

  let commits: Awaited<ReturnType<typeof getCommitsPage>> = [];
  if (baseFileIndex.commitSha && baseFileIndex.commitTime) {
    let page = 0;
    let commitsPage;
    do {
      page++;
      commitsPage = await getCommitsPage(page, 10, baseFileIndex.commitTime);
      commits.push(...commitsPage);
    } while(commitsPage.length === 10);
    if (commits.length === 0) {
      // No new commits in repository
      return [];
    }
    commits.reverse();
    const currentCommitIndex = commits.findIndex((commit) => {
      return commit.sha === baseFileIndex.commitSha;
    });
    if (currentCommitIndex === -1) {
      // We cannot process changes commit by commit, so we use just the latest commit.
      commits = [commits.at(-1)!];
    } else {
      commits = commits.slice(currentCommitIndex + 1);
    }
  } else {
    // As the local repository is uninitialized, we should not process changes commit by commit,
    // we should just use the latest commit.
    // (May return empty array if the repository is uninitialized)
    commits.push(...(await getCommitsPage(1, 1)));
  }
  return commits.map((commit) => {
    if (!commit.commit.committer?.date) {
      // GitHub API docs says that commiter may be null and date is optional, but it's not
      // documented when it may happen.
      throw new Error('Missing commiter.date in commit');
    }
    return {
      sha: commit.sha,
      treeSha: commit.commit.tree.sha,
      commitTime: commit.commit.committer.date
    };
  });

  async function getCommitsPage(
    page: number,
    pageSize: number,
    since: string | undefined = undefined
  ) {
    const [commitsResponse, commitsError] = await trial(() => {
      return octokitRequest('GET /repos/{owner}/{repo}/commits', {
        ...commonRequestParams,
        since,
        per_page: pageSize,
        page,
        request: {
          cache: 'reload' // bypass cache
        }
      });
    });
    if (commitsError) {
      throw new NoteszError('Failed to fetch the list of commits from GitHub', {
        cause: commitsError
      });
    }
    return commitsResponse.data;
  }
}
