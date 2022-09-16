import * as core from '@actions/core'
import * as github from '@actions/github'
import { readConfig } from './ghfs'

async function run() {
    try {
        const ghToken = core.getInput('gh_token');
        const octokit = github.getOctokit(ghToken);
        const repo = core.getInput('repo').split("/")
        readConfig({ owner: repo[0], name: repo[1] }, octokit)
    } catch(e) {
        
    }
}

run()