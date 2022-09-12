# Surf
[![build](https://github.com/monun-docs/surf/actions/workflows/build.yml/badge.svg)](https://github.com/monun-docs/surf/actions/workflows/build.yml)

Find function declarations from GitHub!

## Get Started
Surf is provided as a GitHub action. You can use it by adding it in your workflows file like this.

|input|required|
|:--:|:--:|
|gh_token|required|

```yaml
# .github/workflows/workflow.yml
name: workflow
on:
  push:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  workflow:
    name: Workflow 
    runs-on: ubuntu-22.04
    steps:
      - name: Run Surf
        uses: monun-docs/surf@v1.0
        with:
          gh_token: ${{ secrets.GITHUB_TOKEN }}
```

## Configuration
The whole configuration file should be located at `static/links/config.json`, where `<repo name>` is a repository name (currently only available for monun's).

```json
[
    "<repo name>"
]
```

And the declarations to be rendered to `static/links/<repo name>.json`, where `<repo name>` is a repository name (currently only available for monun's).
```json
// example: tap.json
[
    "io.github.monun.tap.fake.FakeEntity#addPassenger",
    "io.github.monun.tap.fake.FakeEntity#removePassenger"
]
```

Then the results will be rendered to `static/links/<repo name>-links.json`. 

```json
// example: tap-links.json
{
    "io.github.monun.tap.fake.FakeEntity#removePassenger":"https://github.com/monun/tap/blob/master/tap-api/src/main/kotlin/io/github/monun/tap/fake/FakeEntity.kt#L40",
    "io.github.monun.tap.fake.FakeEntity#addPassenger":"https://github.com/monun/tap/blob/master/tap-api/src/main/kotlin/io/github/monun/tap/fake/FakeEntity.kt#L38"
}
```

## How To Use
You can use the data provided by surf from the parsed `<repo name>-links.json`

```js
let data = require("/static/links/<repo name>-links.json")
```

## License
This library is licensed under `CC BY-SA 4.0`

## Contributing
Feel free to contribute to either the search algorithm or the actions itself.