# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.15] - 2026-02-23

### Changed
- **Added authenticate method** to credentials for proper n8n authentication flow
- **Use httpRequestWithAuthentication** instead of manual Authorization headers
- **Use NodeConnectionType.Main** for inputs/outputs per n8n code review feedback
- **Removed requestDefaults** (not needed for programmatic nodes)
- **Removed apiKey from request body** - authentication now handled via credential authenticate method
- **Simplified credential test** - now uses GET request with authentication header

### Fixed
- **Workflow template**: Added Merge node to properly combine Cylinder Volume and Density inputs before Mass Calc
- **First-run execution**: Workflow now executes correctly on first run (no need for multiple executions)
- **README updated**: Corrected template file reference and article IDs
- **ESLint config**: Disabled conflicting rules to follow n8n code review guidance

### Technical
- Addresses n8n team code review feedback (feedback4)
- Proper credential authentication pattern for n8n community nodes
- CalcsLive API updated to support Bearer token authentication via Authorization header
- Passes `npm run lint` and `npm run typecheck` without errors

## [0.1.13] - 2026-02-21

### Added
- **n8n workflow template**: Sanitized demo workflow template for n8n community submission
- **YouTube demo embed**: Sticky note with embedded video in workflow template

### Changed
- **Template sanitization**: Removed all personal credential IDs and instance metadata
- **Improved sticky notes**: Better documentation within workflow template

### Technical
- Workflow template passes n8n submission guidelines review
- Template includes proper credential placeholders for user configuration

## [0.1.12] - 2026-01-27

### Changed
- **Removed process.env usage** to pass n8n security scan (`no-restricted-globals` rule)
- **Version metadata retained**: `_metadata.nodeVersion` still included in execution results

### Technical
- Passes `npx @n8n/scan-community-package` security validation

## [0.1.11] - 2026-01-27

### Added
- **Version in output metadata**: `_metadata.nodeVersion` now included in all execution results for debugging and version tracking

### Fixed
- **[HIGH] Added pairedItem property** to all returnData items for proper n8n item linking
- **[MEDIUM] Implemented continueOnFail support** in error handling to allow workflows to continue on errors

### Changed
- **Removed all console.log statements** from production code across all helper files:
  - `CalcsLive.node.ts` - removed 10 debug logging statements
  - `apiClient.ts` - removed 8 debug logging statements
  - `metadataCache.ts` - removed 11 debug logging statements
  - `optionsLoaders.ts` - removed 8 debug logging statements

### Technical
- Addresses n8n Community Engineering team feedback for n8n cloud approval
- Better error context with `itemIndex` in NodeOperationError

## [0.1.9] - 2025-09-19

### Added
- **YouTube Video Demo**

## [0.1.7] - 2025-09-11

### Added
- **Demo Workflow Showcase**: Interactive workflow demonstration with visual examples
- **Workflow Template**: Ready-to-import `calcslive-demo-workflow-template.json` with sanitized credentials
- **Assets folder**: Clean organization for user-facing images and resources
- **Composability Documentation**: Advanced explanation of calculation chaining patterns
- **Live Calculation Links**: Direct links to CalcsLive editor for demo calculations
- **Architectural Best Practices**: Q&A section explaining modular calculation design
- **Import Instructions**: Step-by-step workflow import guide in README

### Changed
- **Enhanced README.md**: Added demo workflow section with supporting calculation previews
- **Improved Documentation**: Better explanation of CalcsLive's composable architecture
- **Visual Examples**: Table format showcasing speed and mass calculations with live links
- **Developer Experience**: Cleaner separation of public assets vs development files

### Technical
- **Build Process**: Fixed TypeScript compilation issues in `ArticleMetadata` interface
- **Asset Management**: Improved gulpfile.js asset copying for SVG/PNG files
- **Repository Cleanup**: Enhanced .gitignore to exclude development folders (.claude/, UI/, .github/)

## [0.1.5] - 2025-09-08

### Fixed
- **CRITICAL**: API versioning consistency issue resolved
- Updated validate endpoint from `/api/n8n/validate` to `/api/n8n/v1/validate` to match calculate endpoint
- Both endpoints now use consistent v1 API structure with `response.data.article` format
- Eliminates version mismatch errors in n8n workflows
- Improved debugging with unified API response handling

### Changed
- Enhanced `apiClient.ts` with consistent v1 API integration
- Better error handling across all CalcsLive API endpoints

## [0.1.4] - 2025-09-04

### Added
- Comprehensive API reference documentation
- Enhanced workflow examples with IoT and batch processing
- Interactive units database reference link
- Detailed troubleshooting and error handling guide
- Input/Output PQ structure documentation

### Changed
- Improved README.md with clearer installation instructions
- Enhanced quick start guide with 5-minute setup flow
- Better error message explanations and solutions
- Updated credential setup instructions for 'n8n Integration'

### Fixed
- Credential test endpoint updated to versioned API (`/api/n8n/v1/test`)
- Package name consistency across all documentation
- npm badge URL corrected for scoped package

## [0.1.3] - 2025-09-04

### Added
- Missing credential test method for n8n community verification
- Proper `ICredentialTestRequest` implementation

### Changed
- Renamed credential file: `CalculationApi.credentials.ts` → `CalcsLiveApi.credentials.ts`
- Updated credential class name for consistency
- Fixed package.json references to new credential filename

### Fixed
- n8n community node verification requirements
- Automated CI/CD pipeline setup

## [0.1.2] - 2025-09-04

### Added
- GitHub Actions CI/CD pipeline
- Automated testing on Node.js 18.x and 20.x
- Dependabot configuration for security updates
- Automated npm publishing on version changes

### Changed
- Fixed package.json version script to avoid git conflicts

## [0.1.1] - 2025-09-03

### Added
- Enhanced mode with FixedCollection UI
- Dynamic PQ loading based on articleId
- Comprehensive error handling for all API responses
- Custom PNG icon support

### Changed
- Improved API integration with better error messages
- Enhanced credential management

### Fixed
- Unit validation and conversion accuracy
- API key authentication flow

## [0.1.0] - 2025-09-01

### Added
- Initial MVP release
- Legacy mode with manual JSON input/output
- Basic CalcsLive API integration
- Core unit-aware calculation functionality
- API key credential management
- Basic error handling

### Features
- Support for 540+ units across 64+ categories
- Automatic unit conversion
- n8n workflow integration
- CalcsLive calculation article support