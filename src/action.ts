import * as core from '@actions/core'
import * as github from '@actions/github'
import { readConfig } from './ghfs'

async function run() {
    try {
        const ghToken = core.getInput('gh_token');
        const octokit = github.getOctokit(ghToken);
        readConfig({ owner: "monun-docs", name: "surf" }, octokit)
    } catch(e) {
        
    }
}

run()