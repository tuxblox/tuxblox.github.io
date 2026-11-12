# Update and Download Flags

These decide how TuxBlox updates itself and how it fetches what it downloads. Nothing here changes what a release contains.

| Flag | Default | What it decides |
|---|---|---|
| `tbxFlagDisableUpdater` | `false` | Whether TuxBlox checks for its own updates. Set it to `true` to keep a build you are testing from being replaced. Our server cannot set this one: see [How Flags Work](how-flags-work.md). |
| `tbxFlagEnableChannelToUpperChannelUpgradeOnBuildPromotion` | `true` | Whether an install following `canary` or `experimental` takes [a build from a more tested channel](../../getting-started/releases-and-updates.md) when that build is ahead of its own. Your channel setting is never changed either way. |
| `tbxFlagEnableParallelWorkersForRobloxInstaller` | `true` | Whether Roblox's files are downloaded several at a time while it is being installed. Switched off, they are fetched one after another, which is slower but gentler on a connection that struggles with several at once. |
| `tbxIntRobloxInstallerParallelWorkers` | `6` | How many of those downloads run at once, when the flag above allows any. Anything above 16 is treated as 16, and a value of nothing is treated as 4, because past a point it is more connections rather than more speed. |

## Which version of HTTP

Three flags decide which version of HTTP TuxBlox asks for, chosen by where the request is going. They exist so that a server which answers badly over one version can be moved to the other without waiting for a release.

| Flag | Default | Where it applies |
|---|---|---|
| `tbxStringHttpProtocolRbxCdn` | `"2"` | Requests to Roblox's own download servers |
| `tbxStringHttpProtocolCdn` | `"1.1"` | Requests for TuxBlox's own files, which is where releases come from |
| `tbxStringHttpProtocolOther` | `"2"` | Everything else, including the request that fetches these flags |

The value is the version as text: `"1.0"`, `"1.1"`, `"2"` or `"3"`. Anything else, including an empty value, leaves the choice to the networking library, which is what every request did before these flags existed, so an install that has never reached our server behaves exactly as it used to.
