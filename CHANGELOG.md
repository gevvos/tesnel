# Changelog

## [0.4.0](https://github.com/gevvos/tesnel/compare/tesnel-v0.3.2...tesnel-v0.4.0) (2026-05-09)


### Features

* add architecture metrics (Instability, Abstractness, Distance) ([129a96a](https://github.com/gevvos/tesnel/commit/129a96a685aa85d0c36611a47239c4efb9003737))
* add architecture metrics (Instability, Abstractness, Distance) ([68ad61f](https://github.com/gevvos/tesnel/commit/68ad61f0aabf423cf8e1b55137a2fa59c50820ec))


### Bug Fixes

* rename package to @gevvos/tesnel for npm publishing ([938f346](https://github.com/gevvos/tesnel/commit/938f3469e7e36414adbbd2368b7bcd56968c9c2f))

## [0.3.2](https://github.com/gevvos/tesnel/compare/tesnel-v0.3.1...tesnel-v0.3.2) (2026-05-06)


### Bug Fixes

* use npm trusted publishing instead of token ([5fcbcfa](https://github.com/gevvos/tesnel/commit/5fcbcfa9be22865620f0db0473879d2a73590e7b))

## [0.3.1](https://github.com/gevvos/tesnel/compare/tesnel-v0.3.0...tesnel-v0.3.1) (2026-05-06)


### Bug Fixes

* run build:ui before tests in release workflow ([d024728](https://github.com/gevvos/tesnel/commit/d02472836488e6142a82c0367eace62c14ccfe5c))

## [0.3.0](https://github.com/gevvos/tesnel/compare/tesnel-v0.2.0...tesnel-v0.3.0) (2026-05-06)


### Features

* add `tesnel lint` command for cycle detection in CI ([5383b88](https://github.com/gevvos/tesnel/commit/5383b881bb7dc6d326e251abddf5eab91b571101))
* add interactive graph visualization UI ([9ac3954](https://github.com/gevvos/tesnel/commit/9ac395485f787856e9c58ff998ca82f8c6973cf1))
* add MCP server for Claude Code integration ([ac60ef9](https://github.com/gevvos/tesnel/commit/ac60ef942a659f751775e1b8da088a36d46a750f))
* add Nuxt auto-imports support and directory entry ([4628dcb](https://github.com/gevvos/tesnel/commit/4628dcbeb9d49306ca29424035ee4374ab38f7e5))
* implement core CLI with recursive graph analysis ([37733ab](https://github.com/gevvos/tesnel/commit/37733ab2ecb4ca4e5dfe0d1f8a18ae6403da135d))
* init project ([89e0898](https://github.com/gevvos/tesnel/commit/89e089899827315ef200c82ba9929729e4bb5653))
* prepare for open-source release and npm publishing ([9cb0256](https://github.com/gevvos/tesnel/commit/9cb025658a4d60014a2d13c3a3ed8d337decde98))
* reach slider for import depth control, collapsed dir fixes ([b76ec76](https://github.com/gevvos/tesnel/commit/b76ec761c50a5ab2333651440c158108528a21ac))
* type-import distinction, Nuxt tsconfig fix, error resilience ([6df8431](https://github.com/gevvos/tesnel/commit/6df84317c884873f89cde85cac59d59a7bf61e4f))
* UI polish — legend, filters, visual distinction ([db04a3a](https://github.com/gevvos/tesnel/commit/db04a3a46a9921de5407a88e22e3606cc9f41e09))
* update deps, add vitest, configure project infrastructure ([45c3a2b](https://github.com/gevvos/tesnel/commit/45c3a2b592ffc2993cb6a7dc424e9932ff242207))
* use .tesnel/ directory for default output path ([0c9ef40](https://github.com/gevvos/tesnel/commit/0c9ef40547f0d327777d04c67ad28073c91ef581))


### Bug Fixes

* add explicit .js extensions to relative imports for nodenext moduleResolution ([754f501](https://github.com/gevvos/tesnel/commit/754f50151628df40516cd8c41af94abede8b4c49))
* add packageManager field for CI pnpm setup ([555349b](https://github.com/gevvos/tesnel/commit/555349b51758f461c650a3d7d45d3f285acda608))
* build UI before tests in CI (html-generator test needs template) ([9ab68cc](https://github.com/gevvos/tesnel/commit/9ab68cce3b3f6f5fcfe83fbc454e517afe924494))
* configure release-please to use minor bumps before v1 ([6bb0a84](https://github.com/gevvos/tesnel/commit/6bb0a84574566fea291e0e822c7c2be9d1e0f23b))
* configure release-please to use minor bumps before v1 ([acdf15f](https://github.com/gevvos/tesnel/commit/acdf15fca51dd4ff6d22a075814693f1a7f9567d))
* correct edge highlighting on hover and support .js→.ts extension mapping ([e86c632](https://github.com/gevvos/tesnel/commit/e86c63283f9c6e0b72ab4044d5d70dfedb32a78c))

## [0.2.0](https://github.com/gevvos/tesnel/compare/tesnel-v0.1.0...tesnel-v0.2.0) (2026-05-06)


### Features

* add `tesnel lint` command for cycle detection in CI ([5383b88](https://github.com/gevvos/tesnel/commit/5383b881bb7dc6d326e251abddf5eab91b571101))
* add interactive graph visualization UI ([9ac3954](https://github.com/gevvos/tesnel/commit/9ac395485f787856e9c58ff998ca82f8c6973cf1))
* add MCP server for Claude Code integration ([ac60ef9](https://github.com/gevvos/tesnel/commit/ac60ef942a659f751775e1b8da088a36d46a750f))
* add Nuxt auto-imports support and directory entry ([4628dcb](https://github.com/gevvos/tesnel/commit/4628dcbeb9d49306ca29424035ee4374ab38f7e5))
* implement core CLI with recursive graph analysis ([37733ab](https://github.com/gevvos/tesnel/commit/37733ab2ecb4ca4e5dfe0d1f8a18ae6403da135d))
* init project ([89e0898](https://github.com/gevvos/tesnel/commit/89e089899827315ef200c82ba9929729e4bb5653))
* prepare for open-source release and npm publishing ([9cb0256](https://github.com/gevvos/tesnel/commit/9cb025658a4d60014a2d13c3a3ed8d337decde98))
* reach slider for import depth control, collapsed dir fixes ([b76ec76](https://github.com/gevvos/tesnel/commit/b76ec761c50a5ab2333651440c158108528a21ac))
* type-import distinction, Nuxt tsconfig fix, error resilience ([6df8431](https://github.com/gevvos/tesnel/commit/6df84317c884873f89cde85cac59d59a7bf61e4f))
* UI polish — legend, filters, visual distinction ([db04a3a](https://github.com/gevvos/tesnel/commit/db04a3a46a9921de5407a88e22e3606cc9f41e09))
* update deps, add vitest, configure project infrastructure ([45c3a2b](https://github.com/gevvos/tesnel/commit/45c3a2b592ffc2993cb6a7dc424e9932ff242207))
* use .tesnel/ directory for default output path ([0c9ef40](https://github.com/gevvos/tesnel/commit/0c9ef40547f0d327777d04c67ad28073c91ef581))


### Bug Fixes

* add explicit .js extensions to relative imports for nodenext moduleResolution ([754f501](https://github.com/gevvos/tesnel/commit/754f50151628df40516cd8c41af94abede8b4c49))
* add packageManager field for CI pnpm setup ([555349b](https://github.com/gevvos/tesnel/commit/555349b51758f461c650a3d7d45d3f285acda608))
* build UI before tests in CI (html-generator test needs template) ([9ab68cc](https://github.com/gevvos/tesnel/commit/9ab68cce3b3f6f5fcfe83fbc454e517afe924494))
* configure release-please to use minor bumps before v1 ([6bb0a84](https://github.com/gevvos/tesnel/commit/6bb0a84574566fea291e0e822c7c2be9d1e0f23b))
* configure release-please to use minor bumps before v1 ([acdf15f](https://github.com/gevvos/tesnel/commit/acdf15fca51dd4ff6d22a075814693f1a7f9567d))
* correct edge highlighting on hover and support .js→.ts extension mapping ([e86c632](https://github.com/gevvos/tesnel/commit/e86c63283f9c6e0b72ab4044d5d70dfedb32a78c))
