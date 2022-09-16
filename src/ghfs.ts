import { GitHub } from "@actions/github/lib/utils"
import { Base64 } from "js-base64"
import { Config } from "../index"


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

async function updateLinkData(name: string, repo: Repo, octokit: InstanceType<typeof GitHub>) {
    let data: string[] = JSON.parse((await getFileContents(`static/links/${name}.json`, repo, octokit))[1])
    let cfg = new Config(`monun/${name}`, await getLatestCommit({ owner: "monun", name }, octokit), data)
    let newLinkData: string = JSON.stringify(await cfg.loadConfig())

    try {
        let rawOldLinkData = await getFileContents(`static/links/${name}-links.json`, repo, octokit)
        let oldLinkData: string[] = JSON.parse(rawOldLinkData[1])

        let jsonNew: string[] = JSON.parse(newLinkData)
        oldLinkData.forEach((x, index) => {
            if (x in jsonNew) {
                delete jsonNew[index]
            } else {
                return
            }
        })
        if (jsonNew.length != 0) {
            return
        }
        
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
    } catch(e) {
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