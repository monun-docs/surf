import { GitHub } from "@actions/github/lib/utils"
import { Base64 } from "js-base64"
import { Config } from "../index"
import * as core from '@actions/core'


async function getFileContents(name: string, repo: Repo, octokit: InstanceType<typeof GitHub>): Promise<[any, string]> {
    let response: any = (await octokit.rest.repos.getContent({
        owner: repo.owner,
        repo: repo.name,
        path: name
    })).data

    if ("message" in response) {
        throw Error(response.message)
    }

    return [response, Base64.decode(response.content)]
}

/// config.json
/// [
///     "tap",
///     "invfx",
///     "..."
/// ]
export async function readConfig(repo: Repo, octokit: InstanceType<typeof GitHub>) {
    let rawData = await getFileContents("static/links/config.json", repo, octokit);
    let data: string[] = JSON.parse(rawData[1])
    data.forEach(element => {
        updateLinkData(element, repo, octokit)
    });
      
}

async function getLatestCommit(repo: Repo, octokit: InstanceType<typeof GitHub>): Promise<string> {
    let data = (await octokit.rest.repos.listCommits({
        owner: repo.owner,
        repo: repo.name
    }))

    return data.data[0].sha
}

function isIdentical(prior: string[], latter: string[]): boolean {
    if (prior.length !== latter.length) { 
        return false
    }

    const counter = new Map()
    
    prior.forEach(value => {
        counter.set(value, (counter.get(value) ?? 0) + 1)
    })

    latter.forEach(value => { 
        counter.set(value, (counter.get(value) ?? 0) - 1)
    })

    return Array.from(counter.values()).every((count) => count === 0); 
}

async function updateLinkData(name: string, repo: Repo, octokit: InstanceType<typeof GitHub>) {
    let data: string[] = JSON.parse((await getFileContents(`static/links/${name}.json`, repo, octokit))[1])
    let cfg = new Config(`monun/${name}`, await getLatestCommit({ owner: "monun", name }, octokit), data)
    let newLinkData: string = JSON.stringify(await cfg.loadConfig())
    core.debug("Finished Loading Config")
    

    let isDifferent = false
    try {
        let rawOldLinkData = await getFileContents(`static/links/${name}-links.json`, repo, octokit)
        let oldLinkData: string[] = JSON.parse(rawOldLinkData[1])

        let jsonNew: string[] = JSON.parse(newLinkData)
        
        core.debug("Checking matches")
        core.debug(`old: ${JSON.stringify(oldLinkData)}`)
        core.debug(`new: ${JSON.stringify(jsonNew)}`)

        let identical = isIdentical(oldLinkData, jsonNew)

        core.debug("Finished checking matches")

        if (!identical) {
            octokit.rest.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: `static/links/${name}-links.json`,
                message: `Update ${name} links`,
                content: Base64.encode(newLinkData),
                committer: {
                    name: `MonunDocs Bot`,
                    email: "admin@monun.me",
                },
                author: {
                    name: "MonunDocs Bot",
                    email: "admin@monun.me",
                },
                sha: rawOldLinkData[0].sha
            })
        }
    } catch(e) {
        if (e instanceof Error) {
            core.debug(e.message)
        }
        if (isDifferent) {
            octokit.rest.repos.createOrUpdateFileContents({
                owner: repo.owner,
                repo: repo.name,
                path: `static/links/${name}-links.json`,
                message: `Update ${name} links`,
                content: Base64.encode(newLinkData),
                committer: {
                    name: `MonunDocs Bot`,
                    email: "admin@monun.me",
                },
                author: {
                    name: "MonunDocs Bot",
                    email: "admin@monun.me",
                }
            })
        }
    }
}