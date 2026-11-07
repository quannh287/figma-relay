# Design notes

Why some non-obvious parts of this server look the way they do. Written while building a design system with it: cloning 19 components to another page and giving each a wireframe variant.

## Why `run_script` exists

Atomic tools cost one call per node, and batching with `node_ids[]` only helps when every node gets the *same* value. Real jobs compute per node. Recolouring that cloned design system meant deriving each grey from the original colour's luminance: 197 fill writes and 85 stroke writes across 288 nodes. No combination of parameters expresses that.

Measured on that job: **~25 calls with `run_script`, ~80+ without** — and without it the model must also pull all 288 nodes' fills into context to group them.

Contrary to a common assumption, Figma's plugin sandbox **does** allow dynamic code (`new Function`). Scripts can `await`, and returning a live node is rejected rather than breaking the bridge.

Prefer the atomic tools for single edits: their errors point at one node, while a failed script can leave the document half-changed.

## Why mutating tools are quiet

They return `{ok, ids}`. A 50-node batch echoing a full node summary each buries whatever the caller was doing. `verbose: true` restores the summaries.

## Why every scope is named

Tools act on the page the user currently has open, and the user can switch pages mid-session. That silently changes what a call operates on — `find_nodes` once returned nodes from a different page while the intended page was empty. So `find_nodes` reports the `scope` it searched and accepts a `page`, and `list_pages` / `set_current_page` make the target explicit.

## Figma API behaviour worth knowing

These cost real debugging time; the handlers now absorb them.

- **`combineAsVariants` stacks variants** at the same coordinates, and a `COMPONENT_SET` **never grows to fit its children**. Two silent failures at once: variants overlap, the overflow is clipped, and the symptom looks like a broken clone. `combine_as_variants` lays them out and resizes.
- **Set bounds update lazily.** Reading `width`/`height` right after moving children returns the old value; re-read in a later call.
- **The sandbox has no filesystem or network.** Anything touching either belongs in the Go server — see `download_assets`, `import_image`, `get_screenshot`.
- **Overlays can't be anchored to the bottom**: `overlayPositionType` is read-only and `overlayRelativePosition` only applies with `MANUAL`. Bottom sheets are built as full-screen overlay frames with a scrim.
- **Instance children have derived ids** of the form `I<instance-id>;<source-child-id>`. Tools accept them.
- **`clone()` escapes a SECTION.** Cloning a node whose parent is a section puts the copy on the page at 0,0, not beside the original, despite what the docs say about inheriting the parent. Pass an explicit parent and position.
- **`figma` cannot be wrapped.** Its properties are non-configurable and non-writable, so a Proxy `get` trap may not return anything but the original value — returning even `fn.bind(figma)` makes every call throw `proxy: inconsistent get`. A plain object is no better: `for…in figma` yields no keys, so there is nothing to copy. This rules out observing calls from the outside, which is why a failed `run_script` cannot clean up after itself.
- **`addComponentProperty` with `INSTANCE_SWAP`** wants the component's node id. Its published key is rejected with "Property value is incompatible with component property type".

## Why one command at a time per file

The plugin's `figma.ui.onmessage` is `async` and does not queue, so two sessions
driving one file used to interleave at every `await`: one resolved node handles
while the other deleted or swapped those nodes. The bridge now gives each plugin
window a one-slot turn (`pluginConn.turn`). Two details matter:

- **The wait for a turn sits outside the caller's timeout**, or a 15s call would
  die behind a 150s screenshot. A peer waits `timeout + maxQueueWait` for the
  same reason.
- **A timeout releases the turn.** Figma cannot abort a running command, so
  holding it would lock the file for everyone until that command finished.

A consequence worth using: `run_script` holds the window for its whole run, so it
is the transaction boundary for read-then-write sequences — until it times out.

### Not done: per-file leases (phase 1)

The turn protects one call, not a sequence: between an agent's `find_nodes` and
its `set_fills`, another session can still invalidate the ids. The shape if that
ever hurts in practice:

- `claim_file {ttl_seconds}` / `release_file`; while a lease is live the bridge
  rejects *writes* from other sessions and lets reads through, so another agent
  can still diagnose what is going on.
- Caller identity has to reach `CallFile`: the owner session is one caller, each
  peer connection another, so a session id threads through `Router.Call` and the
  peer protocol — a `ProtocolVersion` bump.
- Hang protection: TTL is mandatory and capped (~5 min), and a lease is dropped
  when its peer disconnects.
- The cost that keeps it unbuilt: two more tools in every session's context,
  including the single-agent sessions that are the majority.

Trigger to build it: real `node not found` / lost-override failures from two
sessions, on a sequence that genuinely does not fit in one script. Nothing here
helps against the user editing by hand, or against `⌘Z` — Figma is a multiplayer
document and that ceiling stays.

## Why screenshots report their scale

Output is capped so a huge page cannot return a multi-megabyte payload. A 9336 px frame came back as a 139×2000 thumbnail that looked like a real screenshot, so `get_screenshot` now reports the scale it applied and the source height, and takes `max_dimension`.
