/**
 * Protocol Editor
 *
 * Re-exports the main ProtocolEditor component
 *
 * This folder contains extracted sub-components:
 * - tabs/ - Tab content components (GeneralTab, CommandsTab, StructuresTab)
 * - modals/ - Modal dialogs (StructureEditModal, ElementEditModal)
 * - components/ - Shared components (StructurePreview)
 * - helpers.ts - Utility functions
 * - types.ts - TypeScript interfaces
 */

// Re-export the main component from the original file for backward compatibility
// The original file at ../ProtocolEditor.tsx will be updated to use the extracted components
export { default } from "../ProtocolEditor";
