# Install

Installing `dnsx` is easy. Simply pull it in via your package manager of choice, or download the binary directly.

## Package Managers

Choose your package manager of choice:

::: code-group

```sh [npm]
npm install --save-dev @stacksjs/dnsx
# npm i -d @stacksjs/dnsx

# or, install globally via
npm i -g @stacksjs/dnsx
```

```sh [bun]
bun install --dev @stacksjs/dnsx
# bun add --dev @stacksjs/dnsx
# bun i -d @stacksjs/dnsx

# or, install globally via
bun add --global @stacksjs/dnsx
```

```sh [pnpm]
pnpm add --save-dev @stacksjs/dnsx
# pnpm i -d @stacksjs/dnsx

# or, install globally via
pnpm add --global @stacksjs/dnsx
```

```sh [yarn]
yarn add --dev @stacksjs/dnsx
# yarn i -d @stacksjs/dnsx

# or, install globally via
yarn global add @stacksjs/dnsx
```

```sh [brew]
brew install dnsx # coming soon
```

```sh [pkgx]
pkgx dnsx # coming soon
```

:::

Read more about how to use it in the Usage section of the documentation.

## Binaries

Choose the binary that matches your platform and architecture:

::: code-group

```sh [macOS (arm64)]
# Download the binary
curl -L https://github.com/stacksjs/dnsx/releases/download/v0.9.1/dnsx-darwin-arm64 -o dnsx

# Make it executable
chmod +x dnsx

# Move it to your PATH
mv dnsx /usr/local/bin/dnsx
```

```sh [macOS (x64)]
# Download the binary
curl -L https://github.com/stacksjs/dnsx/releases/download/v0.9.1/dnsx-darwin-x64 -o dnsx

# Make it executable
chmod +x dnsx

# Move it to your PATH
mv dnsx /usr/local/bin/dnsx
```

```sh [Linux (arm64)]
# Download the binary
curl -L https://github.com/stacksjs/dnsx/releases/download/v0.9.1/dnsx-linux-arm64 -o dnsx

# Make it executable
chmod +x dnsx

# Move it to your PATH
mv dnsx /usr/local/bin/dnsx
```

```sh [Linux (x64)]
# Download the binary
curl -L https://github.com/stacksjs/dnsx/releases/download/v0.9.1/dnsx-linux-x64 -o dnsx

# Make it executable
chmod +x dnsx

# Move it to your PATH
mv dnsx /usr/local/bin/dnsx
```

```sh [Windows (x64)]
# Download the binary
curl -L https://github.com/stacksjs/dnsx/releases/download/v0.9.1/dnsx-windows-x64.exe -o dnsx.exe

# Move it to your PATH (adjust the path as needed)
move dnsx.exe C:\Windows\System32\dnsx.exe
```

::: tip
You can also find the `dnsx` binaries in GitHub [releases](https://github.com/stacksjs/dnsx/releases).
:::
