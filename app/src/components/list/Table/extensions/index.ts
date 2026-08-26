import type { CellData, RowData, TableFeatures } from '@tanstack/table-core';

// antd-style column options for every list-table column, carried on the
// v9-blessed `meta` slot (declaration merging on ColumnMeta — the extension
// point table-core documents for global column options):
//
//   align: cell + header text alignment ('left' default, like antd).
//   fixed: antd-style per-column pinning declaration — ListTable translates
//          it into the built-in columnPinningFeature's TABLE state and
//          renders the sticky CSS itself (the feature provides none).
//
// Why the meta slot and not top-level column defs? Augmenting
// ColumnDefBase_Core does NOT survive react-table's `export *` re-export
// under this repo's TS7 + bun-symlink resolution (silently unmerged);
// ColumnMeta does. Why meta.fixed and not pinning state directly? The built-
// in feature has no per-column "pinned" option (only enablePinning), so the
// declaration is translated to the library's state in ListTable.
//
// Rendering lives in ListTable — this extension is the type vocabulary only.
declare module '@tanstack/table-core' {
	interface ColumnMeta<
		in out TFeatures extends TableFeatures,
		in out TData extends RowData,
		TValue extends CellData = CellData,
	> {
		align?: 'left' | 'center' | 'right';
		fixed?: 'left' | 'right';
	}
}
