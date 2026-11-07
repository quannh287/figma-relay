# Changelog

## [0.12.1](https://github.com/quannh287/figma-relay/compare/v0.12.0...v0.12.1) (2026-11-07)


### Bug Fixes

* **npm:** name the Windows platform packages "windows", not "win32" ([#16](https://github.com/quannh287/figma-relay/issues/16)) ([f83900e](https://github.com/quannh287/figma-relay/commit/f83900e34eef623f4d720c5b8748eaecea131e41))

## [0.12.0](https://github.com/quannh287/figma-relay/compare/v0.11.0...v0.12.0) (2026-11-07)


### Features

* **npm:** ship one prebuilt binary per platform ([#13](https://github.com/quannh287/figma-relay/issues/13)) ([76deeeb](https://github.com/quannh287/figma-relay/commit/76deeebbe0152b9cc2098eec5855f5bd0427dfc0))

## [0.11.0](https://github.com/quannh287/figma-relay/compare/v0.10.0...v0.11.0) (2026-11-07)


### Features

* **bridge:** serialize commands per Figma file so sessions stop interleaving ([f7f2863](https://github.com/quannh287/figma-relay/commit/f7f286378373345e91865fafafa2cd6356e2a0f4))
* **cli:** add an uninstall subcommand ([a831cbd](https://github.com/quannh287/figma-relay/commit/a831cbdbed2c04ff2a40f99dec14f77e3d055f2f))
* **tools:** child bounds in get_screenshot, warn when clone_node copies a flow start ([585beab](https://github.com/quannh287/figma-relay/commit/585beab69290d197116d206c11172188ff974ac2))
* **variables:** resolve aliased token values in get_variable_defs ([2e5298a](https://github.com/quannh287/figma-relay/commit/2e5298a863c89fff3882bbb167acf0fdf60e6c5e))


### Bug Fixes

* **bridge:** tell the caller what to do after an idle timeout ([efb9514](https://github.com/quannh287/figma-relay/commit/efb951452ce2dd64d26759a7b3ddc4658ebf48ad))
* **bridge:** tell the user how to reconnect when the plugin drops mid-call ([af91629](https://github.com/quannh287/figma-relay/commit/af916297223474648bd6b03cdc56d7722a5977dd))

## [0.10.0](https://github.com/quannh287/figma-relay/compare/v0.9.1...v0.10.0) (2026-10-23)


### Features

* **plugin:** follow Figma's light/dark theme via themeColors ([ce45ad3](https://github.com/quannh287/figma-relay/commit/ce45ad35c4eba751a400794199f705e96490219e))

## [0.9.1](https://github.com/quannh287/figma-relay/compare/v0.9.0...v0.9.1) (2026-10-23)


### Bug Fixes

* rename MCP server to figma-relay to match the figrelay package ([970fdd6](https://github.com/quannh287/figma-relay/commit/970fdd657137a2b9b7321fa328a505828d11cec2))

## [0.9.0](https://github.com/quannh287/figma-relay/compare/v0.8.1...v0.9.0) (2026-10-19)


### Features

* **plugin:** let the UI collapse to a dot ([e92cf2e](https://github.com/quannh287/figma-relay/commit/e92cf2e9ceb7c306d6586ed100f6293129b918f8))
* **skills:** ship agent skills for the Figma workflows ([1ddec36](https://github.com/quannh287/figma-relay/commit/1ddec3607b3c2b4904ce416234f1b37f2cdc4b61))


### Bug Fixes

* **tools:** warn that resize_nodes resets auto-layout sizing modes ([d3d4696](https://github.com/quannh287/figma-relay/commit/d3d46967bf4483c27fd06e62a229e6a7287e3b67))

## [0.8.1](https://github.com/quannh287/figma-relay/compare/v0.8.0...v0.8.1) (2026-10-19)


### Bug Fixes

* **plugin:** tell users to restart the AI client when the server is outdated ([ca08c3e](https://github.com/quannh287/figma-relay/commit/ca08c3e12a5e8e5caf775c7616918f2db675a17e))
