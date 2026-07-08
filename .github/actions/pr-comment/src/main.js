import { getInput, setFailed } from '@actions/core';
import { getOctokit } from '@actions/github';

async function run() {
  try {
    const owner = getInput('owner', { required: true });
    const repo = getInput('repo', { required: true });
    const pr_number = getInput('pr_number', { required: true });
    const token = getInput('token', { required: true });

    const octokit = new getOctokit(token);

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number,
    });

    let diffData = {
      addition: 0,
      deletions: 0,
      changes: 0
    };

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions;
      acc.deletions += file.deletions;
      acc.changes += file.changes;
      return acc;
    }, diffData);

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
        Pull request #${pr_number} has be updated with: \n\n
        - ${diffData.changes} changes \n
        - ${diffData.additions} additions \n
        - ${diffData.deletions} deletions
      `
    });

    for (const file of changedFiles) {
      const fileExtention = file.filename.split('.').pop();
      let label = '';
      switch(fileExtention) {
        case 'md':
          label = 'markdown';
          break;
        case 'js':
          label = 'javascript';
          break;
        case 'yml':
          label = 'yaml';
          break;
        case 'yaml':
          label = 'yaml';
          break;
        default:
          label = 'noextension';
      }
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: pr_number,
        labels: [label]
      });
    }
  } catch (error) {
    setFailed(error.message);
  }
}

run();
