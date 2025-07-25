# Continue n8n-node-calcslive Development

I'm continuing development of an n8n custom node for CalcsLive API integration. The project is in progress with legacy mode working but enhanced mode needing completion.

## Current State
- **Legacy mode**: ✅ Fully functional with manual JSON input/output
- **Enhanced mode**: 🟡 FixedCollection UI implemented but needs refinement
- **Dynamic loading**: ✅ Symbols update when articleId changes
- **Issues**: Field clearing, default value population, UX polish needed

## Key Files to Review
- `CalcsLive.node.ts` - main implementation 
- `SPEC-SUMMARY.md` - detailed current state
- `CLAUDE.md` - project instructions (needs updating)

## Current Issues to Fix

### 1. Add multiOptions element to populate all symbols
When a new articleID is validated, populate all associated symbols to multiOptions for user pick:

### 2. Auto-populate Defaults in FixedCollection
When user selects a symbol in multiOptions in enhanced mode, automatically:
- Show its Value field and set the Value field to the symbol's `faceValue` from metadata
- Show its Unit field and set the Unit field to the symbol's default `unit` from metadata; use dropdown for unit, with the default pre-selected 
When user deselect a symbol in multiOptions in enhanced mode, automatically:
- Hide the value field
- Hide the value field

### 3. Clear Old Data on ArticleId Change  
When articleId changes, clear/reset:
- Existing fixedCollection rows
- Previously selected values
- Ensure clean slate for new calc

### 4. Improve User Experience
- Make default selection automatic and intuitive
- Better field labeling and descriptions
- Smooth workflow from symbol selection to execution

## Technical Context
- Using `loadOptionsDependsOn: ['articleId']` for dynamic symbol loading
- Embedding JSON metadata in loadOptions values for later use
- FixedCollection structure: `{ pq: [{ symbol, value, unit }] }`
- Validate API provides: `inputPQs`, `outputPQs`, `availableUnits`

## Goal
Complete the enhanced mode to provide a table-like interface where:
1. User enters articleId → symbols auto-load
2. User adds PQ rows → symbols/units populate from calc  
3. User modifies values/units as needed → calculation executes
4. Clean, intuitive workflow matching SaaS interface

Please help me continue from where we left off, focusing on the auto-population and field clearing issues first.